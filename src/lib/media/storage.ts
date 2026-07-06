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
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

/** Browsers (especially mobile) often leave file.type empty — infer from extension. */
export function resolveImageMimeType(file: File): string {
  const normalized = file.type?.toLowerCase().trim();

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  if (
    normalized &&
    EHR_ALLOWED_MIME_TYPES.includes(normalized as (typeof EHR_ALLOWED_MIME_TYPES)[number])
  ) {
    return normalized;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return normalized || "";
  }
}

export function validateEhrImage(file: File, mimeType = resolveImageMimeType(file)): string | null {
  if (
    !mimeType ||
    !EHR_ALLOWED_MIME_TYPES.includes(mimeType as (typeof EHR_ALLOWED_MIME_TYPES)[number])
  ) {
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
  mimeType: string,
): string {
  const ext = extensionForMime(mimeType);
  const fileId = crypto.randomUUID();
  return `${tenantId}/${patientId}/${fileId}.${ext}`;
}

export async function uploadEhrImageToStorage(
  file: File,
  tenantId: string,
  patientId: string,
): Promise<{ filePath: string } | { error: string }> {
  const mimeType = resolveImageMimeType(file);
  const validationError = validateEhrImage(file, mimeType);
  if (validationError) {
    return { error: validationError };
  }

  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();
  const filePath = buildEhrStoragePath(tenantId, patientId, mimeType);

  const { error } = await supabase.storage.from(EHR_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mimeType,
  });

  if (error) {
    return { error: error.message };
  }

  return { filePath };
}

export async function deleteEhrImageFromStorage(filePath: string): Promise<string | null> {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.storage.from(EHR_BUCKET).remove([filePath]);
  return error?.message ?? null;
}

export async function createSignedEhrUrls(
  filePaths: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  if (filePaths.length === 0) return {};

  const { createClient } = await import("@/utils/supabase/client");
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
