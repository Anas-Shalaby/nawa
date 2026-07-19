import type { TeamRole } from "@/lib/team/types";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";

/**
 * Module-grouped permission catalog for clinic authorization.
 * Add keys here first, map defaults per role, assert on the server, gate in the UI.
 */
export const PERMISSION_MODULES = [
  "dashboard",
  "patients",
  "appointments",
  "ehr",
  "finance",
  "inventory",
  "services",
  "team",
  "clinic",
  "settings",
  "reports",
  "automation",
  "ai",
  "booking",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSIONS = [
  // Dashboard / queue
  "dashboard.view",
  "queue.manage",
  "walkin.create",
  // Patients
  "patients.view",
  "patients.create",
  "patients.update",
  "patients.archive",
  "patients.delete",
  // Appointments
  "appointments.view",
  "appointments.manage",
  // EHR
  "ehr.view",
  "ehr.write",
  "ehr.prescribe",
  // Finance
  "finance.view",
  "finance.record",
  "revenue.view",
  // Inventory
  "inventory.view",
  "inventory.manage",
  // Services
  "services.manage",
  // Team
  "team.view",
  "team.ops",
  "team.roles",
  // Clinic / settings
  "clinic.manage",
  "settings.view",
  // Reports / analytics
  "reports.view",
  "analytics.view",
  // Coming soon modules
  "automation.view",
  "ai.view",
  // Booking link
  "booking.link",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface PermissionDefinition {
  key: Permission;
  module: PermissionModule;
}

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  { key: "dashboard.view", module: "dashboard" },
  { key: "queue.manage", module: "dashboard" },
  { key: "walkin.create", module: "dashboard" },
  { key: "patients.view", module: "patients" },
  { key: "patients.create", module: "patients" },
  { key: "patients.update", module: "patients" },
  { key: "patients.archive", module: "patients" },
  { key: "patients.delete", module: "patients" },
  { key: "appointments.view", module: "appointments" },
  { key: "appointments.manage", module: "appointments" },
  { key: "ehr.view", module: "ehr" },
  { key: "ehr.write", module: "ehr" },
  { key: "ehr.prescribe", module: "ehr" },
  { key: "finance.view", module: "finance" },
  { key: "finance.record", module: "finance" },
  { key: "revenue.view", module: "finance" },
  { key: "inventory.view", module: "inventory" },
  { key: "inventory.manage", module: "inventory" },
  { key: "services.manage", module: "services" },
  { key: "team.view", module: "team" },
  { key: "team.ops", module: "team" },
  { key: "team.roles", module: "team" },
  { key: "clinic.manage", module: "clinic" },
  { key: "settings.view", module: "settings" },
  { key: "reports.view", module: "reports" },
  { key: "analytics.view", module: "reports" },
  { key: "automation.view", module: "automation" },
  { key: "ai.view", module: "ai" },
  { key: "booking.link", module: "booking" },
];

const ALL: readonly Permission[] = PERMISSIONS;

const CLINICAL_CORE: readonly Permission[] = [
  "dashboard.view",
  "queue.manage",
  "walkin.create",
  "patients.view",
  "patients.create",
  "patients.update",
  "appointments.view",
  "appointments.manage",
  "ehr.view",
  "ehr.write",
  "ehr.prescribe",
  "revenue.view",
  "team.view",
  "team.ops",
  "settings.view",
];

const RECEPTION_CORE: readonly Permission[] = [
  "dashboard.view",
  "queue.manage",
  "walkin.create",
  "patients.view",
  "patients.create",
  "patients.update",
  "appointments.view",
  "appointments.manage",
  "ehr.view",
  "team.view",
  "team.ops",
  "booking.link",
  "settings.view",
];

const NURSE_CORE: readonly Permission[] = [
  "dashboard.view",
  "queue.manage",
  "patients.view",
  "patients.update",
  "appointments.view",
  "ehr.view",
  "ehr.write",
  "team.view",
  "settings.view",
];

const LAB_CORE: readonly Permission[] = [
  "dashboard.view",
  "patients.view",
  "appointments.view",
  "ehr.view",
  "ehr.write",
  "team.view",
  "settings.view",
];

const CASHIER_CORE: readonly Permission[] = [
  "dashboard.view",
  "patients.view",
  "appointments.view",
  "finance.view",
  "finance.record",
  "revenue.view",
  "settings.view",
];

const INTERN_CORE: readonly Permission[] = [
  "dashboard.view",
  "patients.view",
  "appointments.view",
  "ehr.view",
  "team.view",
  "settings.view",
];

const MANAGER_CORE: readonly Permission[] = [
  ...CLINICAL_CORE,
  "patients.archive",
  "finance.view",
  "finance.record",
  "inventory.view",
  "inventory.manage",
  "services.manage",
  "reports.view",
  "analytics.view",
  "booking.link",
  "clinic.manage",
];

/**
 * Default grants by membership role (system roles).
 */
export const ROLE_DEFAULTS: Record<TeamRole, readonly Permission[]> = {
  owner: ALL,
  admin: ALL,
  manager: MANAGER_CORE,
  doctor: CLINICAL_CORE,
  receptionist: RECEPTION_CORE,
  nurse: NURSE_CORE,
  assistant: NURSE_CORE,
  lab: LAB_CORE,
  cashier: CASHIER_CORE,
  intern: INTERN_CORE,
};

const DENIAL_MESSAGES: Record<Permission, string> = {
  "dashboard.view": "You do not have permission to view the dashboard.",
  "queue.manage": "You do not have permission to manage the queue.",
  "walkin.create": "You do not have permission to create walk-ins.",
  "patients.view": "You do not have permission to view patients.",
  "patients.create": "You do not have permission to create patients.",
  "patients.update": "You do not have permission to update patients.",
  "patients.archive": "You do not have permission to archive patients.",
  "patients.delete": "You do not have permission to delete patients.",
  "appointments.view": "You do not have permission to view appointments.",
  "appointments.manage": "You do not have permission to manage appointments.",
  "ehr.view": "You do not have permission to view medical records.",
  "ehr.write": "You do not have permission to edit medical records.",
  "ehr.prescribe": "You do not have permission to prescribe.",
  "finance.view": "You do not have permission to view finance.",
  "finance.record": "You do not have permission to record payments.",
  "revenue.view": "You do not have permission to view revenue.",
  "inventory.view": "You do not have permission to view inventory.",
  "inventory.manage": "You do not have permission to manage inventory.",
  "services.manage": "You do not have permission to manage services.",
  "team.view": "You do not have permission to view the team.",
  "team.ops": "You do not have permission to manage the team.",
  "team.roles": "You do not have permission to change roles or access.",
  "clinic.manage": "You do not have permission to manage clinic settings.",
  "settings.view": "You do not have permission to view settings.",
  "reports.view": "You do not have permission to view reports.",
  "analytics.view": "You do not have permission to view analytics.",
  "automation.view": "You do not have permission to view automation.",
  "ai.view": "You do not have permission to use the AI assistant.",
  "booking.link": "You do not have permission to manage the booking link.",
};

export function permissionsForRole(
  role: string | null | undefined,
  isSuspended = false,
): ReadonlySet<Permission> {
  if (isSuspended) return new Set();
  const normalized = normalizeTeamRole(role);
  return new Set(ROLE_DEFAULTS[normalized] ?? []);
}

export function roleHasPermission(
  role: string | null | undefined,
  permission: Permission,
  isSuspended = false,
): boolean {
  return permissionsForRole(role, isSuspended).has(permission);
}

export function denialMessage(permission: Permission): string {
  return DENIAL_MESSAGES[permission];
}

export function applyPermissionOverrides(
  base: ReadonlySet<Permission>,
  overrides?: { grant?: string[]; deny?: string[] } | null,
): Set<Permission> {
  const next = new Set(base);
  for (const key of overrides?.grant ?? []) {
    if ((PERMISSIONS as readonly string[]).includes(key)) {
      next.add(key as Permission);
    }
  }
  for (const key of overrides?.deny ?? []) {
    next.delete(key as Permission);
  }
  return next;
}

export function permissionsInModule(module: PermissionModule): Permission[] {
  return PERMISSION_DEFINITIONS.filter((d) => d.module === module).map((d) => d.key);
}

/** Legacy UI/action flags derived from the catalog (stable for existing screens). */
export function capabilityFlagsFromRole(
  role: string | null | undefined,
  isSuspended = false,
): {
  canViewRevenue: boolean;
  canManageQueue: boolean;
  canCreateWalkIn: boolean;
  canManageClinic: boolean;
} {
  const grants = permissionsForRole(role, isSuspended);
  return {
    canViewRevenue: grants.has("revenue.view") || grants.has("finance.view"),
    canManageQueue: grants.has("queue.manage"),
    canCreateWalkIn: grants.has("walkin.create"),
    canManageClinic: grants.has("clinic.manage"),
  };
}

/** Route → minimum permission to open the page. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard.view",
  "/dashboard/floor": "dashboard.view",
  "/dashboard/upcoming": "appointments.view",
  "/dashboard/agenda": "appointments.view",
  "/dashboard/notifications": "dashboard.view",
  "/dashboard/patients": "patients.view",
  "/dashboard/services": "services.manage",
  "/dashboard/inventory": "inventory.view",
  "/dashboard/staff": "team.view",
  "/dashboard/analytics": "analytics.view",
  "/dashboard/financials": "finance.view",
  "/dashboard/marketing": "automation.view",
  "/dashboard/ai-assistant": "ai.view",
  "/dashboard/recalls": "patients.view",
  "/dashboard/settings": "settings.view",
  "/dashboard/settings/clinic": "clinic.manage",
  "/dashboard/settings/schedule": "clinic.manage",
  "/dashboard/settings/roles": "team.roles",
  "/dashboard/account": "settings.view",
};

export function permissionForDashboardPath(pathname: string): Permission | null {
  const normalized = pathname.replace(/^\/(ar|en)/, "") || pathname;
  const exact = ROUTE_PERMISSIONS[normalized];
  if (exact) return exact;
  if (normalized.startsWith("/dashboard/patients/")) return "patients.view";
  return null;
}
