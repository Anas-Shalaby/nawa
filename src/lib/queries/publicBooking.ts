import type { Service, Tenant, TimeSlot } from "@/lib/booking/types";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import {
  buildAppointmentDateIso,
  formatSlotLabel,
  generateWorkingDaySlots,
  getCairoDayBounds,
} from "@/lib/datetime/cairo";
import { getClinicWhatsAppFallback } from "@/utils/supabase/config";
import { createServiceRoleClient } from "@/utils/supabase/auth";

/**
 * Public booking reads — server-only via service role, scoped by slug / tenant_id.
 * Never expose the service role client to the browser.
 */
export async function fetchTenantBySlugPublic(slug: string): Promise<Tenant | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load clinic: ${error.message}`);
  }

  if (!data) {
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
): Promise<TimeSlot[]> {
  const supabase = createServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (serviceError) {
    throw new Error(`Failed to validate service: ${serviceError.message}`);
  }

  if (!service) {
    throw new Error("Service not found for this clinic.");
  }

  const { startIso, endIso } = getCairoDayBounds();

  const { data: booked, error } = await supabase
    .from("appointments")
    .select("appointment_date, status")
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .lte("appointment_date", endIso)
    .not("status", "in", "(no_show,completed,canceled)");

  if (error) {
    throw new Error(`Failed to load booked slots: ${error.message}`);
  }

  const takenTimes = new Set(
    (booked ?? []).map((row) => {
      const date = new Date(row.appointment_date);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    }),
  );

  return generateWorkingDaySlots().map((time) => ({
    id: `slot-${time}`,
    time,
    label: formatSlotLabel(time, locale),
    available: !takenTimes.has(time),
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
