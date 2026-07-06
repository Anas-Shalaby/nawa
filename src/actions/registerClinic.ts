"use server";

import {
  type RegisterClinicInput,
  type RegisterClinicResult,
} from "@/actions/registerClinic.types";
import { generateUniqueTenantSlug } from "@/lib/onboarding/slug";
import { createTenantSubscription } from "@/lib/subscriptions/createTenantSubscription";
import { isSubscriptionPlanId } from "@/lib/subscriptions/types";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/auth";

function mapAuthError(message: string): RegisterClinicResult {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("already exists")
  ) {
    return {
      success: false,
      errorCode: "EMAIL_IN_USE",
      message: "Email already in use.",
    };
  }

  if (normalized.includes("password") && normalized.includes("least")) {
    return {
      success: false,
      errorCode: "WEAK_PASSWORD",
      message: "Password must be at least 6 characters.",
    };
  }

  if (normalized.includes("invalid email") || normalized.includes("valid email")) {
    return {
      success: false,
      errorCode: "INVALID_EMAIL",
      message: "Invalid email address.",
    };
  }

  return {
    success: false,
    errorCode: "UNKNOWN",
    message,
  };
}

export async function registerClinic(
  input: RegisterClinicInput,
): Promise<RegisterClinicResult> {
  const clinicName = input.clinicName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const locale = input.locale === "en" ? "en" : "ar";
  const planId = input.planId.trim();

  if (!isSubscriptionPlanId(planId)) {
    return {
      success: false,
      errorCode: "INVALID_PLAN",
      message: "Invalid subscription plan.",
    };
  }

  if (clinicName.length < 2) {
    return {
      success: false,
      errorCode: "CLINIC_NAME_REQUIRED",
      message: "Clinic name is required.",
    };
  }

  const admin = createServiceRoleClient();
  let createdUserId: string | null = null;

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: clinicName,
      },
    });

    if (createError || !created.user) {
      return mapAuthError(createError?.message ?? "Registration failed.");
    }

    createdUserId = created.user.id;

    const slug = await generateUniqueTenantSlug(async (candidate) => {
      const { data } = await admin
        .from("tenants")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      return Boolean(data);
    }, clinicName);

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({ name: clinicName, slug })
      .select("id, slug")
      .single();

    if (tenantError || !tenant) {
      throw new Error(tenantError?.message ?? "Could not create clinic workspace.");
    }

    await createTenantSubscription(admin, tenant.id, planId);

    const { error: metadataError } = await admin.auth.admin.updateUserById(createdUserId, {
      app_metadata: {
        provider: "email",
        providers: ["email"],
        tenant_id: tenant.id,
      },
      user_metadata: {
        display_name: clinicName,
      },
    });

    if (metadataError) {
      await admin.from("tenants").delete().eq("id", tenant.id);
      throw new Error(metadataError.message);
    }

    const supabase = await createServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        success: false,
        errorCode: "SIGN_IN_FAILED",
        message: signInError.message,
      };
    }

    return {
      success: true,
      redirectTo: `/${locale}/dashboard`,
    };
  } catch (error) {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }

    console.error("[registerClinic]", error);

    return {
      success: false,
      errorCode: "TENANT_CREATE_FAILED",
      message: error instanceof Error ? error.message : "Registration failed.",
    };
  }
}

export type { RegisterClinicInput, RegisterClinicResult };
