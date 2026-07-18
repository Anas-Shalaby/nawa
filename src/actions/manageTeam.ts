"use server";

import { revalidatePath } from "next/cache";
import { assignDoctorAndRoom } from "@/actions/missionControl";
import {
  assertPermission,
} from "@/lib/auth/staffPermissions";
import {
  syncMembershipToJwt,
  upsertClinicMembership,
} from "@/lib/auth/membership";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";
import type { TeamRole } from "@/lib/team/types";
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  resolveTenantId,
} from "@/utils/supabase/auth";

export interface TeamActionResult {
  success: boolean;
  error?: string;
  memberId?: string;
  tempPassword?: string;
  recoveryLink?: string;
}

const EDITABLE_ROLES: TeamRole[] = [
  "doctor",
  "receptionist",
  "nurse",
  "assistant",
  "lab",
  "manager",
  "admin",
  "cashier",
  "intern",
];

function revalidateStaff() {
  revalidatePath("/[locale]/dashboard/staff", "page");
}

function generateTempPassword(): string {
  const chunk = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `Nw-${chunk}A1`;
}

async function assertCanManageTeam(): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  return assertPermission(supabase, "team.ops");
}

async function assertCanManageRoles(): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  return assertPermission(supabase, "team.roles");
}

export async function addTeamMember(input: {
  displayName: string;
  role: TeamRole;
  department?: string;
  email?: string;
  withLogin?: boolean;
}): Promise<TeamActionResult> {
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return { success: false, error: "Name is required." };
  }

  const denied = await assertCanManageTeam();
  if (denied) return { success: false, error: denied };

  const role = normalizeTeamRole(input.role);
  const email = input.email?.trim().toLowerCase() || null;
  const withLogin = Boolean(input.withLogin && email);

  if (input.withLogin && !email) {
    return { success: false, error: "Email is required for login access." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let tempPassword: string | undefined;

    if (withLogin && email) {
      const admin = createServiceRoleClient();
      tempPassword = generateTempPassword();

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
        },
      });

      if (createError || !created.user) {
        return {
          success: false,
          error: createError?.message ?? "Could not create login for this member.",
        };
      }

      userId = created.user.id;

      const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: {
          tenant_id: tenantId,
          staff_role: role,
        },
      });

      if (metaError) {
        await admin.auth.admin.deleteUser(userId);
        return { success: false, error: metaError.message };
      }
    }

    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      display_name: displayName,
      role,
      availability: "available",
      department: input.department?.trim() || null,
      user_id: userId,
      email,
      is_suspended: false,
    };

    const { data, error } = await supabase
      .from("staff_profiles")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      // Retry without newer columns if migration not applied
      const fallback = await supabase
        .from("staff_profiles")
        .insert({
          tenant_id: tenantId,
          display_name: displayName,
          role,
          availability: "available",
          user_id: userId,
        })
        .select("id")
        .single();

      if (fallback.error) {
        if (userId) {
          const admin = createServiceRoleClient();
          await admin.auth.admin.deleteUser(userId);
        }
        return { success: false, error: fallback.error.message };
      }

      if (withLogin && email) {
        await supabase.from("staff_invites").insert({
          tenant_id: tenantId,
          staff_profile_id: fallback.data.id,
          email,
          display_name: displayName,
          role,
          department: input.department?.trim() || null,
          invited_by: actor?.id ?? null,
          status: "accepted",
        });
      }

      if (userId) {
        const membership = await upsertClinicMembership({
          tenantId,
          userId,
          staffProfileId: fallback.data.id,
          role,
          status: "active",
        });
        await syncMembershipToJwt({
          userId,
          tenantId,
          role,
          staffProfileId: fallback.data.id,
          membershipId: membership?.id ?? null,
        });
      }

      revalidateStaff();
      return { success: true, memberId: fallback.data.id, tempPassword };
    }

    if (userId) {
      const membership = await upsertClinicMembership({
        tenantId,
        userId,
        staffProfileId: data.id,
        role,
        status: "active",
      });
      await syncMembershipToJwt({
        userId,
        tenantId,
        role,
        staffProfileId: data.id,
        membershipId: membership?.id ?? null,
      });
    }

    if (withLogin && email) {
      await supabase.from("staff_invites").insert({
        tenant_id: tenantId,
        staff_profile_id: data.id,
        email,
        display_name: displayName,
        role,
        department: input.department?.trim() || null,
        invited_by: actor?.id ?? null,
        status: "accepted",
      });
    }

    revalidateStaff();
    return { success: true, memberId: data.id, tempPassword };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not add team member.",
    };
  }
}

export async function setTeamMemberAvailability(
  staffId: string,
  availability: "available" | "busy" | "break" | "offline",
): Promise<TeamActionResult> {
  if (staffId === "primary-doctor") {
    return { success: false, error: "Add this doctor to the team roster first." };
  }

  const denied = await assertCanManageTeam();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("staff_profiles")
      .update({
        availability,
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", staffId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };
    revalidateStaff();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update status.",
    };
  }
}

export async function assignPatientToStaff(
  appointmentId: string,
  staffId: string,
): Promise<TeamActionResult> {
  if (staffId === "primary-doctor") {
    return { success: false, error: "Add this doctor to the team roster first." };
  }

  const result = await assignDoctorAndRoom(appointmentId, staffId, null);
  if (!result.success) return { success: false, error: result.error };
  revalidateStaff();
  return { success: true };
}

export async function updateTeamMemberRole(
  staffId: string,
  role: TeamRole,
): Promise<TeamActionResult> {
  if (staffId === "primary-doctor") {
    return { success: false, error: "Add this doctor to the team roster first." };
  }

  const denied = await assertCanManageRoles();
  if (denied) return { success: false, error: denied };

  const normalized = normalizeTeamRole(role);
  if (!EDITABLE_ROLES.includes(normalized)) {
    return { success: false, error: "Invalid role." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: row, error } = await supabase
      .from("staff_profiles")
      .update({ role: normalized })
      .eq("id", staffId)
      .eq("tenant_id", tenantId)
      .select("id, user_id")
      .single();

    if (error) return { success: false, error: error.message };

    if (row.user_id) {
      const admin = createServiceRoleClient();
      const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
      const existing = (userData.user?.app_metadata ?? {}) as Record<string, unknown>;
      const membership = await upsertClinicMembership({
        tenantId,
        userId: row.user_id,
        staffProfileId: staffId,
        role: normalized,
        status: "active",
      });
      await syncMembershipToJwt({
        userId: row.user_id,
        tenantId,
        role: normalized,
        staffProfileId: staffId,
        membershipId: membership?.id ?? null,
        existingMetadata: existing,
      });
    } else {
      // Ops-only roster row: keep membership aligned when a user_id is later linked.
      await supabase
        .from("clinic_memberships")
        .update({ role: normalized, updated_at: new Date().toISOString() })
        .eq("staff_profile_id", staffId)
        .eq("tenant_id", tenantId);
    }

    revalidateStaff();
    return { success: true, memberId: staffId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update role.",
    };
  }
}

export async function setTeamMemberSuspended(
  staffId: string,
  suspended: boolean,
): Promise<TeamActionResult> {
  if (staffId === "primary-doctor") {
    return { success: false, error: "Add this doctor to the team roster first." };
  }

  const denied = await assertCanManageRoles();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: row, error } = await supabase
      .from("staff_profiles")
      .update({
        is_suspended: suspended,
        availability: suspended ? "offline" : "available",
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", staffId)
      .eq("tenant_id", tenantId)
      .select("id, user_id")
      .single();

    if (error) {
      // Column may be missing pre-migration
      if (error.message.toLowerCase().includes("is_suspended")) {
        return {
          success: false,
          error: "Apply migration 027_team_invites.sql to enable suspend.",
        };
      }
      return { success: false, error: error.message };
    }

    if (row.user_id) {
      const admin = createServiceRoleClient();
      await admin.auth.admin.updateUserById(row.user_id, {
        ban_duration: suspended ? "876600h" : "none",
      });

      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("id", staffId)
        .maybeSingle();

      await upsertClinicMembership({
        tenantId,
        userId: row.user_id,
        staffProfileId: staffId,
        role: normalizeTeamRole(profile?.role),
        status: suspended ? "suspended" : "active",
      });
    } else {
      await supabase
        .from("clinic_memberships")
        .update({
          status: suspended ? "suspended" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("staff_profile_id", staffId)
        .eq("tenant_id", tenantId);
    }

    revalidateStaff();
    return { success: true, memberId: staffId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update suspension.",
    };
  }
}

export async function resetTeamMemberPassword(
  staffId: string,
  newPassword: string,
): Promise<TeamActionResult> {
  if (staffId === "primary-doctor") {
    return { success: false, error: "Add this doctor to the team roster first." };
  }

  const password = newPassword.trim();
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();

    const { data: row, error } = await supabase
      .from("staff_profiles")
      .select("id, email, user_id")
      .eq("id", staffId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error || !row) {
      return { success: false, error: error?.message ?? "Member not found." };
    }

    const isSelf = Boolean(actor?.id && row.user_id && actor.id === row.user_id);
    if (isSelf) {
      return {
        success: false,
        error: "Change your own password from My Account.",
      };
    }

    const denied = await assertCanManageRoles();
    if (denied) return { success: false, error: denied };

    if (!row.email || !row.user_id) {
      return {
        success: false,
        error: "This member has no login yet. Invite them with an email first.",
      };
    }

    const admin = createServiceRoleClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(row.user_id, {
      password,
    });

    if (updateError) return { success: false, error: updateError.message };

    // Do not revalidate the staff page — it remounts the drawer and drops credentials.
    return {
      success: true,
      memberId: staffId,
      tempPassword: password,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reset password.",
    };
  }
}
