"use server";

import { revalidatePath } from "next/cache";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import { toStoredPhoneNumber } from "@/lib/datetime/cairo";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface PatientInput {
  name: string;
  whatsapp: string;
  notes?: string | null;
}

export interface ManagePatientResult {
  success: boolean;
  patientId?: string;
  error?: string;
  newNoShowCount?: number;
}

function validatePatientInput(input: PatientInput): ManagePatientResult | PatientInput {
  const name = input.name.trim();
  const notes = input.notes?.trim() || null;
  const digits = normalizeEgyptPhone(input.whatsapp);

  if (name.length < 2) {
    return { success: false, error: "Patient name is required." };
  }

  if (!/^1[0125]\d{8}$/.test(digits)) {
    return { success: false, error: "Invalid WhatsApp number." };
  }

  return { name, whatsapp: toStoredPhoneNumber(digits), notes };
}

function revalidatePatientPaths(patientId?: string) {
  revalidatePath("/[locale]/dashboard/patients", "page");
  revalidatePath("/[locale]/dashboard", "page");
  if (patientId) {
    revalidatePath(`/[locale]/dashboard/patients/${patientId}`, "page");
  }
}

export async function createPatient(input: PatientInput): Promise<ManagePatientResult> {
  const validated = validatePatientInput(input);
  if ("success" in validated) return validated;

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data, error } = await supabase
      .from("patients")
      .insert({
        tenant_id: tenantId,
        name: validated.name,
        phone_number: validated.whatsapp,
        notes: validated.notes,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: error.code === "23505" ? "Phone number already exists." : error.message,
      };
    }

    revalidatePatientPaths();
    return { success: true, patientId: data.id };
  } catch (error) {
    console.error("[createPatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create patient.",
    };
  }
}

export async function updatePatient(
  patientId: string,
  input: PatientInput,
): Promise<ManagePatientResult> {
  const validated = validatePatientInput(input);
  if ("success" in validated) return validated;

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("patients")
      .update({
        name: validated.name,
        phone_number: validated.whatsapp,
        notes: validated.notes,
      })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      return {
        success: false,
        error: error.code === "23505" ? "Phone number already exists." : error.message,
      };
    }

    revalidatePatientPaths();
    return { success: true, patientId };
  } catch (error) {
    console.error("[updatePatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update patient.",
    };
  }
}

export async function archivePatient(patientId: string): Promise<ManagePatientResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("patients")
      .update({ is_archived: true })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePatientPaths();
    return { success: true, patientId };
  } catch (error) {
    console.error("[archivePatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not archive patient.",
    };
  }
}

export async function restorePatient(patientId: string): Promise<ManagePatientResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("patients")
      .update({ is_archived: false })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePatientPaths();
    return { success: true, patientId };
  } catch (error) {
    console.error("[restorePatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not restore patient.",
    };
  }
}

export async function deletePatient(patientId: string): Promise<ManagePatientResult> {
  if (!patientId) {
    return { success: false, error: "Patient id is required." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data, error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .select("id");

    if (error) {
      return {
        success: false,
        error:
          error.code === "23503"
            ? "This patient has related records and cannot be deleted. Archive them instead."
            : error.message,
      };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Patient not found." };
    }

    revalidatePatientPaths();
    return { success: true, patientId };
  } catch (error) {
    console.error("[deletePatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete patient.",
    };
  }
}

export async function clearPatientWarning(
  patientId: string,
): Promise<ManagePatientResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("patients")
      .update({ no_show_count: 0 })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePatientPaths(patientId);
    return { success: true, patientId, newNoShowCount: 0 };
  } catch (error) {
    console.error("[clearPatientWarning]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not clear warning.",
    };
  }
}

/**
 * Manually adds one discipline strike to a patient (increments no_show_count).
 */
export async function givePatientStrike(
  patientId: string,
): Promise<ManagePatientResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("id, no_show_count, is_archived")
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchError || !patient) {
      return { success: false, error: fetchError?.message ?? "Patient not found." };
    }

    if (patient.is_archived) {
      return { success: false, error: "Cannot give a strike to an archived patient." };
    }

    const newNoShowCount = patient.no_show_count + 1;

    const { data: updated, error: updateError } = await supabase
      .from("patients")
      .update({ no_show_count: newNoShowCount })
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (!updated) {
      return { success: false, error: "Patient not found." };
    }

    revalidatePatientPaths(patientId);
    return { success: true, patientId, newNoShowCount };
  } catch (error) {
    console.error("[givePatientStrike]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not give strike.",
    };
  }
}
