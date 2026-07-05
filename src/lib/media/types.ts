export type PatientMediaTag = "before" | "after" | "x-ray" | "general";

export interface PatientMediaRecord {
  id: string;
  tenantId: string;
  patientId: string;
  filePath: string;
  tag: PatientMediaTag;
  notes: string | null;
  createdAt: string;
}

export interface PatientMediaWithUrl extends PatientMediaRecord {
  signedUrl: string | null;
}

export const EHR_BUCKET = "clinic_ehr";

export const EHR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const EHR_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const EHR_MEDIA_TAGS: PatientMediaTag[] = [
  "before",
  "after",
  "x-ray",
  "general",
];
