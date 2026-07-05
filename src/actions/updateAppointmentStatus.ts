"use server";

import type { AppointmentStatus } from "@/lib/dashboard/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface UpdateStatusResult {
  success: boolean;
  error?: string;
}

export interface MarkNoShowResult {
  success: boolean;
  newNoShowCount?: number;
  error?: string;
}

/**
 * Updates appointment status. When status is `no_show`, increments patient strike count.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
): Promise<UpdateStatusResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, patient_id, status")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (newStatus === "no_show") {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("no_show_count")
        .eq("id", appointment.patient_id)
        .eq("tenant_id", tenantId)
        .single();

      if (patientError || !patient) {
        return { success: false, error: patientError?.message ?? "Patient not found." };
      }

      const { error: strikeError } = await supabase
        .from("patients")
        .update({ no_show_count: patient.no_show_count + 1 })
        .eq("id", appointment.patient_id)
        .eq("tenant_id", tenantId);

      if (strikeError) {
        return { success: false, error: strikeError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[updateAppointmentStatus]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function markAppointmentNoShow(
  appointmentId: string,
  _patientId: string,
): Promise<MarkNoShowResult> {
  const result = await updateAppointmentStatus(appointmentId, "no_show");

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
