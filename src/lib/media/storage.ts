import { createClient } from "@/utils/supabase/client";
import {
  EHR_ALLOWED_MIME_TYPES,
  EHR_BUCKET,
  EHR_MAX_FILE_BYTES,
  type PatientMediaTag,
} from "@/lib/media/types";

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    default:
      return "jpg";
  }
}

export function validateEhrImage(file: File): string | null {
  if (!EHR_ALLOWED_MIME_TYPES.includes(file.type as (typeof EHR_ALLOWED_MIME_TYPES)[number])) {
    return "Unsupported image type.";
  }

  if (file.size > EHR_MAX_FILE_BYTES) {
    return "Image exceeds 10 MB limit.";
  }

  return null;
}

export function buildEhrStoragePath(
  tenantId: string,
  patientId: string,
  file: File,
): string {
  const ext = extensionForMime(file.type);
  const fileId = crypto.randomUUID();
  return `${tenantId}/${patientId}/${fileId}.${ext}`;
}

export async function uploadEhrImageToStorage(
  file: File,
  tenantId: string,
  patientId: string,
): Promise<{ filePath: string } | { error: string }> {
  const validationError = validateEhrImage(file);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = createClient();
  const filePath = buildEhrStoragePath(tenantId, patientId, file);

  const { error } = await supabase.storage.from(EHR_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    return { error: error.message };
  }

  return { filePath };
}

export async function deleteEhrImageFromStorage(filePath: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(EHR_BUCKET).remove([filePath]);
  return error?.message ?? null;
}

export async function createSignedEhrUrls(
  filePaths: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (filePaths.length === 0) return {};

  const supabase = createClient();
  const urls: Record<string, string> = {};

  await Promise.all(
    filePaths.map(async (filePath) => {
      const { data, error } = await supabase.storage
        .from(EHR_BUCKET)
        .createSignedUrl(filePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        urls[filePath] = data.signedUrl;
      }
    }),
  );

  return urls;
}

export type { PatientMediaTag };
