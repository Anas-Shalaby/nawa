"use server";

import { createServiceRoleClient } from "@/utils/supabase/auth";
import { verifyBookingTicketForAppointment } from "@/lib/booking/ticketToken";

export interface CancelAppointmentResult {
  success: boolean;
  error?: string;
}

const CANCELABLE_STATUSES = new Set(["pending", "confirmed"]);

export async function cancelAppointment(
  appointmentId: string,
  tenantSlug: string,
  accessToken: string,
): Promise<CancelAppointmentResult> {
  try {
    if (!verifyBookingTicketForAppointment(accessToken, appointmentId, tenantSlug)) {
      return { success: false, error: "Invalid or expired ticket." };
    }

    const supabase = createServiceRoleClient();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (tenantError || !tenant) {
      return { success: false, error: "Clinic not found." };
    }

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, tenant_id")
      .eq("id", appointmentId)
      .eq("tenant_id", tenant.id)
      .single();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    if (!CANCELABLE_STATUSES.has(appointment.status)) {
      return { success: false, error: "This appointment can no longer be cancelled." };
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("id", appointmentId)
      .eq("tenant_id", tenant.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[cancelAppointment]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Cancellation failed.",
    };
  }
}
