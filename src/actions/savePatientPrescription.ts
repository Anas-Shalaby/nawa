"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import {
  formatPrescriptionNotesBlock,
} from "@/lib/clinical/prescriptionFormat";
import type { PrescriptionLineInput } from "@/lib/clinical/prescriptionTypes";
import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type { PrescriptionLineInput };

export type SavePrescriptionResult = {
  success: boolean;
  error?: string;
  prescriptionId?: string;
  publicToken?: string;
  formattedText?: string;
};

function normalizeLines(lines: PrescriptionLineInput[]): PrescriptionLineInput[] {
  return lines
    .map((line) => ({
      medicineName: line.medicineName.trim(),
      doseAmount: (line.doseAmount || "1").trim(),
      form: (line.form || "قرص").trim(),
      frequency: line.frequency.trim(),
      duration: line.duration.trim(),
      notes: line.notes.trim(),
      isChronic: Boolean(line.isChronic),
      isCustom: Boolean(line.isCustom),
    }))
    .filter((line) => line.medicineName.length > 0);
}

export async function savePatientPrescription(input: {
  patientId: string;
  doctorName: string;
  clinicName: string;
  specialty?: string;
  dateLabel: string;
  lines: PrescriptionLineInput[];
  generalNotes?: string;
  duplicatedFromId?: string | null;
  /** Soft-mirror into patients.notes for legacy EHR readers. Default true. */
  mirrorToNotes?: boolean;
}): Promise<SavePrescriptionResult> {
  try {
    const denied = await requirePermission("ehr.prescribe");
    if (denied) return { success: false, error: denied };

    const lines = normalizeLines(input.lines);
    if (!lines.length) {
      return { success: false, error: "Add at least one medicine." };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("id, notes")
      .eq("id", input.patientId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !patient) {
      return { success: false, error: fetchError?.message ?? "Patient not found." };
    }

    const formattedText = formatPrescriptionNotesBlock({
      lines,
      doctorName: input.doctorName,
      dateLabel: input.dateLabel,
    });

    const { data: rx, error: rxError } = await supabase
      .from("prescriptions")
      .insert({
        tenant_id: tenantId,
        patient_id: input.patientId,
        created_by: user?.id ?? null,
        doctor_name: input.doctorName,
        clinic_name: input.clinicName,
        specialty: input.specialty ?? "",
        general_notes: input.generalNotes?.trim() || null,
        duplicated_from_id: input.duplicatedFromId ?? null,
      })
      .select("id, public_token")
      .single();

    if (rxError || !rx) {
      // Migration not applied — fall back to notes-only so clinics stay unblocked.
      if (rxError && /prescriptions|schema cache|does not exist/i.test(rxError.message)) {
        if (input.mirrorToNotes !== false) {
          const existing = (patient.notes ?? "").trim();
          const nextNotes = existing ? `${existing}\n\n${formattedText}` : formattedText;
          const { error: updateError } = await supabase
            .from("patients")
            .update({ notes: nextNotes })
            .eq("id", input.patientId)
            .eq("tenant_id", tenantId);
          if (updateError) return { success: false, error: updateError.message };
        }
        revalidatePath("/[locale]/dashboard/patients/[id]", "page");
        return { success: true, formattedText };
      }
      return { success: false, error: rxError?.message ?? "Could not create prescription." };
    }

    const linePayload = lines.map((line, index) => ({
      prescription_id: rx.id,
      tenant_id: tenantId,
      sort_order: index,
      medicine_name: line.medicineName,
      dose_amount: line.doseAmount,
      form: line.form,
      frequency: line.frequency,
      duration: line.duration,
      notes: line.notes,
      is_chronic: line.isChronic,
      is_custom: line.isCustom,
    }));

    const { error: linesError } = await supabase
      .from("prescription_lines")
      .insert(linePayload);

    if (linesError) {
      await supabase.from("prescriptions").delete().eq("id", rx.id);
      return { success: false, error: linesError.message };
    }

    // Upsert chronic sticky list for chronic lines
    const chronicLines = lines.filter((line) => line.isChronic);
    for (const line of chronicLines) {
      await supabase.from("patient_chronic_medications").upsert(
        {
          tenant_id: tenantId,
          patient_id: input.patientId,
          medicine_name: line.medicineName,
          dose_amount: line.doseAmount,
          form: line.form,
          frequency: line.frequency,
          duration: line.duration,
          notes: line.notes,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,patient_id,medicine_name" },
      );
    }

    if (input.mirrorToNotes !== false) {
      const existing = (patient.notes ?? "").trim();
      const nextNotes = existing ? `${existing}\n\n${formattedText}` : formattedText;
      await supabase
        .from("patients")
        .update({ notes: nextNotes })
        .eq("id", input.patientId)
        .eq("tenant_id", tenantId);
    }

    revalidatePath("/[locale]/dashboard/patients/[id]", "page");
    return {
      success: true,
      prescriptionId: rx.id,
      publicToken: rx.public_token,
      formattedText,
    };
  } catch (error) {
    console.error("[savePatientPrescription]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save prescription.",
    };
  }
}
