import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRolePermissionSet } from "@/lib/auth/clinicRoles";
import { resolveActiveMembership } from "@/lib/auth/membership";
import {
  applyPermissionOverrides,
  capabilityFlagsFromRole,
  denialMessage,
  permissionsForRole,
  type Permission,
} from "@/lib/auth/permissions";
import { createAuthenticatedClient } from "@/utils/supabase/auth";

export interface StaffPermissions {
  canViewRevenue: boolean;
  canManageQueue: boolean;
  canCreateWalkIn: boolean;
  canManageClinic: boolean;
  /** Active membership role when resolved from DB */
  role: string;
  membershipId: string | null;
  isSuspended: boolean;
  /** Effective permission set after overrides */
  grants: Permission[];
}

type PermissionOverrides = { grant?: string[]; deny?: string[] };

function jwtRole(user: { app_metadata?: Record<string, unknown> } | null): string {
  return String(
    user?.app_metadata?.staff_role ?? user?.app_metadata?.role ?? "receptionist",
  );
}

async function loadOverrides(
  supabase: SupabaseClient,
  membershipId: string | null,
): Promise<PermissionOverrides | null> {
  if (!membershipId) return null;
  const { data, error } = await supabase
    .from("clinic_memberships")
    .select("permission_overrides")
    .eq("id", membershipId)
    .maybeSingle();
  if (error || !data) return null;
  const raw = data.permission_overrides;
  if (!raw || typeof raw !== "object") return null;
  return raw as PermissionOverrides;
}

/**
 * Resolve capabilities from clinic_memberships (source of truth),
 * falling back to JWT staff_role when membership table/row is unavailable.
 */
export async function resolveStaffPermissions(
  supabase: SupabaseClient,
): Promise<StaffPermissions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = await resolveActiveMembership(supabase, user);

  if (membership) {
    const isSuspended = membership.status === "suspended";
    const overrides = await loadOverrides(supabase, membership.id);
    const fromDb = isSuspended
      ? null
      : await loadRolePermissionSet(supabase, {
          tenantId: membership.tenantId,
          roleKey: membership.role,
          customRoleId: membership.customRoleId,
        });
    const base = fromDb
      ? new Set(fromDb)
      : permissionsForRole(membership.role, isSuspended);
    const grants = Array.from(applyPermissionOverrides(base, overrides));
    return {
      ...capabilityFlagsFromRole(membership.role, isSuspended),
      canViewRevenue:
        grants.includes("revenue.view") || grants.includes("finance.view"),
      canManageQueue: grants.includes("queue.manage"),
      canCreateWalkIn: grants.includes("walkin.create"),
      canManageClinic: grants.includes("clinic.manage"),
      role: membership.role,
      membershipId: membership.id,
      isSuspended,
      grants,
    };
  }

  const role = jwtRole(user);
  const grants = Array.from(permissionsForRole(role, false));
  return {
    ...capabilityFlagsFromRole(role, false),
    role,
    membershipId: null,
    isSuspended: false,
    grants,
  };
}

export function hasGrant(
  permissions: StaffPermissions,
  permission: Permission,
): boolean {
  if (permissions.isSuspended) return false;
  return permissions.grants.includes(permission);
}

/**
 * Server-side gate. Returns an error message when denied, otherwise null.
 */
export async function assertPermission(
  supabase: SupabaseClient,
  permission: Permission,
): Promise<string | null> {
  const resolved = await resolveStaffPermissions(supabase);
  if (!hasGrant(resolved, permission)) {
    return denialMessage(permission);
  }
  return null;
}

export async function assertAnyPermission(
  supabase: SupabaseClient,
  permissions: readonly Permission[],
  fallbackMessage: string,
): Promise<string | null> {
  const resolved = await resolveStaffPermissions(supabase);
  const allowed = permissions.some((permission) => hasGrant(resolved, permission));
  if (!allowed) return fallbackMessage;
  return null;
}

/** Convenience for server actions that create their own client. */
export async function requirePermission(
  permission: Permission,
): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  return assertPermission(supabase, permission);
}
