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
  errorCode?: "HAS_APPOINTMENTS" | "UNKNOWN";
}

export interface DependentInput {
  parentId: string;
  name: string;
  relationshipType: string;
}

const DEPENDENT_RELATIONSHIPS = new Set([
  "child",
  "spouse",
  "parent",
  "sibling",
  "other",
]);

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

/**
 * Adds a dependent under a master patient. The dependent inherits the master's
 * phone number (household contact) and links back via parent_id.
 */
export async function createDependent(
  input: DependentInput,
): Promise<ManagePatientResult> {
  const name = input.name.trim();
  const relationshipType = input.relationshipType.trim();

  if (name.length < 2) {
    return { success: false, error: "Dependent name is required." };
  }
  if (!DEPENDENT_RELATIONSHIPS.has(relationshipType)) {
    return { success: false, error: "Invalid relationship." };
  }
  if (!input.parentId) {
    return { success: false, error: "Master patient is required." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    // The master must exist in this tenant and itself be a master (no nesting).
    const { data: master, error: masterError } = await supabase
      .from("patients")
      .select("id, phone_number, parent_id")
      .eq("id", input.parentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (masterError) {
      return { success: false, error: masterError.message };
    }
    if (!master) {
      return { success: false, error: "Master patient not found." };
    }
    if (master.parent_id) {
      return {
        success: false,
        error: "Dependents cannot own their own dependents.",
      };
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        tenant_id: tenantId,
        name,
        // Share the master's contact number for the whole household.
        phone_number: master.phone_number,
        parent_id: master.id,
        relationship_type: relationshipType,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePatientPaths(input.parentId);
    return { success: true, patientId: data.id };
  } catch (error) {
    console.error("[createDependent]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not add dependent.",
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
    return { success: false, error: "Patient id is required.", errorCode: "UNKNOWN" };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (patientError || !patient) {
      return {
        success: false,
        error: patientError?.message ?? "Patient not found.",
        errorCode: "UNKNOWN",
      };
    }

    // Appointments reference patients with ON DELETE RESTRICT — remove them first.
    const { error: appointmentsError } = await supabase
      .from("appointments")
      .delete()
      .eq("patient_id", patientId)
      .eq("tenant_id", tenantId);

    if (appointmentsError) {
      return {
        success: false,
        error: appointmentsError.message,
        errorCode: "HAS_APPOINTMENTS",
      };
    }

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (error) {
      const blocked =
        error.code === "23503" || error.message.includes("violates foreign key");
      return {
        success: false,
        error: blocked
          ? "Patient has related records and cannot be deleted."
          : error.message,
        errorCode: blocked ? "HAS_APPOINTMENTS" : "UNKNOWN",
      };
    }

    revalidatePatientPaths();
    return { success: true, patientId };
  } catch (error) {
    console.error("[deletePatient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete patient.",
      errorCode: "UNKNOWN",
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
