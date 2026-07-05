import { createServiceRoleClient } from "@/utils/supabase/auth";

export interface SuperAdminClinicRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isActive: boolean;
  lastActivityAt: string | null;
  isRecentlyActive: boolean;
}

export async function fetchSuperAdminClinics(): Promise<SuperAdminClinicRow[]> {
  const supabase = createServiceRoleClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [{ data: tenants, error: tenantsError }, { data: appointments, error: appointmentsError }] =
    await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, slug, created_at, is_active")
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("tenant_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (tenantsError) throw new Error(`Failed to load clinics: ${tenantsError.message}`);
  if (appointmentsError) {
    throw new Error(`Failed to load clinic activity: ${appointmentsError.message}`);
  }

  const lastActivityByTenant = new Map<string, string>();
  for (const row of appointments ?? []) {
    const tenantId = row.tenant_id as string;
    if (!lastActivityByTenant.has(tenantId)) {
      lastActivityByTenant.set(tenantId, row.created_at as string);
    }
  }

  return (tenants ?? []).map((tenant) => {
    const lastActivityAt = lastActivityByTenant.get(tenant.id) ?? null;
    const isRecentlyActive =
      lastActivityAt !== null && new Date(lastActivityAt) >= new Date(sevenDaysAgoIso);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.created_at,
      isActive: tenant.is_active ?? true,
      lastActivityAt,
      isRecentlyActive,
    };
  });
}
