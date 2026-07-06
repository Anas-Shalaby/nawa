"use server";

import type { TimeSlot } from "@/lib/booking/types";
import { formatSlotLabel } from "@/lib/datetime/cairo";
import { getAvailableSlots as getAvailableSlotTimes } from "@/actions/slots";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { createServiceRoleClient } from "@/utils/supabase/auth";

export async function getAvailableSlots(
  tenantSlug: string,
  tenantId: string,
  serviceId: string,
  date: string,
  locale: string,
): Promise<TimeSlot[]> {
  const { fetchTenantBySlugPublic } = await import("@/lib/queries/publicBooking");
  const tenant = await fetchTenantBySlugPublic(tenantSlug);

  if (!tenant || tenant.id !== tenantId) {
    throw new Error("Clinic not found.");
  }

  const supabase = createServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("id", serviceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (serviceError || !service) {
    throw new Error("Service not found for this clinic.");
  }

  const mapped = mapServiceRow(service);
  const times = await getAvailableSlotTimes(tenantId, date, mapped.durationMinutes);

  return times.map((time) => ({
    id: `slot-${date}-${time}`,
    time,
    label: formatSlotLabel(time, locale, date),
    available: true,
  }));
}
