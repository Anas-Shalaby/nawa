import { AccessDenied } from "@/components/auth/AccessDenied";
import {
  permissionForDashboardPath,
  type Permission,
} from "@/lib/auth/permissions";
import { hasGrant, resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import { createAuthenticatedClient } from "@/utils/supabase/auth";
import type { ReactNode } from "react";

export async function requirePagePermission(
  pathOrPermission: string | Permission,
): Promise<{ allowed: true } | { allowed: false; ui: ReactNode }> {
  const supabase = await createAuthenticatedClient();
  const permissions = await resolveStaffPermissions(supabase);

  const required: Permission | null =
    typeof pathOrPermission === "string" && pathOrPermission.includes(".")
      ? (pathOrPermission as Permission)
      : typeof pathOrPermission === "string"
        ? permissionForDashboardPath(pathOrPermission)
        : pathOrPermission;

  if (!required) return { allowed: true };

  if (hasGrant(permissions, required)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    ui: <AccessDenied />,
  };
}
