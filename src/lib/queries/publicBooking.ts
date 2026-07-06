import type { Service, Tenant, TimeSlot } from "@/lib/booking/types";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { formatSlotLabel, getCairoTodayKey } from "@/lib/datetime/cairo";
import { getAvailableSlots as computeAvailableSlots } from "@/actions/slots";
import { getClinicWhatsAppFallback } from "@/utils/supabase/config";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import { isSubscriptionRowActive } from "@/lib/subscriptions/utils";

/**
 * Public booking reads — server-only via service role, scoped by slug / tenant_id.
 * Never expose the service role client to the browser.
 */
export async function fetchTenantBySlugPublic(slug: string): Promise<Tenant | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load clinic: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("tenant_subscriptions")
    .select("status, ends_at")
    .eq("tenant_id", data.id)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(`Failed to verify clinic subscription: ${subscriptionError.message}`);
  }

  if (!isSubscriptionRowActive(subscription)) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    whatsappNumber: getClinicWhatsAppFallback(),
    type: "dental",
  };
}

export async function fetchServicesPublic(tenantId: string): Promise<Service[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return (data ?? []).map(mapServiceRow);
}

export async function fetchAvailableSlotsPublic(
  tenantId: string,
  serviceId: string,
  locale = "ar",
  date = getCairoTodayKey(),
): Promise<TimeSlot[]> {
  const supabase = createServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("id", serviceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (serviceError) {
    throw new Error(`Failed to validate service: ${serviceError.message}`);
  }

  if (!service) {
    throw new Error("Service not found for this clinic.");
  }

  const mapped = mapServiceRow(service);
  const times = await computeAvailableSlots(tenantId, date, mapped.durationMinutes);

  return times.map((time) => ({
    id: `slot-${date}-${time}`,
    time,
    label: formatSlotLabel(time, locale, date),
    available: true,
  }));
}

export async function resolveTenantIdBySlug(slug: string): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve clinic: ${error.message}`);
  }

  return data?.id ?? null;
}

/** @deprecated Use fetchTenantBySlugPublic for the patient portal. */
export const fetchTenantBySlug = fetchTenantBySlugPublic;

/** @deprecated Use fetchServicesPublic for the patient portal. */
export const fetchServices = fetchServicesPublic;

/** @deprecated Use fetchAvailableSlotsPublic for the patient portal. */
export const fetchAvailableSlots = fetchAvailableSlotsPublic;
