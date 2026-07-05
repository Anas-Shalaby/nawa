"use server";

import type { TimeSlot } from "@/lib/booking/types";
import { fetchAvailableSlotsPublic } from "@/lib/queries/publicBooking";

export async function getAvailableSlots(
  tenantSlug: string,
  tenantId: string,
  serviceId: string,
  locale: string,
): Promise<TimeSlot[]> {
  const { fetchTenantBySlugPublic } = await import("@/lib/queries/publicBooking");
  const tenant = await fetchTenantBySlugPublic(tenantSlug);

  if (!tenant || tenant.id !== tenantId) {
    throw new Error("Clinic not found.");
  }

  return fetchAvailableSlotsPublic(tenantId, serviceId, locale);
}
