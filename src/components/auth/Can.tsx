"use client";

import type { ReactNode } from "react";
import type { Permission, PermissionModule } from "@/lib/auth/permissions";
import { usePermission, useModulePermissions, usePermissionContext } from "./PermissionProvider";

export function Can({
  permission,
  permissions,
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: readonly Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, canAny } = usePermissionContext();
  const allowed = permission
    ? can(permission)
    : permissions
      ? canAny(permissions)
      : false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function PermissionGuard({
  permission,
  permissions,
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: readonly Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Can permission={permission} permissions={permissions} fallback={fallback}>
      {children}
    </Can>
  );
}

export function ModuleGuard({
  module,
  fallback = null,
  children,
}: {
  module: PermissionModule;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useModulePermissions(module);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function useCan(permission: Permission): boolean {
  return usePermission(permission);
}
