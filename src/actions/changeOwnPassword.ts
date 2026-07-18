"use server";

import { createAuthenticatedClient } from "@/utils/supabase/auth";

export interface ChangeOwnPasswordResult {
  success: boolean;
  error?: string;
}

export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ChangeOwnPasswordResult> {
  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword.trim();

  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (currentPassword === newPassword) {
    return { success: false, error: "New password must be different from the current one." };
  }

  try {
    const supabase = await createAuthenticatedClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return { success: false, error: "You must be signed in to change your password." };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: "Current password is incorrect." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not change password.",
    };
  }
}
