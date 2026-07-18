import { resolveActiveMembership } from "@/lib/auth/membership";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";
import type { TeamRole } from "@/lib/team/types";
import { createAuthenticatedClient } from "@/utils/supabase/auth";

export interface AccountIdentity {
  displayName: string;
  email: string | null;
  role: TeamRole;
  membershipStatus: "active" | "suspended" | "invited";
  clinicName: string;
  department: string | null;
  phone: string | null;
}

/**
 * Who is signed in for the active clinic — for the Account page identity card.
 */
export async function fetchAccountIdentity(): Promise<AccountIdentity> {
  const supabase = await createAuthenticatedClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = await resolveActiveMembership(supabase, user);
  const tenantId =
    membership?.tenantId ??
    (typeof user?.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null);

  let clinicName = "—";
  if (tenantId) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant?.name) clinicName = tenant.name;
  }

  let displayName =
    (typeof user?.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    "";
  let department: string | null = null;
  let phone: string | null = null;
  let role = normalizeTeamRole(
    membership?.role ??
      (typeof user?.app_metadata?.staff_role === "string"
        ? user.app_metadata.staff_role
        : "receptionist"),
  );

  if (user) {
    const staffQuery = membership?.staffProfileId
      ? supabase
          .from("staff_profiles")
          .select("display_name, role, department, phone, email")
          .eq("id", membership.staffProfileId)
          .maybeSingle()
      : tenantId
        ? supabase
            .from("staff_profiles")
            .select("display_name, role, department, phone, email")
            .eq("tenant_id", tenantId)
            .eq("user_id", user.id)
            .maybeSingle()
        : null;

    if (staffQuery) {
      const { data: staff } = await staffQuery;
      if (staff) {
        if (staff.display_name?.trim()) displayName = staff.display_name.trim();
        if (staff.department?.trim()) department = staff.department.trim();
        if (staff.phone?.trim()) phone = staff.phone.trim();
        if (staff.role) role = normalizeTeamRole(staff.role);
      }
    }
  }

  if (!displayName) {
    displayName =
      user?.email?.split("@")[0]?.trim() ||
      "—";
  }

  const membershipStatus =
    membership?.status ??
    ("active" as const);

  return {
    displayName,
    email: user?.email ?? null,
    role,
    membershipStatus,
    clinicName,
    department,
    phone,
  };
}
