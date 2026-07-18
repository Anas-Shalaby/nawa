import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";
import type { TeamRole } from "@/lib/team/types";

export type MembershipStatus = "active" | "suspended" | "invited";

export interface ClinicMembership {
  id: string;
  tenantId: string;
  userId: string;
  staffProfileId: string | null;
  role: TeamRole;
  status: MembershipStatus;
  customRoleId: string | null;
}

type MembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  staff_profile_id: string | null;
  role: string;
  status: string;
  custom_role_id?: string | null;
};

function mapMembership(row: MembershipRow): ClinicMembership {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    staffProfileId: row.staff_profile_id,
    role: normalizeTeamRole(row.role),
    status: (row.status as MembershipStatus) || "active",
    customRoleId: row.custom_role_id ?? null,
  };
}

/**
 * Active membership for the current JWT tenant.
 * Returns null if table missing, no row, or user/tenant missing.
 */
export async function resolveActiveMembership(
  supabase: SupabaseClient,
  user: User | null,
): Promise<ClinicMembership | null> {
  if (!user) return null;

  const tenantId =
    typeof user.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null;
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from("clinic_memberships")
    .select("id, tenant_id, user_id, staff_profile_id, role, status, custom_role_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Migration not applied yet — caller falls back to JWT / retry without new columns.
    const message = error.message.toLowerCase();
    if (
      message.includes("clinic_memberships") ||
      message.includes("custom_role_id") ||
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.code === "42703"
    ) {
      const fallback = await supabase
        .from("clinic_memberships")
        .select("id, tenant_id, user_id, staff_profile_id, role, status")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (fallback.error || !fallback.data) return null;
      return mapMembership(fallback.data as MembershipRow);
    }
    console.error("[resolveActiveMembership]", error.message);
    return null;
  }

  if (!data) return null;
  return mapMembership(data as MembershipRow);
}

export async function upsertClinicMembership(input: {
  tenantId: string;
  userId: string;
  staffProfileId?: string | null;
  role: TeamRole | string;
  status?: MembershipStatus;
}): Promise<ClinicMembership | null> {
  const admin = createServiceRoleClient();
  const role = normalizeTeamRole(input.role);
  const status = input.status ?? "active";

  const payload: Record<string, unknown> = {
    tenant_id: input.tenantId,
    user_id: input.userId,
    role,
    status,
    updated_at: new Date().toISOString(),
  };
  if (input.staffProfileId !== undefined) {
    payload.staff_profile_id = input.staffProfileId;
  }

  const { data, error } = await admin
    .from("clinic_memberships")
    .upsert(payload, { onConflict: "tenant_id,user_id" })
    .select("id, tenant_id, user_id, staff_profile_id, role, status")
    .single();

  if (error) {
    if (
      error.message.toLowerCase().includes("clinic_memberships") ||
      error.code === "42P01"
    ) {
      return null;
    }
    console.error("[upsertClinicMembership]", error.message);
    return null;
  }

  return mapMembership(data as MembershipRow);
}

export async function syncMembershipToJwt(input: {
  userId: string;
  tenantId: string;
  role: TeamRole | string;
  staffProfileId?: string | null;
  membershipId?: string | null;
  existingMetadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const role = normalizeTeamRole(input.role);

  await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: {
      ...(input.existingMetadata ?? {}),
      tenant_id: input.tenantId,
      staff_role: role,
      staff_profile_id: input.staffProfileId ?? null,
      membership_id: input.membershipId ?? null,
    },
  });
}

export interface ClinicMembershipOption {
  membershipId: string;
  tenantId: string;
  clinicName: string;
  slug: string;
  role: TeamRole;
}

type StaffLinkRow = {
  id: string;
  tenant_id: string;
  role: string | null;
  is_suspended: boolean | null;
};

/**
 * Ensure clinic_memberships rows exist for every staff_profiles link of this user.
 * Also attaches orphan roster rows that share the same email but have no user_id yet.
 */
export async function syncUserClinicMembershipsFromStaff(
  userId: string,
  email?: string | null,
): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: byUserId, error: byUserError } = await admin
    .from("staff_profiles")
    .select("id, tenant_id, role, is_suspended")
    .eq("user_id", userId);

  if (byUserError) {
    console.error("[syncUserClinicMembershipsFromStaff] by user", byUserError.message);
  }

  const linked: StaffLinkRow[] = (byUserId as StaffLinkRow[] | null) ?? [];

  const normalizedEmail = email?.trim().toLowerCase() || null;
  if (normalizedEmail) {
    const { data: byEmail, error: byEmailError } = await admin
      .from("staff_profiles")
      .select("id, tenant_id, role, is_suspended, user_id")
      .ilike("email", normalizedEmail);

    if (byEmailError) {
      // email column may be missing pre-027
      if (!byEmailError.message.toLowerCase().includes("email")) {
        console.error("[syncUserClinicMembershipsFromStaff] by email", byEmailError.message);
      }
    } else {
      for (const row of byEmail ?? []) {
        if (row.user_id && row.user_id !== userId) continue;

        if (!row.user_id) {
          const { error: linkError } = await admin
            .from("staff_profiles")
            .update({ user_id: userId })
            .eq("id", row.id)
            .is("user_id", null);

          if (linkError) {
            console.error("[syncUserClinicMembershipsFromStaff] link", linkError.message);
            continue;
          }
        }

        if (!linked.some((p) => p.id === row.id)) {
          linked.push({
            id: row.id,
            tenant_id: row.tenant_id,
            role: row.role,
            is_suspended: row.is_suspended,
          });
        }
      }
    }
  }

  const seenTenants = new Set<string>();
  for (const profile of linked) {
    if (seenTenants.has(profile.tenant_id)) continue;
    seenTenants.add(profile.tenant_id);

    await upsertClinicMembership({
      tenantId: profile.tenant_id,
      userId,
      staffProfileId: profile.id,
      role: profile.role ?? "receptionist",
      status: profile.is_suspended ? "suspended" : "active",
    });
  }
}

/**
 * All active clinic memberships for a user (service role — works across tenants).
 * Syncs from staff_profiles first so multi-clinic roster links appear in the switcher.
 */
export async function listUserClinicMemberships(
  userId: string,
  email?: string | null,
): Promise<ClinicMembershipOption[]> {
  const admin = createServiceRoleClient();

  await syncUserClinicMembershipsFromStaff(userId, email);

  const { data: rows, error } = await admin
    .from("clinic_memberships")
    .select("id, tenant_id, role, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    if (
      error.message.toLowerCase().includes("clinic_memberships") ||
      error.code === "42P01" ||
      error.code === "PGRST205"
    ) {
      return listClinicsFromStaffProfiles(userId);
    }
    console.error("[listUserClinicMemberships]", error.message);
    return listClinicsFromStaffProfiles(userId);
  }

  if (!rows?.length) {
    return listClinicsFromStaffProfiles(userId);
  }

  const tenantIds = Array.from(new Set(rows.map((row) => row.tenant_id as string)));
  const { data: tenants, error: tenantsError } = await admin
    .from("tenants")
    .select("id, name, slug, is_active")
    .in("id", tenantIds);

  if (tenantsError) {
    console.error("[listUserClinicMemberships] tenants", tenantsError.message);
    return [];
  }

  const tenantById = new Map(
    (tenants ?? []).map((tenant) => [tenant.id as string, tenant]),
  );

  return rows
    .map((row) => {
      const tenant = tenantById.get(row.tenant_id as string);
      if (!tenant || tenant.is_active === false) return null;
      return {
        membershipId: row.id as string,
        tenantId: row.tenant_id as string,
        clinicName: tenant.name as string,
        slug: tenant.slug as string,
        role: normalizeTeamRole(row.role as string),
      } satisfies ClinicMembershipOption;
    })
    .filter((row): row is ClinicMembershipOption => row != null);
}

async function listClinicsFromStaffProfiles(
  userId: string,
): Promise<ClinicMembershipOption[]> {
  const admin = createServiceRoleClient();

  const { data: profiles, error } = await admin
    .from("staff_profiles")
    .select("id, tenant_id, role, is_suspended")
    .eq("user_id", userId);

  if (error || !profiles?.length) {
    if (error) console.error("[listClinicsFromStaffProfiles]", error.message);
    return [];
  }

  const activeProfiles = profiles.filter((p) => !p.is_suspended);
  if (!activeProfiles.length) return [];

  const tenantIds = Array.from(
    new Set(activeProfiles.map((p) => p.tenant_id as string)),
  );
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, slug, is_active")
    .in("id", tenantIds);

  const tenantById = new Map(
    (tenants ?? []).map((tenant) => [tenant.id as string, tenant]),
  );

  const seen = new Set<string>();
  const options: ClinicMembershipOption[] = [];

  for (const profile of activeProfiles) {
    if (seen.has(profile.tenant_id)) continue;
    seen.add(profile.tenant_id);

    const tenant = tenantById.get(profile.tenant_id);
    if (!tenant || tenant.is_active === false) continue;

    options.push({
      membershipId: profile.id,
      tenantId: profile.tenant_id,
      clinicName: tenant.name,
      slug: tenant.slug,
      role: normalizeTeamRole(profile.role),
    });
  }

  return options;
}
