"use server";

import { revalidatePath } from "next/cache";
import {
  defaultPermissionsForRoleKey,
  fetchClinicRoles,
  type ClinicRoleView,
} from "@/lib/auth/clinicRoles";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/staffPermissions";
import {
  createAuthenticatedClient,
  resolveTenantId,
} from "@/utils/supabase/auth";

export interface RolesActionResult {
  success: boolean;
  error?: string;
  role?: ClinicRoleView;
  roles?: ClinicRoleView[];
}

function revalidateRoles() {
  revalidatePath("/[locale]/dashboard/settings/roles", "page");
  revalidatePath("/[locale]/dashboard/settings", "page");
}

function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

function slugifyKey(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || `custom_${crypto.randomUUID().slice(0, 8)}`;
}

export async function listClinicRoles(): Promise<RolesActionResult> {
  const denied = await requirePermission("team.roles");
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const roles = await fetchClinicRoles(supabase, tenantId);
    return { success: true, roles };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not load roles.",
    };
  }
}

async function ensureRoleRow(opts: {
  tenantId: string;
  key: string;
  label: string;
  isSystem: boolean;
  basedOn?: string | null;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createAuthenticatedClient();
  const { data: existing } = await supabase
    .from("clinic_roles")
    .select("id")
    .eq("tenant_id", opts.tenantId)
    .eq("key", opts.key)
    .maybeSingle();

  if (existing?.id) return { id: existing.id };

  const { data, error } = await supabase
    .from("clinic_roles")
    .insert({
      tenant_id: opts.tenantId,
      key: opts.key,
      label: opts.label,
      is_system: opts.isSystem,
      based_on: opts.basedOn ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create role." };
  }
  return { id: data.id };
}

async function replaceRolePermissions(
  roleId: string,
  permissions: Permission[],
): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  const { error: delError } = await supabase
    .from("clinic_role_permissions")
    .delete()
    .eq("role_id", roleId);
  if (delError) return delError.message;

  if (permissions.length === 0) return null;

  const { error: insertError } = await supabase
    .from("clinic_role_permissions")
    .insert(permissions.map((permission) => ({ role_id: roleId, permission })));

  return insertError?.message ?? null;
}

export async function saveRolePermissions(input: {
  roleKey: string;
  roleId?: string | null;
  label?: string;
  permissions: string[];
}): Promise<RolesActionResult> {
  const denied = await requirePermission("team.roles");
  if (denied) return { success: false, error: denied };

  const permissions = input.permissions.filter(isPermission);
  const key = input.roleKey.trim();
  if (!key) return { success: false, error: "Role key is required." };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    let roleId = input.roleId ?? null;
    if (!roleId) {
      const ensured = await ensureRoleRow({
        tenantId,
        key,
        label: input.label?.trim() || key,
        isSystem: true,
      });
      if ("error" in ensured) return { success: false, error: ensured.error };
      roleId = ensured.id;
    }

    const replaceError = await replaceRolePermissions(roleId, permissions);
    if (replaceError) return { success: false, error: replaceError };

    revalidateRoles();
    const roles = await fetchClinicRoles(supabase, tenantId);
    return { success: true, roles };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save permissions.",
    };
  }
}

export async function resetRoleToDefaults(input: {
  roleKey: string;
  roleId?: string | null;
}): Promise<RolesActionResult> {
  return saveRolePermissions({
    roleKey: input.roleKey,
    roleId: input.roleId,
    permissions: defaultPermissionsForRoleKey(input.roleKey),
  });
}

export async function createCustomRole(input: {
  label: string;
  basedOn?: string;
  permissions?: string[];
}): Promise<RolesActionResult> {
  const denied = await requirePermission("team.roles");
  if (denied) return { success: false, error: denied };

  const label = input.label.trim();
  if (label.length < 2) {
    return { success: false, error: "Role name is required." };
  }

  const basedOn = input.basedOn?.trim() || "receptionist";
  const permissions =
    input.permissions?.filter(isPermission) ??
    defaultPermissionsForRoleKey(basedOn);

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const key = `${slugifyKey(label)}_${crypto.randomUUID().slice(0, 6)}`;

    const { data, error } = await supabase
      .from("clinic_roles")
      .insert({
        tenant_id: tenantId,
        key,
        label,
        is_system: false,
        based_on: basedOn,
      })
      .select("id, key, label, is_system, based_on")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Could not create role." };
    }

    const replaceError = await replaceRolePermissions(data.id, permissions);
    if (replaceError) return { success: false, error: replaceError };

    revalidateRoles();
    return {
      success: true,
      role: {
        id: data.id,
        key: data.key,
        label: data.label,
        isSystem: false,
        basedOn: data.based_on,
        permissions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create role.",
    };
  }
}

export async function duplicateClinicRole(input: {
  sourceKey: string;
  sourceId?: string | null;
  label: string;
}): Promise<RolesActionResult> {
  const denied = await requirePermission("team.roles");
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const roles = await fetchClinicRoles(supabase, tenantId);
    const source = roles.find(
      (role) =>
        role.key === input.sourceKey ||
        (input.sourceId && role.id === input.sourceId),
    );
    if (!source) return { success: false, error: "Source role not found." };

    return createCustomRole({
      label: input.label.trim() || `${source.label} copy`,
      basedOn: source.key,
      permissions: source.permissions,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not duplicate role.",
    };
  }
}

export async function deleteCustomRole(roleId: string): Promise<RolesActionResult> {
  const denied = await requirePermission("team.roles");
  if (denied) return { success: false, error: denied };

  if (!roleId) return { success: false, error: "Role id is required." };

  try {
    const supabase = await createAuthenticatedClient();
    const { data: role } = await supabase
      .from("clinic_roles")
      .select("id, is_system")
      .eq("id", roleId)
      .maybeSingle();

    if (!role) return { success: false, error: "Role not found." };
    if (role.is_system) {
      return { success: false, error: "System roles cannot be deleted." };
    }

    await supabase
      .from("clinic_memberships")
      .update({ custom_role_id: null })
      .eq("custom_role_id", roleId);

    const { error } = await supabase.from("clinic_roles").delete().eq("id", roleId);
    if (error) return { success: false, error: error.message };

    revalidateRoles();
    const tenantId = await resolveTenantId(supabase);
    const roles = await fetchClinicRoles(supabase, tenantId);
    return { success: true, roles };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete role.",
    };
  }
}
