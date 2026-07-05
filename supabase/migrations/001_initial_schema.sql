-- =============================================================================
-- Nawa (نواة) — Initial Multi-Tenant Schema
-- Migration: 001_initial_schema.sql
-- Target:   Supabase PostgreSQL
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum: appointment lifecycle status (Kanban columns)
-- ---------------------------------------------------------------------------
CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'checked_in',
  'completed',
  'no_show'
);

-- ---------------------------------------------------------------------------
-- Helper: resolve tenant_id from authenticated JWT app_metadata
-- Staff users must have app_metadata.tenant_id set at signup/login.
-- Returns NULL for unauthenticated or missing claim → RLS denies access.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    auth.jwt() -> 'app_metadata' ->> 'tenant_id',
    ''
  )::uuid;
$$;

COMMENT ON FUNCTION public.get_tenant_id() IS
  'Returns the tenant_id UUID from the current JWT app_metadata claim.';

-- ---------------------------------------------------------------------------
-- Table: tenants
-- Root entity — one row per clinic. No tenant_id (self-referencing root).
-- ---------------------------------------------------------------------------
CREATE TABLE public.tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE public.tenants IS 'Clinic / tenant root entity.';

-- ---------------------------------------------------------------------------
-- Table: services
-- Procedures offered by a clinic. Scoped by tenant_id.
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name             text        NOT NULL,
  duration_minutes integer     NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.services IS 'Bookable services per tenant.';

CREATE INDEX idx_services_tenant_id
  ON public.services USING btree (tenant_id);

-- ---------------------------------------------------------------------------
-- Table: patients
-- Patient records per tenant. no_show_count powers the Discipline Engine.
-- ---------------------------------------------------------------------------
CREATE TABLE public.patients (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name           text        NOT NULL,
  phone_number   text        NOT NULL,
  no_show_count  integer     NOT NULL DEFAULT 0 CHECK (no_show_count >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT patients_tenant_phone_unique UNIQUE (tenant_id, phone_number)
);

COMMENT ON TABLE public.patients IS 'Patient records scoped per tenant.';
COMMENT ON COLUMN public.patients.no_show_count IS
  'Strike counter incremented on no-show; >= 2 triggers soft-ban at booking layer.';

CREATE INDEX idx_patients_tenant_id
  ON public.patients USING btree (tenant_id);

-- ---------------------------------------------------------------------------
-- Table: appointments
-- Core queue entity. Kanban columns map to status enum values.
-- ---------------------------------------------------------------------------
CREATE TABLE public.appointments (
  id               uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid                   NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  patient_id       uuid                   NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  service_id       uuid                   NOT NULL REFERENCES public.services (id) ON DELETE RESTRICT,
  appointment_date timestamptz            NOT NULL,
  status           public.appointment_status NOT NULL DEFAULT 'pending',
  created_at       timestamptz            NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.appointments IS 'Appointments / queue cards scoped per tenant.';

CREATE INDEX idx_appointments_tenant_id
  ON public.appointments USING btree (tenant_id);

CREATE INDEX idx_appointments_appointment_date
  ON public.appointments USING btree (appointment_date);

-- Composite index: daily queue load filtered by tenant + date range
CREATE INDEX idx_appointments_tenant_date
  ON public.appointments USING btree (tenant_id, appointment_date);

-- Kanban filtering by status within a tenant
CREATE INDEX idx_appointments_tenant_status
  ON public.appointments USING btree (tenant_id, status);

-- ---------------------------------------------------------------------------
-- Row Level Security — enable on ALL tables (deny-by-default)
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants      FORCE ROW LEVEL SECURITY;

ALTER TABLE public.services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services     FORCE ROW LEVEL SECURITY;

ALTER TABLE public.patients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients     FORCE ROW LEVEL SECURITY;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS Policies: tenants
-- Match on id (tenants has no tenant_id column).
-- ---------------------------------------------------------------------------
CREATE POLICY tenants_select_own
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (id = public.get_tenant_id());

CREATE POLICY tenants_insert_own
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (id = public.get_tenant_id());

CREATE POLICY tenants_update_own
  ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (id = public.get_tenant_id())
  WITH CHECK (id = public.get_tenant_id());

CREATE POLICY tenants_delete_own
  ON public.tenants
  FOR DELETE
  TO authenticated
  USING (id = public.get_tenant_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: services
-- ---------------------------------------------------------------------------
CREATE POLICY services_select_tenant
  ON public.services
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY services_insert_tenant
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY services_update_tenant
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY services_delete_tenant
  ON public.services
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: patients
-- ---------------------------------------------------------------------------
CREATE POLICY patients_select_tenant
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY patients_insert_tenant
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY patients_update_tenant
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY patients_delete_tenant
  ON public.patients
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- ---------------------------------------------------------------------------
-- RLS Policies: appointments
-- ---------------------------------------------------------------------------
CREATE POLICY appointments_select_tenant
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY appointments_insert_tenant
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY appointments_update_tenant
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY appointments_delete_tenant
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());
