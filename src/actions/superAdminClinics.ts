"use server";

import { revalidatePath } from "next/cache";
import { getSuperAdminSession } from "@/lib/super-admin/auth";
import { createServiceRoleClient } from "@/utils/supabase/auth";

export interface SetClinicActiveResult {
  success: boolean;
  error?: string;
}

export async function setClinicActive(
  tenantId: string,
  isActive: boolean,
): Promise<SetClinicActiveResult> {
  const admin = await getSuperAdminSession();
  if (!admin) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: isActive })
      .eq("id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/super-admin");
    revalidatePath("/super-admin/clinics");

    return { success: true };
  } catch (error) {
    console.error("[setClinicActive]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}
