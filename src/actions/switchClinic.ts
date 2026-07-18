"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  listUserClinicMemberships,
  syncMembershipToJwt,
} from "@/lib/auth/membership";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import { createClient as createServerClient } from "@/utils/supabase/server";

export interface SwitchClinicResult {
  success: boolean;
  error?: string;
}

/**
 * Switch the active clinic by updating JWT tenant_id / role from membership.
 */
export async function switchClinic(tenantId: string): Promise<SwitchClinicResult> {
  const targetTenantId = tenantId.trim();
  if (!targetTenantId) {
    return { success: false, error: "Clinic is required." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const currentTenantId =
    typeof user.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null;

  if (currentTenantId === targetTenantId) {
    return { success: true };
  }

  const memberships = await listUserClinicMemberships(user.id, user.email);
  const target = memberships.find((m) => m.tenantId === targetTenantId);

  if (!target) {
    return {
      success: false,
      error: "You do not have access to this clinic.",
    };
  }

  const admin = createServiceRoleClient();
  const { data: membershipRow } = await admin
    .from("clinic_memberships")
    .select("id, staff_profile_id, role, status")
    .eq("id", target.membershipId)
    .maybeSingle();

  if (!membershipRow || membershipRow.status !== "active") {
    return {
      success: false,
      error: "This clinic membership is not active.",
    };
  }

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("is_active")
    .eq("id", target.tenantId)
    .maybeSingle();

  if (tenantRow?.is_active === false) {
    return {
      success: false,
      error: "This clinic account is suspended.",
    };
  }

  await syncMembershipToJwt({
    userId: user.id,
    tenantId: target.tenantId,
    role: membershipRow.role,
    staffProfileId: membershipRow.staff_profile_id,
    membershipId: membershipRow.id,
    existingMetadata: user.app_metadata ?? {},
  });

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.error("[switchClinic] refreshSession failed", refreshError.message);
    return {
      success: false,
      error: "Clinic switched but session refresh failed. Please sign in again.",
    };
  }

  revalidatePath("/[locale]/dashboard", "layout");
  revalidatePath("/[locale]/dashboard", "page");

  const locale = await getLocale();
  redirect(`/${locale}/dashboard`);
}
