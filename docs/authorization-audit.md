# Authorization audit — enforcement matrix

Date: July 2026  
Scope: Permission catalog, server asserts, route/sidebar guards, UI `Can`, Roles & Permissions settings.

Companion: [identity-memberships-update.md](./identity-memberships-update.md)

---

## Architecture

| Layer | Source of truth |
|-------|-----------------|
| Membership role | `clinic_memberships.role` (+ optional `custom_role_id`) |
| Role grants | Code `ROLE_DEFAULTS`, or `clinic_role_permissions` when materialized |
| Overrides | `clinic_memberships.permission_overrides` (`grant[]` / `deny[]`) |
| JWT | Cache only (`tenant_id`, `staff_role`) — DB membership wins |

Resolution path: membership → role permission set → overrides → `assertPermission` / page gate / sidebar / `Can`.

---

## Permission catalog

Keys live in `src/lib/auth/permissions.ts`.

| Module | Permissions |
|--------|-------------|
| dashboard | `dashboard.view`, `queue.manage`, `walkin.create` |
| patients | `patients.view\|create\|update\|archive\|delete` |
| appointments | `appointments.view\|manage` |
| ehr | `ehr.view\|write\|prescribe` |
| finance | `finance.view\|record`, `revenue.view` |
| inventory | `inventory.view\|manage` |
| services | `services.manage` |
| team | `team.view\|ops\|roles` |
| clinic / settings | `clinic.manage`, `settings.view` |
| reports | `reports.view`, `analytics.view` |
| automation / ai | `automation.view`, `ai.view` |
| booking | `booking.link` |

System roles: `owner`, `admin`, `manager`, `doctor`, `receptionist`, `nurse`, `assistant`, `lab`, `cashier`, `intern`.

---

## Page → required permission

| Route | Permission |
|-------|------------|
| `/dashboard` | `dashboard.view` |
| `/dashboard/upcoming`, `/dashboard/agenda` | `appointments.view` |
| `/dashboard/notifications` | `dashboard.view` |
| `/dashboard/patients*` | `patients.view` |
| `/dashboard/services` | `services.manage` |
| `/dashboard/inventory` | `inventory.view` |
| `/dashboard/staff` | `team.view` |
| `/dashboard/analytics` | `analytics.view` |
| `/dashboard/financials` | `finance.view` |
| `/dashboard/marketing` | `automation.view` |
| `/dashboard/ai-assistant` | `ai.view` |
| `/dashboard/recalls` | `patients.view` |
| `/dashboard/settings` | `settings.view` |
| `/dashboard/settings/clinic`, `/schedule` | `clinic.manage` |
| `/dashboard/settings/roles` | `team.roles` |
| `/dashboard/account` | `settings.view` |

Denied URLs render **403 Access Denied** (`AccessDenied`), not 404.

Sidebar filters the same map via `permissionForDashboardPath`.

---

## Protected server actions (Critical / High)

| Action area | Permission |
|-------------|------------|
| Walk-in create | `walkin.create` |
| Appointment status / no-show / Mission Control queue | `queue.manage` |
| Patient payments | `finance.record` |
| Patient CRUD / archive / delete | `patients.*` |
| Inventory CRUD / restock | `inventory.manage` |
| Services CRUD | `services.manage` |
| Clinic profile / working hours | `clinic.manage` |
| Prescriptions | `ehr.prescribe` |
| Agenda / internal booking / follow-up / time blocks | `appointments.manage` |
| Patient media | `ehr.write` |
| Team ops | `team.ops` |
| Roles matrix | `team.roles` |
| Mission Control revenue widgets | `revenue.view` |

Helper: `requirePermission(permission)` → early `{ success: false, error }`.

---

## Intentionally open

- Public booking (`bookAppointment`, cancel-by-ticket)
- Register / login / logout
- `changeOwnPassword`
- `switchClinic` (membership-checked)
- Super-admin session paths (`getSuperAdminSession`)

---

## UI gates (`Can` / `usePermission`)

High-risk controls hidden when grant missing:

- Patients: edit / archive / delete menu items
- Patient financial card: record payment
- Inventory: add / edit / restock
- Services: add service
- Settings: clinic cards, booking link, roles card
- Clinic identity & schedule save buttons
- Financials receipt download

Server assert remains authoritative; UI gating is UX only.

---

## Roles & Permissions UI

- Route: `/dashboard/settings/roles` (`team.roles`)
- Migration: `030_clinic_roles.sql` — `clinic_roles`, `clinic_role_permissions`, membership `permission_overrides` + `custom_role_id`
- Actions: `manageRoles.ts` — list/save/reset/create/duplicate/delete custom roles
- System roles start from code defaults until first save materializes DB rows

---

## Default role matrix (summary)

| Role | Typical access |
|------|----------------|
| owner / admin | All |
| manager | Clinical + finance + inventory + services + clinic (no `team.roles` unless granted) |
| doctor | Clinical core + queue + prescribe |
| receptionist | Queue, patients (no delete), appointments, booking link |
| nurse / assistant | Queue assist, patients view/update, EHR write |
| lab | Patients/appointments/EHR write (no queue manage) |
| cashier | Finance view/record + patients view |
| intern | Read-oriented clinical + settings view |

Exact keys: `ROLE_DEFAULTS` in `permissions.ts`.

---

## Residual risks

1. **RLS remains tenant-scoped**, not permission-scoped — a compromised client with a valid JWT still cannot cross tenants, but permission enforcement is app-layer.
2. **Migrations 028–030 must be applied** on Supabase; without them, resolution falls back to JWT role + code defaults (no custom roles / overrides).
3. **Middleware** still checks login + `tenant_id` only — page guards and actions enforce RBAC (avoids stale JWT permission lag).
4. **Coming-soon modules** (`automation.view`, `ai.view`) gate routes early; product pages may still be placeholders.
5. **Membership override editor** for individual staff is schema-ready (`permission_overrides`) but not a full dedicated UI in this pass (matrix edits roles).
6. **Custom roles** are assignable via `custom_role_id`; Team Ops role dropdown still uses system `TeamRole` strings — assign custom roles via DB/membership until Team Ops is extended.

---

## Manual test checklist

1. Apply `028`, `029`, `030`.
2. Login as receptionist → cannot open `/dashboard/financials` or `/dashboard/settings/clinic` (403).
3. Crafted `deletePatient` / `saveDoctorProfile` as receptionist → denied.
4. Owner opens Settings → Roles & Permissions → toggle a permission → save → other session reflects after refresh.
5. Sidebar hides Inventory / Analytics for roles without those grants.
