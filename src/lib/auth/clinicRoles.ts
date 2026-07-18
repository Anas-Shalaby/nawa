import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PERMISSIONS,
  ROLE_DEFAULTS,
  type Permission,
} from "@/lib/auth/permissions";
import type { TeamRole } from "@/lib/team/types";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";

export interface ClinicRoleView {
  id: string | null;
  key: string;
  label: string;
  isSystem: boolean;
  basedOn: string | null;
  permissions: Permission[];
}

const SYSTEM_ROLE_ORDER: TeamRole[] = [
  "owner",
  "admin",
  "manager",
  "doctor",
  "receptionist",
  "nurse",
  "assistant",
  "lab",
  "cashier",
  "intern",
];

function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function defaultPermissionsForRoleKey(key: string): Permission[] {
  const role = normalizeTeamRole(key);
  return [...(ROLE_DEFAULTS[role] ?? [])];
}

export async function fetchClinicRoles(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ClinicRoleView[]> {
  const { data: rows, error } = await supabase
    .from("clinic_roles")
    .select("id, key, label, is_system, based_on, clinic_role_permissions(permission)")
    .eq("tenant_id", tenantId)
    .order("label", { ascending: true });

  const byKey = new Map<string, ClinicRoleView>();

  // Table missing (migration not applied) → virtual system roles only.
  if (!error && rows) {
    for (const row of rows) {
      const perms = (
        (row.clinic_role_permissions as { permission: string }[] | null) ?? []
      )
        .map((p) => p.permission)
        .filter(isPermission);
      byKey.set(row.key, {
        id: row.id,
        key: row.key,
        label: row.label,
        isSystem: Boolean(row.is_system),
        basedOn: row.based_on ?? null,
        permissions: perms.length > 0 ? perms : defaultPermissionsForRoleKey(row.key),
      });
    }
  }

  const result: ClinicRoleView[] = [];
  for (const key of SYSTEM_ROLE_ORDER) {
    const existing = byKey.get(key);
    if (existing) {
      result.push(existing);
      byKey.delete(key);
    } else {
      result.push({
        id: null,
        key,
        label: key,
        isSystem: true,
        basedOn: null,
        permissions: defaultPermissionsForRoleKey(key),
      });
    }
  }

  for (const role of Array.from(byKey.values())) {
    if (!role.isSystem) result.push(role);
  }

  return result;
}

export async function loadRolePermissionSet(
  supabase: SupabaseClient,
  opts: {
    tenantId: string;
    roleKey: string;
    customRoleId?: string | null;
  },
): Promise<Permission[] | null> {
  if (opts.customRoleId) {
    const { data, error } = await supabase
      .from("clinic_role_permissions")
      .select("permission")
      .eq("role_id", opts.customRoleId);
    if (error || !data) return null;
    return data.map((row) => row.permission).filter(isPermission);
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("clinic_roles")
    .select("id")
    .eq("tenant_id", opts.tenantId)
    .eq("key", opts.roleKey)
    .maybeSingle();

  if (roleError || !roleRow?.id) return null;

  const { data: perms, error: permError } = await supabase
    .from("clinic_role_permissions")
    .select("permission")
    .eq("role_id", roleRow.id);

  if (permError || !perms || perms.length === 0) return null;
  return perms.map((row) => row.permission).filter(isPermission);
}
