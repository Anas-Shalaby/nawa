"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Permission, PermissionModule } from "@/lib/auth/permissions";
import { permissionsInModule } from "@/lib/auth/permissions";

interface PermissionContextValue {
  role: string;
  grants: ReadonlySet<Permission>;
  isSuspended: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  canModule: (module: PermissionModule) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  role,
  grants,
  isSuspended,
  children,
}: {
  role: string;
  grants: Permission[];
  isSuspended: boolean;
  children: ReactNode;
}) {
  const value = useMemo<PermissionContextValue>(() => {
    const set = new Set(grants);
    return {
      role,
      grants: set,
      isSuspended,
      can: (permission) => !isSuspended && set.has(permission),
      canAny: (permissions) =>
        !isSuspended && permissions.some((permission) => set.has(permission)),
      canModule: (module) =>
        !isSuspended &&
        permissionsInModule(module).some((permission) => set.has(permission)),
    };
  }, [role, grants, isSuspended]);

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
}

export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    return {
      role: "receptionist",
      grants: new Set(),
      isSuspended: false,
      can: () => false,
      canAny: () => false,
      canModule: () => false,
    };
  }
  return ctx;
}

export function usePermission(permission: Permission): boolean {
  return usePermissionContext().can(permission);
}

export function useModulePermissions(module: PermissionModule): boolean {
  return usePermissionContext().canModule(module);
}
