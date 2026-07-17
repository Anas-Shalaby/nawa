"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

const BRANDING_BUCKET = "clinic-branding";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type SaveDoctorProfileResult = {
  success: boolean;
  error?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
};

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function uploadBrandingImage(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  tenantId: string,
  kind: "avatar" | "cover",
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "Unsupported image type" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image too large (max 5MB)" };
  }

  const ext = extensionForMime(file.type);
  const path = `${tenantId}/${kind}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function saveDoctorProfile(
  formData: FormData,
): Promise<SaveDoctorProfileResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const doctorName = String(formData.get("doctorName") ?? "").trim();
    const specialty = String(formData.get("specialty") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const clinicPhone = String(formData.get("clinicPhone") ?? "").trim();
    const clinicLocation = String(formData.get("clinicLocation") ?? "").trim();
    const latitudeRaw = String(formData.get("clinicLatitude") ?? "").trim();
    const longitudeRaw = String(formData.get("clinicLongitude") ?? "").trim();
    const credentialsRaw = String(formData.get("credentials") ?? "[]");

    let credentials: string[] = [];
    try {
      const parsed = JSON.parse(credentialsRaw) as unknown;
      if (Array.isArray(parsed)) {
        credentials = parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12);
      }
    } catch {
      credentials = [];
    }

    if (!doctorName) {
      return { success: false, error: "Doctor name is required" };
    }

    if (clinicPhone && !/^[+\d][\d\s()-]{6,24}$/.test(clinicPhone)) {
      return { success: false, error: "Enter a valid clinic phone number" };
    }

    const clinicLatitude = latitudeRaw ? Number(latitudeRaw) : null;
    const clinicLongitude = longitudeRaw ? Number(longitudeRaw) : null;
    const coordinatesValid =
      clinicLatitude === null && clinicLongitude === null
        ? true
        : clinicLatitude !== null &&
          clinicLongitude !== null &&
          Number.isFinite(clinicLatitude) &&
          Number.isFinite(clinicLongitude) &&
          clinicLatitude >= -90 &&
          clinicLatitude <= 90 &&
          clinicLongitude >= -180 &&
          clinicLongitude <= 180;

    if (!coordinatesValid) {
      return { success: false, error: "Invalid clinic coordinates" };
    }

    let avatarUrl = String(formData.get("existingAvatarUrl") ?? "").trim() || null;
    let coverUrl = String(formData.get("existingCoverUrl") ?? "").trim() || null;

    const avatarFile = formData.get("avatarFile");
    const coverFile = formData.get("coverFile");

    if (avatarFile instanceof File && avatarFile.size > 0) {
      const uploaded = await uploadBrandingImage(supabase, tenantId, "avatar", avatarFile);
      if ("error" in uploaded) {
        return { success: false, error: uploaded.error };
      }
      avatarUrl = uploaded.url;
    }

    if (coverFile instanceof File && coverFile.size > 0) {
      const uploaded = await uploadBrandingImage(supabase, tenantId, "cover", coverFile);
      if ("error" in uploaded) {
        return { success: false, error: uploaded.error };
      }
      coverUrl = uploaded.url;
    }

    const { error } = await supabase
      .from("tenants")
      .update({
        doctor_name: doctorName,
        specialty: specialty || null,
        bio: bio || null,
        credentials,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        clinic_phone: clinicPhone || null,
        clinic_location: clinicLocation || null,
        clinic_latitude: clinicLatitude,
        clinic_longitude: clinicLongitude,
      })
      .eq("id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/profile");
    revalidatePath("/dashboard/settings");
    revalidatePath("/[locale]/[slug]", "page");

    return { success: true, avatarUrl, coverUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save profile",
    };
  }
}
