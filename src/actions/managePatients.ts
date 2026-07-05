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

function revalidatePatientPaths() {
  revalidatePath("/[locale]/dashboard/patients", "page");
  revalidatePath("/[locale]/dashboard", "page");
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
