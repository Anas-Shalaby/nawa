import type { SupabaseClient } from "@supabase/supabase-js";
import { SLOT_BLOCKING_STATUSES } from "@/lib/scheduling/slotBlocking";

export async function hasSlotConflict(
  supabase: SupabaseClient,
  tenantId: string,
  appointmentDateIso: string,
  excludeAppointmentId?: string,
): Promise<boolean> {
  let query = supabase
    .from("appointments")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("appointment_date", appointmentDateIso)
    .in("status", [...SLOT_BLOCKING_STATUSES]);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
