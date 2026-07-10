import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type DoctorProfile = {
  tenantId: string;
  clinicName: string;
  slug: string;
  doctorName: string;
  specialty: string;
  bio: string;
  credentials: string[];
  avatarUrl: string | null;
  coverUrl: string | null;
};

function parseCredentials(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function fetchDoctorProfile(): Promise<DoctorProfile> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const withProfile = await supabase
    .from("tenants")
    .select(
      "id, name, slug, doctor_name, specialty, bio, credentials, avatar_url, cover_url",
    )
    .eq("id", tenantId)
    .single();

  if (!withProfile.error && withProfile.data) {
    const data = withProfile.data;
    return {
      tenantId: data.id,
      clinicName: data.name,
      slug: data.slug,
      doctorName: data.doctor_name ?? data.name ?? "",
      specialty: data.specialty ?? "",
      bio: data.bio ?? "",
      credentials: parseCredentials(data.credentials),
      avatarUrl: data.avatar_url ?? null,
      coverUrl: data.cover_url ?? null,
    };
  }

  // Fallback before migration 018 is applied
  const fallback = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (fallback.error || !fallback.data) {
    throw new Error(
      `Failed to load doctor profile: ${withProfile.error?.message ?? fallback.error?.message}`,
    );
  }

  return {
    tenantId: fallback.data.id,
    clinicName: fallback.data.name,
    slug: fallback.data.slug,
    doctorName: fallback.data.name,
    specialty: "",
    bio: "",
    credentials: [],
    avatarUrl: null,
    coverUrl: null,
  };
}
