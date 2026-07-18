"use server";

import {
  type LoginClinicInput,
  type LoginClinicResult,
} from "@/actions/loginClinic.types";
import { ensureClinicOwnerAccess } from "@/lib/auth/ensureClinicOwner";
import { syncUserClinicMembershipsFromStaff } from "@/lib/auth/membership";
import { createClient as createServerClient } from "@/utils/supabase/server";

function mapLoginError(message: string): LoginClinicResult {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return {
      success: false,
      errorCode: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
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

export async function loginClinic(input: LoginClinicInput): Promise<LoginClinicResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const locale = input.locale === "en" ? "en" : "ar";

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return mapLoginError(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await ensureClinicOwnerAccess(user);
      await syncUserClinicMembershipsFromStaff(user.id, user.email);
      // Refresh session JWT so updated app_metadata (staff_role) is available immediately.
      await supabase.auth.refreshSession();
    } catch (bootstrapError) {
      console.error("[loginClinic] owner bootstrap failed", bootstrapError);
    }
  }

  return {
    success: true,
    redirectTo: `/${locale}/dashboard`,
  };
}

export type { LoginClinicInput, LoginClinicResult };
