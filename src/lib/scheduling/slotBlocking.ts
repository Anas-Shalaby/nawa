import type { AppointmentStatus } from "@/lib/dashboard/types";

/** Statuses that reserve a doctor time slot on the public schedule. */
export const SLOT_BLOCKING_STATUSES = [
  "confirmed",
  "checked_in",
  "in_session",
] as const satisfies readonly AppointmentStatus[];

export function isSlotBlockingStatus(status: AppointmentStatus): boolean {
  return (SLOT_BLOCKING_STATUSES as readonly string[]).includes(status);
}
