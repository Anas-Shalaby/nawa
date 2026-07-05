# Nawa (نواة) — Engineering Progress

> **Save State:** Update this file whenever you start, finish, or pause work.
> Move tasks between sections. Only one task should be in **IN PROGRESS** at a time.

**Last updated:** 2026-07-05 (Phase 16 — Flexible Scheduling & Upcoming Agenda)

---

## IN PROGRESS

_Nothing in progress. Pick the next TODO task._

---

## TODO

### Phase 2: Project Initialization

- [x] **Initialize Next.js 14 project**
  - App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory
  - Acceptance: `npm run dev` serves pages at `localhost:3000`
  - Completed: 2026-07-05

- [x] **Install core dependencies (partial)**
  - `framer-motion`, `lucide-react`, `react-hook-form`, `zod`, `@hookform/resolvers`; Supabase packages pending
  - Completed: 2026-07-05

- [x] **Configure environment variables**
  - `.env.local.example` with Supabase, dev auth, MOCK_TENANT_ID
  - Completed: 2026-07-05

- [x] **Install Supabase packages**
  - `@supabase/supabase-js`, `@supabase/ssr`
  - Completed: 2026-07-05

- [ ] **Setup Git repository**
  - `.gitignore` added; initial commit pending
  - Acceptance: Clean initial commit ready

---

### Phase 3: Supabase & Database

- [ ] **Create Supabase project**
  - Enable Auth, configure site URL and redirect URLs
  - Acceptance: Project dashboard accessible, anon and service role keys copied

- [x] **Write migration: schema + RLS (`001_initial_schema.sql`)**
  - Enums, `tenants`, `services`, `patients`, `appointments`, indexes, RLS policies, `get_tenant_id()` helper
  - Acceptance: `supabase db push` applies without errors
  - Completed: 2026-07-05

- [x] **Write migration: RLS policies**
  - Included in `001_initial_schema.sql` (no separate `002` file needed)
  - Completed: 2026-07-05

- [ ] **Write migration: RPC functions (`003_rpc_functions.sql`)**
  - `book_appointment`, `confirm_appointment`, `mark_no_show`
  - Acceptance: Each RPC callable via Supabase SQL editor with test data

- [ ] **Create seed data (`seed.sql`)**
  - Basic seed added; run manually in Supabase SQL editor
  - Acceptance: Kanban board populated from DB on first load

---

### Phase 4: Authentication & Tenant Context

- [x] **Build Supabase client helpers**
  - `src/utils/supabase/` — server, client, middleware, auth
  - Completed: 2026-07-05

- [ ] **Setup Supabase Auth for clinic staff (production)**
  - Email/password signup with tenant provisioning flow
  - Acceptance: New staff user has `app_metadata.tenant_id` set after signup

- [ ] **Implement auth middleware (login guard)**
  - Protect `(dashboard)` routes; redirect unauthenticated to `/login`
  - Acceptance: `/dashboard` redirects to login when logged out

- [ ] **Build login and signup pages**
  - Minimal dark-mode forms under `app/(auth)/`
  - Acceptance: Staff can sign up, log in, and land on dashboard

---

### Phase 5: Clinic Dashboard — Supabase wiring remaining

- [x] **Add realtime sync**
  - Supabase Realtime on `appointments` filtered by `tenantId`; live Pending inserts + status updates
  - Completed: 2026-07-05

- [x] **Optimistic Kanban drag-and-drop**
  - `useOptimisticAppointments` shim + instant column moves with server action rollback
  - Completed: 2026-07-05

- [x] **Walk-in queue entry**
  - `WalkInModal` + `addWalkIn` server action → inserts directly into Checked-in
  - Completed: 2026-07-05

- [x] **Daily Pulse bar**
  - Live stats: Total, Pending, Completed, No-Shows
  - Completed: 2026-07-05

---

### Phase 6: Patient Booking Portal (PWA) — remaining

- [x] **Post-booking success ticket**
  - Directions CTA, pre-visit instructions, animated ticket layout
  - Completed: 2026-07-05

- [x] **Self-cancellation**
  - `cancelAppointment` server action → `canceled` status; slot freed via Realtime
  - Completed: 2026-07-05

- [x] **Implement service selector**
  - `ServiceSelector` cards + per-service slot fetch; links `service_id` on booking
  - Completed: 2026-07-05

- [x] **Public booking via slug (unauthenticated)**
  - `publicBooking.ts` + service-role server actions scoped by slug / tenant_id
  - Completed: 2026-07-05

- [x] **Integrate booking with Supabase (server action)**
  - `bookAppointment` inserts patients + appointments with soft-ban gate
  - Completed: 2026-07-05

- [ ] **Integrate booking RPC (optional hardening)**
  - Move logic to `book_appointment` SECURITY DEFINER RPC for anon public portal
  - Acceptance: Booking works without dev staff session

- [ ] **Configure PWA manifest**
  - `manifest.json`, service worker shell, installable on mobile
  - Acceptance: Lighthouse PWA audit passes installability check

---

### Phase 7: Discipline Engine

- [ ] **Implement smart confirmation route (`/confirm/[token]`)**
  - Public page calls `confirm_appointment` RPC
  - Acceptance: Valid token sets status to `confirmed`; expired/invalid token shows error

- [ ] **Integrate WhatsApp API provider**
  - Choose provider (e.g., Meta Cloud API, Twilio); implement send helper in `lib/whatsapp/`
  - Acceptance: Test message delivers to a real WhatsApp number

- [ ] **Build confirmation message template**
  - Arabic-friendly message with smart link: `nawa.app/confirm/{token}`
  - Acceptance: Message renders correctly with patient name, date, and clickable link

- [ ] **Setup 24h reminder cron job**
  - `app/api/cron/reminders/route.ts` protected by `CRON_SECRET`
  - Acceptance: Cron finds appointments 23–25h away, sends WhatsApp, sets `reminder_sent_at`

- [ ] **Build reminder message template**
  - Includes confirmation link and clinic contact
  - Acceptance: Reminder delivers 24h before appointment

- [ ] **Verify two-strikes end-to-end**
  - Mark patient no-show twice → attempt web booking → verify soft-ban gate
  - Acceptance: Third booking attempt returns `SOFT_BANNED`; patient sees `/banned` page

---

### Phase 8: Polish & Deploy

- [x] **Landing page (RTL-first Arabic marketing)**
  - Hero, features, pricing, abstract Kanban mockups — `components/landing/`, `/ar` home
  - Completed: 2026-07-05

- [x] **B2B clinic onboarding (`/register`)**
  - `registerClinic` server action — signUp, tenant insert, slug generation, dashboard redirect
  - Completed: 2026-07-05

- [x] **Clinic settings page (`/dashboard/settings`)**
  - Service CRUD + copy booking link
  - Completed: 2026-07-05

- [ ] **Apply UI guidelines across all pages**
  - Dark dashboard, stylized assets, no stock photos
  - Acceptance: Visual review passes `ui-guidelines.md` checklist

- [x] **Add Arabic/RTL support (core)** — moved to DONE (Localization section)

- [ ] **Write local development guide**
  - README with setup steps, env vars, seed instructions
  - Acceptance: Fresh clone → running app in under 10 minutes

- [ ] **Deploy to Vercel**
  - Connect repo, set env vars, configure cron schedule
  - Acceptance: Production URL serves booking portal and dashboard

- [ ] **Deploy Supabase migrations to production**
  - Run migrations, apply RLS, verify policies
  - Acceptance: Production DB matches local schema with RLS active

- [ ] **Smoke test production**
  - Full flow: book → remind → confirm → check-in → complete
  - Acceptance: End-to-end flow works on production URLs

---

## DONE

### Phase 3: Supabase & Database (partial)

- [x] **Write migration: initial schema + RLS (`supabase/migrations/001_initial_schema.sql`)**
  - Tables: `tenants`, `services`, `patients`, `appointments`; enum `appointment_status`; B-tree indexes; RLS on all tables
  - Completed: 2026-07-05

### Phase 2: Project Initialization (partial)

- [x] **Initialize Next.js 14 project** — Completed: 2026-07-05
- [x] **Install core dependencies (partial)** — `framer-motion`, `lucide-react`; Completed: 2026-07-05

---

### Database Integration (Supabase ↔ Next.js)

- [x] **Supabase SSR clients (`src/utils/supabase/`)**
  - `server.ts`, `client.ts`, `middleware.ts`, `auth.ts` with dev session + MOCK_TENANT_ID
  - Completed: 2026-07-05

- [x] **Server Actions (`src/actions/`)**
  - `bookAppointment` — patient upsert, soft-ban gate (`no_show_count >= 2`), appointment insert
  - `updateAppointmentStatus` — status update + strike increment on `no_show`
  - Completed: 2026-07-05

- [x] **Server-side data fetching**
  - Dashboard: `src/lib/queries/dashboard.ts` → today's appointments JOIN
  - Booking: `src/lib/queries/booking.ts` → tenant, services, slot availability
  - Completed: 2026-07-05

- [x] **Wire Kanban + Booking UI to Supabase**
  - Dashboard page + drag/no-show actions; booking portal page + form submit
  - Completed: 2026-07-05

- [x] **Middleware session refresh**
  - Chained with next-intl middleware
  - Completed: 2026-07-05

- [x] **Seed script (`supabase/seed.sql`)**
  - Demo tenant `nova-dental`, services, patients (incl. banned)
  - Completed: 2026-07-05

---

### Phase 7: UX / Realtime Polish

- [x] **Supabase Realtime on appointments**
  - `useAppointmentsRealtime` — INSERT/UPDATE/DELETE sync to Kanban without refresh
  - Completed: 2026-07-05

- [x] **Optimistic UI for Kanban**
  - `useOptimisticAppointments` shim + instant column moves with server action rollback
  - Completed: 2026-07-05

- [x] **Walk-in + Daily Pulse dashboard features**
  - `WalkInModal`, `DailyPulseBar`, `addWalkIn` server action
  - Completed: 2026-07-05

- [x] **Booking success ticket + patient cancel**
  - Premium ticket UI with directions, pre-visit notes, `cancelAppointment` action
  - Completed: 2026-07-05

- [x] **Migration: `canceled` status + Realtime publication**
  - `supabase/005_canceled_status_and_realtime.sql`
  - Completed: 2026-07-05

---

### Phase 8: Landing Page & B2B Onboarding

- [x] **Marketing landing page**
  - RTL-first Arabic hero, 3 feature pillars, pricing (500 EGP setup + 3,000 EGP/6mo)
  - Framer Motion scroll reveals + stylized Kanban mockups (no stock photos)
  - Completed: 2026-07-05

- [x] **Clinic registration flow (`/[locale]/register`)**
  - Clinic name, doctor email, password → Supabase signUp + tenant row + slug
  - Duplicate slug suffix handling; error states (email in use, weak password)
  - Completed: 2026-07-05

- [x] **Slug utility (`src/lib/onboarding/slug.ts`)**
  - Arabic clinic name → URL slug (e.g. عيادة النور → al-nwr-clinic)
  - Completed: 2026-07-05

---

### Phase 9: Clinic Settings & Final Patient Flow

- [x] **Settings page (`/[locale]/dashboard/settings`)**
  - Fetch tenant + services (SSR); add/delete services; copy booking link
  - Completed: 2026-07-05

- [x] **Service management server actions**
  - `addService`, `deleteService` — authenticated, tenant-scoped via RLS
  - Completed: 2026-07-05

- [x] **Public patient booking by slug**
  - Tenant + services fetched by slug; no JWT tenant filter
  - Completed: 2026-07-05

- [x] **Service selector in booking flow**
  - Framer Motion cards → slot picker → patient form → `bookAppointment`
  - Completed: 2026-07-05

- [x] **Booking/cancel actions tenant-bound**
  - Service role server actions validate slug + service ownership before INSERT/UPDATE
  - Completed: 2026-07-05

---

### Phase 10: SaaS Layout & Advanced Services

- [x] **Dashboard SaaS layout (`/[locale]/dashboard/layout.tsx`)**
  - Collapsible RTL sidebar, topbar, mobile hamburger drawer, dark aesthetic
  - Completed: 2026-07-05

- [x] **Advanced services schema (`006_advanced_services.sql`)**
  - `price_egp`, `pre_visit_instructions` on `services` table
  - Completed: 2026-07-05

- [x] **Services CRUD page (`/dashboard/services`)**
  - Modal form with name, price, duration, instructions; detailed service cards
  - Completed: 2026-07-05

- [x] **Patients CRM shell (`/dashboard/patients`)**
  - Tenant-scoped patient list with no-show strikes
  - Completed: 2026-07-05

- [x] **Patient booking service cards enriched**
  - Public cards show duration, price, pre-visit instructions before booking
  - Completed: 2026-07-05

---

### Phase 11: Vertical Smart Queue UI Refactor

- [x] **Replace Kanban with Master-Detail split layout**
  - 60% detail panel (left in RTL) / 40% vertical queue (right in RTL); logical grid columns
  - Completed: 2026-07-05

- [x] **Smart vertical queue with state machine buttons**
  - pending → confirmed → checked_in → in_session → completed; Framer Motion `layout` animations
  - Completed: 2026-07-05

- [x] **Appointment detail panel**
  - Patient info, WhatsApp deep link, service duration/price, Discipline Engine no-show action
  - Completed: 2026-07-05

- [x] **`in_session` status migration (`007_in_session_status.sql`)**
  - New enum value for clinic session workflow
  - Completed: 2026-07-05

- [x] **Optimistic updates + Supabase Realtime preserved**
  - Instant button feedback; realtime sync with pending-transition guard
  - Completed: 2026-07-05

---

### Phase 12: Intelligent Dashboard, CRM CRUD, and Financial ROI Page

- [x] **Intelligent analytics KPI bar (`AnalyticsKpiBar`)**
  - Attendance rate, saved hours, warning patients, peak-hours chart (recharts)
  - Completed: 2026-07-05

- [x] **Backfill tracking migration (`008_crm_and_backfill_tracking.sql`)**
  - `patients.notes`, `patients.is_archived`, `appointments.replaced_appointment_id`
  - Completed: 2026-07-05

- [x] **Advanced Patient CRM CRUD (`/dashboard/patients`)**
  - Search, Active/Warning/Archived filters, modal create/edit, soft archive
  - Completed: 2026-07-05

- [x] **Billing & ROI Tracker (`/dashboard/financials`)**
  - Daily/monthly revenue, Nawa Saved Revenue widget, recent transactions
  - Completed: 2026-07-05

---

### Phase 13: Visual EHR & Storage Integration

- [x] **`patient_media` schema + `clinic_ehr` storage RLS (`009_patient_media_ehr.sql`)**
  - Tags: before, after, x-ray, general; tenant-scoped bucket paths
  - Completed: 2026-07-05

- [x] **Secure upload flow (`mediaActions.ts` + `lib/media/storage.ts`)**
  - Client uploads to Storage; server action inserts DB record with path validation
  - Completed: 2026-07-05

- [x] **Visual EHR gallery with lightbox**
  - Masonry grid, drag-and-drop upload, signed URLs, Framer Motion lightbox
  - Completed: 2026-07-05

- [x] **Patient detail tabs (General Info | Visual EHR)**
  - Dashboard detail panel + `/dashboard/patients/[id]` full record page
  - Completed: 2026-07-05

- [x] **Enterprise-Grade Visual EHR (Phase 13b)**
  - Clinical vertical timeline by session, before/after compare slider, theater presentation mode
  - Completed: 2026-07-05

---

### Phase 14: The Market Dominators — Financial Ledger, Recalls, WhatsApp CRM

- [x] **Financial ledger migration (`010_financial_ledger.sql`)**
  - `patients.total_balance_due`, `patient_payments` table with tenant RLS
  - Completed: 2026-07-05

- [x] **Patient financial card + secure payment recording**
  - Split-screen ledger on `/dashboard/patients/[id]`; server action validates and decrements balance
  - Completed: 2026-07-05

- [x] **Revenue recall engine (`/dashboard/recalls`)**
  - Patients whose last `completed` visit was > 6 months ago; sidebar nav entry
  - Completed: 2026-07-05

- [x] **Zero-cost WhatsApp CRM (`WhatsAppActionMenu`)**
  - Three `wa.me` templates (appointment, financial due, recall); integrated in patient detail, queue panel, recalls
  - Completed: 2026-07-05

---

### Phase 15: Continuous Care Loop & Follow-ups

- [x] **`doctor_notes` column migration (`011_doctor_notes.sql`)**
  - Session instructions on `appointments`; used when booking follow-up visits
  - Completed: 2026-07-05

- [x] **Follow-up modal (`FollowUpModal`)**
  - Quick date presets (1w / 2w / 1m), custom picker, service selector, doctor notes; Framer Motion
  - Completed: 2026-07-05

- [x] **Queue integration + `scheduleFollowUp` server action**
  - Opens on «إنهاء» complete; optimistic dismiss; inserts `confirmed` future appointment
  - Completed: 2026-07-05

---

### Phase 16: Flexible Scheduling & Upcoming Agenda

- [x] **On-demand scheduling (`ScheduleSessionModal` + `ScheduleSessionButton`)**
  - Removed auto modal on complete; permanent «+ حجز موعد / إعادة كشف» in patient detail views
  - Type toggle (كشف جديد / إعادة كشف), date/time picker, service & doctor notes
  - Completed: 2026-07-05

- [x] **`is_re_examination` migration (`012_is_re_examination.sql`)**
  - Re-exam visits flagged at 0 EGP display; stored on confirmed future appointments
  - Completed: 2026-07-05

- [x] **Upcoming Agenda page (`/dashboard/agenda`)**
  - Future appointments grouped by date; re-exam badge, doctor notes, 1-click WhatsApp reminder
  - Completed: 2026-07-05

---

### Localization & RTL (i18n architecture)

- [x] **Integrate `next-intl` with locale routing**
  - `ar` default, `en` secondary; middleware redirects `/` → `/ar`
  - Completed: 2026-07-05

- [x] **Dynamic `<html dir lang>` per locale**
  - `dir="rtl" lang="ar"` / `dir="ltr" lang="en"` in `src/app/[locale]/layout.tsx`
  - Completed: 2026-07-05

- [x] **Dictionary files (`src/messages/ar.json`, `en.json`)**
  - Patient portal + secretary dashboard strings (incl. احجز موعدك، رقم الواتساب، جديد، تم التأكيد، لم يحضر)
  - Completed: 2026-07-05

- [x] **Tailwind logical properties policy**
  - Documented in `tailwind.config.ts`; components use `ms/me/ps/pe/start/end/text-start`
  - Completed: 2026-07-05

- [x] **RTL-safe Framer Motion**
  - `slideInX()` helper; directional icons use `rtl:rotate-180`
  - Kanban pipeline stays `dir="ltr"` per ui-guidelines
  - Completed: 2026-07-05

- [x] **Locale switcher + IBM Plex Sans Arabic font**
  - `LocaleSwitcher` fixed top-end; preserves path on toggle
  - Completed: 2026-07-05

---

### Phase 6: Patient Booking Smart Link — UI complete

- [x] **Build booking page (`src/app/[locale]/[slug]/page.tsx`)**
  - Dynamic tenant slug; mock tenant resolution; 404 for invalid slugs
  - Demo: `/ar/nova-dental`, `/en/glow-derm`
  - Completed: 2026-07-05

- [x] **Build slot picker**
  - Mock available slots; taken slots disabled; mobile-first grid
  - Completed: 2026-07-05

- [x] **Build patient form (React Hook Form + Zod)**
  - Name + Egyptian WhatsApp validation; 52px touch targets
  - Completed: 2026-07-05

- [x] **Two-strikes soft-ban UI**
  - `SoftBanCard` on `SOFT_BANNED` response; submit replaced with call-clinic CTA
  - Test with WhatsApp `01999999999` (mock banned number)
  - Completed: 2026-07-05

- [x] **Booking server action placeholder**
  - `src/lib/booking/actions.ts` — mock `bookAppointment` with SOFT_BANNED / SLOT_TAKEN handling
  - Completed: 2026-07-05

- [x] **Mobile-first light theme booking layout**
  - `src/app/[slug]/layout.tsx`, stylized SVG icons (no stock photos)
  - Completed: 2026-07-05

---

### Phase 5: Clinic Dashboard (Kanban) — UI scaffolding complete

- [x] **Build dashboard header shell**
  - `DashboardHeader` with clinic name, date, appointment count
  - Completed: 2026-07-05

- [x] **Build Kanban board UI (`src/app/dashboard/page.tsx`)**
  - 4 columns: Pending, Confirmed, Checked-in, Completed; mock data
  - Components: `KanbanBoard`, `KanbanColumn`, `AppointmentCard`, `DashboardHeader`
  - Completed: 2026-07-05

- [x] **Implement Framer Motion drag-and-drop**
  - Drag cards between columns with spring animations; optimistic UI updates
  - Completed: 2026-07-05

- [x] **Add No-Show action button on cards**
  - Calls `markAppointmentNoShow` server action placeholder; removes card from board
  - Completed: 2026-07-05

- [x] **Structure server action placeholders**
  - `src/lib/dashboard/actions.ts`: `updateAppointmentStatus`, `markAppointmentNoShow`, `getDailyQueue`
  - Completed: 2026-07-05

---

### Phase 1: Documentation Scaffolding

- [x] **Create `docs/architecture.md`**
  - Project structure, DB schema (tenants, services, patients, appointments), RLS strategy, key flows
  - Completed: 2026-07-05

- [x] **Create `docs/progress.md`**
  - Kanban-style engineering checklist (this file)
  - Completed: 2026-07-05

- [x] **Create `docs/ui-guidelines.md`**
  - Visual identity, color palette, typography, motion rules, anti-patterns
  - Completed: 2026-07-05

---

## Notes

_Use this section for blockers, decisions, and context when resuming work._

| Date | Note |
|------|------|
| 2026-07-05 | Phase 1 complete. Next up: Phase 2 — initialize Next.js 14 project. |
| 2026-07-05 | Phase 10 — SaaS sidebar layout, advanced services CRUD, enriched patient service cards. |
| 2026-07-05 | Phase 11 — Vertical smart queue replaces Kanban; master-detail layout with state machine actions. |
| 2026-07-05 | Phase 12 — Analytics KPIs, patient CRM CRUD with archive, financial ROI page with backfill revenue. |
| 2026-07-05 | Phase 13 — Visual EHR with Supabase Storage, patient media gallery, tabbed detail panel. |
| 2026-07-05 | Phase 13b — Clinical timeline, before/after slider, theater presentation mode for patient privacy. |
| 2026-07-05 | Phase 14 — Financial ledger, recall engine, zero-cost WhatsApp CRM via wa.me templates. |
| 2026-07-05 | Phase 15 — Follow-up modal on complete, doctor_notes, scheduleFollowUp server action. |
| 2026-07-05 | Phase 16 — On-demand scheduling modal, upcoming agenda page, is_re_examination flag. |
| | WhatsApp provider TBD — evaluate Meta Cloud API vs Twilio during Phase 7. |
| | Multi-tenancy: `tenant_id` column + RLS (not schema-per-tenant). |
