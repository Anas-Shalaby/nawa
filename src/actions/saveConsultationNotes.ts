"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type SaveConsultationNotesResult = {
  success: boolean;
  error?: string;
  target: "appointment" | "patient" | null;
};

/**
 * Saves consultation notes for the active workspace session.
 * Prefer appointment.doctor_notes when appointmentId is provided;
 * otherwise soft-mirror into patients.notes so the doctor is never blocked.
 */
export async function saveConsultationNotes(input: {
  patientId: string;
  notes: string;
  appointmentId?: string | null;
}): Promise<SaveConsultationNotesResult> {
  try {
    const denied = await requirePermission("ehr.write");
    if (denied) return { success: false, error: denied, target: null };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const trimmed = input.notes.trim();

    if (input.appointmentId) {
      const { error } = await supabase
        .from("appointments")
        .update({ doctor_notes: trimmed || null })
        .eq("id", input.appointmentId)
        .eq("patient_id", input.patientId)
        .eq("tenant_id", tenantId);

      if (error) {
        return { success: false, error: error.message, target: null };
      }

      revalidatePath("/[locale]/dashboard/patients/[id]", "page");
      revalidatePath("/[locale]/dashboard", "page");
      revalidatePath("/[locale]/dashboard/agenda", "page");
      return { success: true, target: "appointment" };
    }

    const { error } = await supabase
      .from("patients")
      .update({ notes: trimmed || null })
      .eq("id", input.patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message, target: null };
    }

    revalidatePath("/[locale]/dashboard/patients/[id]", "page");
    return { success: true, target: "patient" };
  } catch (error) {
    console.error("[saveConsultationNotes]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save notes.",
      target: null,
    };
  }
}
