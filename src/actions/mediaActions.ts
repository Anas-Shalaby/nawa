"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import { revalidatePath } from "next/cache";
import {
  buildEhrStoragePath,
  resolveImageMimeType,
  validateEhrImage,
} from "@/lib/media/storage";
import { EHR_BUCKET, type PatientMediaRecord, type PatientMediaTag } from "@/lib/media/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface MediaActionResult {
  success: boolean;
  media?: PatientMediaRecord;
  filePath?: string;
  error?: string;
}

function revalidatePatientMediaPaths(patientId: string) {
  revalidatePath("/[locale]/dashboard/patients/[id]", "page");
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath(`/[locale]/dashboard/patients/${patientId}`, "page");
}

function isPatientMediaTag(value: unknown): value is PatientMediaTag {
  return value === "before" || value === "after" || value === "x-ray" || value === "general";
}

/** Upload image to Storage + insert patient_media — runs on the server with session cookies. */
export async function uploadPatientMedia(formData: FormData): Promise<MediaActionResult> {
  try {
    const denied = await requirePermission("ehr.write");
    if (denied) return { success: false, error: denied };

    const file = formData.get("file");
    const patientId = formData.get("patientId");
    const tag = formData.get("tag");
    const notesRaw = formData.get("notes");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No image selected." };
    }

    if (typeof patientId !== "string" || !patientId) {
      return { success: false, error: "Invalid patient." };
    }

    if (!isPatientMediaTag(tag)) {
      return { success: false, error: "Invalid image tag." };
    }

    const mimeType = resolveImageMimeType(file);
    const validationError = validateEhrImage(file, mimeType);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (patientError || !patient) {
      return { success: false, error: "Patient not found." };
    }

    const filePath = buildEhrStoragePath(tenantId, patientId, mimeType);

    const { error: uploadError } = await supabase.storage.from(EHR_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
    });

    if (uploadError) {
      console.error("[uploadPatientMedia] storage", uploadError);
      return { success: false, error: uploadError.message };
    }

    const notes =
      typeof notesRaw === "string" && notesRaw.trim().length > 0 ? notesRaw.trim() : null;

    const { data, error } = await supabase
      .from("patient_media")
      .insert({
        tenant_id: tenantId,
        patient_id: patientId,
        file_path: filePath,
        tag,
        notes,
      })
      .select("id, tenant_id, patient_id, file_path, tag, notes, created_at")
      .single();

    if (error || !data) {
      await supabase.storage.from(EHR_BUCKET).remove([filePath]);
      return { success: false, error: error?.message ?? "Could not save media record." };
    }

    revalidatePatientMediaPaths(patientId);

    return {
      success: true,
      media: {
        id: data.id,
        tenantId: data.tenant_id,
        patientId: data.patient_id,
        filePath: data.file_path,
        tag: data.tag,
        notes: data.notes,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("[uploadPatientMedia]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}

export async function insertPatientMediaRecord(input: {
  patientId: string;
  filePath: string;
  tag: PatientMediaTag;
  notes?: string | null;
}): Promise<MediaActionResult> {
  try {
    const denied = await requirePermission("ehr.write");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const expectedPrefix = `${tenantId}/${input.patientId}/`;
    if (!input.filePath.startsWith(expectedPrefix)) {
      return { success: false, error: "Invalid file path for this patient." };
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", input.patientId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (patientError || !patient) {
      return { success: false, error: "Patient not found." };
    }

    const { data, error } = await supabase
      .from("patient_media")
      .insert({
        tenant_id: tenantId,
        patient_id: input.patientId,
        file_path: input.filePath,
        tag: input.tag,
        notes: input.notes?.trim() || null,
      })
      .select("id, tenant_id, patient_id, file_path, tag, notes, created_at")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Could not save media record." };
    }

    revalidatePatientMediaPaths(input.patientId);

    return {
      success: true,
      media: {
        id: data.id,
        tenantId: data.tenant_id,
        patientId: data.patient_id,
        filePath: data.file_path,
        tag: data.tag,
        notes: data.notes,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("[insertPatientMediaRecord]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save media record.",
    };
  }
}

export async function deletePatientMediaRecord(mediaId: string): Promise<MediaActionResult> {
  try {
    const denied = await requirePermission("ehr.write");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: row, error: fetchError } = await supabase
      .from("patient_media")
      .select("id, patient_id, file_path")
      .eq("id", mediaId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchError || !row) {
      return { success: false, error: fetchError?.message ?? "Media not found." };
    }

    const { error: deleteError } = await supabase
      .from("patient_media")
      .delete()
      .eq("id", mediaId)
      .eq("tenant_id", tenantId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    const { error: storageError } = await supabase.storage
      .from(EHR_BUCKET)
      .remove([row.file_path]);

    if (storageError) {
      console.error("[deletePatientMediaRecord] storage", storageError);
    }

    revalidatePatientMediaPaths(row.patient_id);

    return { success: true, filePath: row.file_path };
  } catch (error) {
    console.error("[deletePatientMediaRecord]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete media.",
    };
  }
}
