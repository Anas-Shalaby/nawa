import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArrivalSource } from "@/lib/dashboard/types";

/**
 * Best-effort arrival source stamp after appointment creation.
 * Silently no-ops when migration 025 has not been applied yet.
 */
export async function trySetAppointmentArrivalSource(
  supabase: SupabaseClient,
  tenantId: string,
  appointmentId: string,
  arrivalSource: ArrivalSource,
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ arrival_source: arrivalSource })
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId);

  if (
    error &&
    !error.message.includes("arrival_source") &&
    !error.message.includes("schema cache")
  ) {
    console.warn("[trySetAppointmentArrivalSource]", error.message);
  }
}
