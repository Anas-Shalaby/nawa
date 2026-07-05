import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type ClinicSettings = {
  tenantId: string;
  clinicName: string;
  slug: string;
};

export async function fetchClinicSettings(): Promise<ClinicSettings> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (tenantError) {
    throw new Error(`Failed to load clinic: ${tenantError.message}`);
  }

  return {
    tenantId: tenant.id,
    clinicName: tenant.name,
    slug: tenant.slug,
  };
}
