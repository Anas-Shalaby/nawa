"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type PrescriptionLineInput = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type SavePrescriptionResult = {
  success: boolean;
  error?: string;
  formattedText?: string;
};

function formatPrescriptionBlock(
  lines: PrescriptionLineInput[],
  doctorName: string,
  dateLabel: string,
): string {
  const body = lines
    .map(
      (line, index) =>
        `${index + 1}. ${line.name}\n   ${line.dosage} — ${line.frequency} — ${line.duration}${
          line.notes.trim() ? `\n   ملاحظة: ${line.notes.trim()}` : ""
        }`,
    )
    .join("\n");

  return [
    `—— روشتة إلكترونية ——`,
    `التاريخ: ${dateLabel}`,
    `الطبيب: ${doctorName}`,
    ``,
    `Rx`,
    body,
    `—— نهاية الروشتة ——`,
  ].join("\n");
}

export async function savePatientPrescription(input: {
  patientId: string;
  doctorName: string;
  dateLabel: string;
  lines: PrescriptionLineInput[];
}): Promise<SavePrescriptionResult> {
  try {
    if (!input.lines.length) {
      return { success: false, error: "Add at least one medicine." };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("id, notes")
      .eq("id", input.patientId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !patient) {
      return { success: false, error: fetchError?.message ?? "Patient not found." };
    }

    const block = formatPrescriptionBlock(
      input.lines,
      input.doctorName,
      input.dateLabel,
    );
    const existing = (patient.notes ?? "").trim();
    const nextNotes = existing ? `${existing}\n\n${block}` : block;

    const { error: updateError } = await supabase
      .from("patients")
      .update({ notes: nextNotes })
      .eq("id", input.patientId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/[locale]/dashboard/patients/[id]", "page");
    return { success: true, formattedText: block };
  } catch (error) {
    console.error("[savePatientPrescription]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save prescription.",
    };
  }
}
