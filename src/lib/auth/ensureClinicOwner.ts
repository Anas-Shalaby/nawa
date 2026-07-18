import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import {
  syncMembershipToJwt,
  upsertClinicMembership,
  type ClinicMembership,
} from "@/lib/auth/membership";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";

/**
 * Clinic registration historically set tenant_id without staff_role.
 * Missing staff_role defaults to receptionist and blocks role/access management.
 * Promote those accounts to owner and ensure staff_profiles + clinic_memberships exist.
 */
export async function ensureClinicOwnerAccess(user: User): Promise<void> {
  const tenantId =
    typeof user.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null;
  if (!tenantId) return;

  const admin = createServiceRoleClient();
  const existingMembership = await fetchMembership(admin, tenantId, user.id);

  const existingRole = user.app_metadata?.staff_role ?? user.app_metadata?.role;
  const needsOwnerRole = existingRole == null || existingRole === "";

  // Membership already present: refresh JWT cache from membership (source of truth).
  if (existingMembership) {
    if (needsOwnerRole && existingMembership.role !== "owner") {
      const membership = await upsertClinicMembership({
        tenantId,
        userId: user.id,
        staffProfileId: existingMembership.staffProfileId,
        role: "owner",
        status: "active",
      });
      await syncMembershipToJwt({
        userId: user.id,
        tenantId,
        role: "owner",
        staffProfileId: membership?.staffProfileId ?? existingMembership.staffProfileId,
        membershipId: membership?.id ?? existingMembership.id,
        existingMetadata: user.app_metadata ?? {},
      });
      return;
    }

    await syncMembershipToJwt({
      userId: user.id,
      tenantId,
      role: existingMembership.role,
      staffProfileId: existingMembership.staffProfileId,
      membershipId: existingMembership.id,
      existingMetadata: user.app_metadata ?? {},
    });
    return;
  }

  if (!needsOwnerRole) {
    await bootstrapMembershipFromExisting(user, tenantId, String(existingRole));
    return;
  }

  const displayName =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    user.email?.split("@")[0] ||
    "Clinic owner";
  const email = user.email?.trim().toLowerCase() || null;

  let staffProfileId: string | null =
    typeof user.app_metadata?.staff_profile_id === "string"
      ? user.app_metadata.staff_profile_id
      : null;

  if (!staffProfileId) {
    const { data: linked } = await admin
      .from("staff_profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    staffProfileId = linked?.id ?? null;
  }

  if (!staffProfileId) {
    staffProfileId = await insertOwnerStaffProfile(admin, {
      tenantId,
      userId: user.id,
      displayName,
      email,
    });
  } else {
    await admin
      .from("staff_profiles")
      .update({ role: "owner" })
      .eq("id", staffProfileId)
      .eq("tenant_id", tenantId);
  }

  const membership = await upsertClinicMembership({
    tenantId,
    userId: user.id,
    staffProfileId,
    role: "owner",
    status: "active",
  });

  await syncMembershipToJwt({
    userId: user.id,
    tenantId,
    role: "owner",
    staffProfileId,
    membershipId: membership?.id ?? null,
    existingMetadata: user.app_metadata ?? {},
  });
}

async function bootstrapMembershipFromExisting(
  user: User,
  tenantId: string,
  role: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  let staffProfileId =
    typeof user.app_metadata?.staff_profile_id === "string"
      ? user.app_metadata.staff_profile_id
      : null;

  if (!staffProfileId) {
    const { data: linked } = await admin
      .from("staff_profiles")
      .select("id, role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    staffProfileId = linked?.id ?? null;
    if (linked?.role) {
      role = linked.role;
    }
  }

  const membership = await upsertClinicMembership({
    tenantId,
    userId: user.id,
    staffProfileId,
    role: normalizeTeamRole(role),
    status: "active",
  });

  if (membership) {
    await syncMembershipToJwt({
      userId: user.id,
      tenantId,
      role: membership.role,
      staffProfileId: membership.staffProfileId,
      membershipId: membership.id,
      existingMetadata: user.app_metadata ?? {},
    });
  }
}

async function fetchMembership(
  admin: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<ClinicMembership | null> {
  const { data, error } = await admin
    .from("clinic_memberships")
    .select("id, tenant_id, user_id, staff_profile_id, role, status")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    staffProfileId: data.staff_profile_id,
    role: normalizeTeamRole(data.role),
    status: (data.status as ClinicMembership["status"]) || "active",
    customRoleId: null,
  };
}

async function insertOwnerStaffProfile(
  admin: SupabaseClient,
  input: {
    tenantId: string;
    userId: string;
    displayName: string;
    email: string | null;
  },
): Promise<string | null> {
  const fullPayload: Record<string, unknown> = {
    tenant_id: input.tenantId,
    user_id: input.userId,
    display_name: input.displayName,
    role: "owner",
    availability: "available",
    email: input.email,
    is_suspended: false,
  };

  const { data, error } = await admin
    .from("staff_profiles")
    .insert(fullPayload)
    .select("id")
    .single();

  if (!error && data?.id) return data.id;

  const { data: fallback, error: fallbackError } = await admin
    .from("staff_profiles")
    .insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      display_name: input.displayName,
      role: "owner",
      availability: "available",
    })
    .select("id")
    .single();

  if (fallbackError) {
    console.error("[ensureClinicOwnerAccess] staff_profiles insert failed", fallbackError);
    return null;
  }

  return fallback?.id ?? null;
}
