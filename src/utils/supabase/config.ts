export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return key;
}

/** Dev-only fallback until staff auth sets JWT app_metadata.tenant_id */
export function getMockTenantId(): string | undefined {
  return process.env.MOCK_TENANT_ID;
}

export function getClinicWhatsAppFallback(): string {
  return process.env.MOCK_CLINIC_WHATSAPP ?? "+20 100 000 0000";
}
