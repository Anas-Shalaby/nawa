import {
  listUserClinicMemberships,
  type ClinicMembershipOption,
} from "@/lib/auth/membership";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type { ClinicMembershipOption };

/**
 * Clinics available in the switcher for the signed-in user.
 * Falls back to the active tenant only when memberships table is empty/unavailable.
 */
export async function fetchClinicSwitcherOptions(): Promise<{
  activeTenantId: string;
  clinics: ClinicMembershipOption[];
}> {
  const supabase = await createAuthenticatedClient();
  const activeTenantId = await resolveTenantId(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { activeTenantId, clinics: [] };
  }

  const memberships = await listUserClinicMemberships(user.id, user.email);
  if (memberships.length > 0) {
    // Ensure active clinic appears even if membership row is briefly missing.
    if (!memberships.some((m) => m.tenantId === activeTenantId)) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name, slug")
        .eq("id", activeTenantId)
        .maybeSingle();

      if (tenant) {
        memberships.unshift({
          membershipId: "active",
          tenantId: activeTenantId,
          clinicName: tenant.name,
          slug: tenant.slug,
          role: "doctor",
        });
      }
    }
    return { activeTenantId, clinics: memberships };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, slug")
    .eq("id", activeTenantId)
    .maybeSingle();

  if (!tenant) {
    return { activeTenantId, clinics: [] };
  }

  return {
    activeTenantId,
    clinics: [
      {
        membershipId: "active",
        tenantId: activeTenantId,
        clinicName: tenant.name,
        slug: tenant.slug,
        role: "doctor",
      },
    ],
  };
}
