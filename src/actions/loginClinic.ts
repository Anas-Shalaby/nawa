"use server";

import {
  type LoginClinicInput,
  type LoginClinicResult,
} from "@/actions/loginClinic.types";
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

  return {
    success: true,
    redirectTo: `/${locale}/dashboard`,
  };
}

export type { LoginClinicInput, LoginClinicResult };
