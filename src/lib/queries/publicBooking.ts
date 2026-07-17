import type { Service, Tenant, TimeSlot } from "@/lib/booking/types";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { formatSlotLabel, getCairoTodayKey } from "@/lib/datetime/cairo";
import { getAvailableSlots as computeAvailableSlots } from "@/actions/slots";
import { getClinicWhatsAppFallback } from "@/utils/supabase/config";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import { isSubscriptionRowActive } from "@/lib/subscriptions/utils";

type TenantProfileRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  doctor_name: string | null;
  specialty: string | null;
  bio: string | null;
  credentials: unknown;
  avatar_url: string | null;
  cover_url: string | null;
  clinic_phone: string | null;
  clinic_location: string | null;
  clinic_latitude: number | null;
  clinic_longitude: number | null;
};

/**
 * Public booking reads — server-only via service role, scoped by slug / tenant_id.
 * Never expose the service role client to the browser.
 */
export async function fetchTenantBySlugPublic(slug: string): Promise<Tenant | null> {
  const supabase = createServiceRoleClient();

  const withProfile = await supabase
    .from("tenants")
    .select(
      "id, name, slug, is_active, doctor_name, specialty, bio, credentials, avatar_url, cover_url, clinic_phone, clinic_location, clinic_latitude, clinic_longitude",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  let data: TenantProfileRow | null = withProfile.data as TenantProfileRow | null;

  if (withProfile.error || !data) {
    const fallback = await supabase
      .from("tenants")
      .select("id, name, slug, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (fallback.error) {
      throw new Error(`Failed to load clinic: ${fallback.error.message}`);
    }

    if (!fallback.data) {
      return null;
    }

    data = {
      id: fallback.data.id,
      name: fallback.data.name,
      slug: fallback.data.slug,
      is_active: fallback.data.is_active,
      doctor_name: null,
      specialty: null,
      bio: null,
      credentials: [],
      avatar_url: null,
      cover_url: null,
      clinic_phone: null,
      clinic_location: null,
      clinic_latitude: null,
      clinic_longitude: null,
    };
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

  const credentials = Array.isArray(data.credentials)
    ? data.credentials.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    whatsappNumber: data.clinic_phone?.trim() || getClinicWhatsAppFallback(),
    location: data.clinic_location?.trim() || "",
    latitude: data.clinic_latitude ?? null,
    longitude: data.clinic_longitude ?? null,
    type: "dental",
    doctorName: data.doctor_name?.trim() || data.name,
    specialty: data.specialty?.trim() || "",
    bio: data.bio?.trim() || "",
    credentials,
    avatarUrl: data.avatar_url ?? null,
    coverUrl: data.cover_url ?? null,
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
