"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import { requirePermission } from "@/lib/auth/staffPermissions";
import { isSlotBlockingStatus } from "@/lib/scheduling/slotBlocking";
import { hasSlotConflict } from "@/lib/scheduling/slotConflict";
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

function revalidateAppointmentPaths() {
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/dashboard/upcoming", "page");
  revalidatePath("/[locale]/dashboard/agenda", "page");
  revalidatePath("/[locale]/dashboard/patients", "page");
}

/**
 * Updates appointment status. When status is `no_show`, increments patient strike count.
 * Confirmed appointments reserve a slot; pending appointments do not.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
): Promise<UpdateStatusResult> {
  try {
    const denied = await requirePermission("queue.manage");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, patient_id, status, appointment_date")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    const wasBlocking = isSlotBlockingStatus(appointment.status);
    const willBlock = isSlotBlockingStatus(newStatus);

    if (willBlock && !wasBlocking) {
      const conflict = await hasSlotConflict(
        supabase,
        tenantId,
        appointment.appointment_date,
        appointmentId,
      );

      if (conflict) {
        return { success: false, error: "This time slot is already booked." };
      }
    }

    const updatePayload: Record<string, unknown> = { status: newStatus };
    const nowIso = new Date().toISOString();

    if (newStatus === "checked_in") {
      updatePayload.checked_in_at = nowIso;
    }
    if (newStatus === "in_session") {
      updatePayload.session_started_at = nowIso;
      if (appointment.status !== "checked_in") {
        updatePayload.checked_in_at = nowIso;
      }
    }
    if (newStatus === "completed") {
      updatePayload.completed_at = nowIso;
    }

    let updateError = (
      await supabase
        .from("appointments")
        .update(updatePayload)
        .eq("id", appointmentId)
        .eq("tenant_id", tenantId)
    ).error;

    if (updateError?.message?.includes("checked_in_at")) {
      const fallback = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId)
        .eq("tenant_id", tenantId);
      updateError = fallback.error;
    }

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

    revalidateAppointmentPaths();
    return { success: true };
  } catch (error) {
    console.error("[updateAppointmentStatus]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

/**
 * Marks appointment as no-show and increments the patient's strike (no_show_count).
 * Returns the new strike count when successful.
 */
export async function markAppointmentNoShow(
  appointmentId: string,
  patientId: string,
): Promise<MarkNoShowResult> {
  try {
    const denied = await requirePermission("queue.manage");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, patient_id, status")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .eq("patient_id", patientId)
      .single();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    if (appointment.status === "no_show" || appointment.status === "canceled") {
      return { success: false, error: "This appointment can no longer receive a strike." };
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("no_show_count")
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .single();

    if (patientError || !patient) {
      return { success: false, error: patientError?.message ?? "Patient not found." };
    }

    const newNoShowCount = patient.no_show_count + 1;

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "no_show" })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .neq("status", "no_show")
      .neq("status", "canceled");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: strikeError } = await supabase
      .from("patients")
      .update({ no_show_count: newNoShowCount })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (strikeError) {
      return { success: false, error: strikeError.message };
    }

    return { success: true, newNoShowCount };
  } catch (error) {
    console.error("[markAppointmentNoShow]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not give strike.",
    };
  }
}
