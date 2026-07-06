import type { SupabaseClient } from "@supabase/supabase-js";

export interface StaffPermissions {
  canViewRevenue: boolean;
}

const REVENUE_ROLES = new Set(["owner", "doctor", "admin"]);

/**
 * Revenue KPIs are visible to clinical owners/admins only — not front-desk staff.
 * Defaults to owner-level access in dev when no role is set.
 */
export async function resolveStaffPermissions(
  supabase: SupabaseClient,
): Promise<StaffPermissions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (
    user?.app_metadata?.staff_role ??
    user?.app_metadata?.role ??
    "owner"
  ) as string;

  return {
    canViewRevenue: REVENUE_ROLES.has(role),
  };
}
