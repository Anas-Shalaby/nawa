import type { SupabaseClient } from "@supabase/supabase-js";

export interface StaffPermissions {
  canViewRevenue: boolean;
  canManageQueue: boolean;
  canCreateWalkIn: boolean;
  canManageClinic: boolean;
}

const REVENUE_ROLES = new Set(["owner", "doctor", "admin"]);
const QUEUE_ROLES = new Set(["owner", "doctor", "admin", "receptionist", "front_desk"]);
const WALK_IN_ROLES = new Set(["owner", "doctor", "admin", "receptionist", "front_desk"]);
const CLINIC_ADMIN_ROLES = new Set(["owner", "admin"]);

function resolveRole(user: { app_metadata?: Record<string, unknown> } | null): string {
  return String(
    user?.app_metadata?.staff_role ?? user?.app_metadata?.role ?? "receptionist",
  );
}

/**
 * Mission Control capabilities. Defaults to least privilege when no role is set.
 */
export async function resolveStaffPermissions(
  supabase: SupabaseClient,
): Promise<StaffPermissions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = resolveRole(user);

  return {
    canViewRevenue: REVENUE_ROLES.has(role),
    canManageQueue: QUEUE_ROLES.has(role),
    canCreateWalkIn: WALK_IN_ROLES.has(role),
    canManageClinic: CLINIC_ADMIN_ROLES.has(role),
  };
}
