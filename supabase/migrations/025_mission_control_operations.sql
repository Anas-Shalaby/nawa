-- =============================================================================
-- Nawa — Mission Control operational schema
-- Migration: 025_mission_control_operations.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.patient_gender AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_priority AS ENUM ('normal', 'urgent', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.arrival_source AS ENUM ('online', 'walk_in', 'phone', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_availability AS ENUM ('available', 'busy', 'break', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'waived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.operational_task_type AS ENUM (
    'confirmation',
    'insurance_approval',
    'lab_result',
    'refill_request',
    'long_wait',
    'missing_payment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.operational_task_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- patients — demographics & insurance
-- ---------------------------------------------------------------------------
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender public.patient_gender NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_member_id text;

COMMENT ON COLUMN public.patients.date_of_birth IS 'Used for age display on Mission Control cards.';
COMMENT ON COLUMN public.patients.gender IS 'Patient gender for operational context.';
COMMENT ON COLUMN public.patients.insurance_provider IS 'Optional insurance carrier name.';
COMMENT ON COLUMN public.patients.insurance_member_id IS 'Optional insurance member/policy id.';

-- ---------------------------------------------------------------------------
-- appointments — operational timestamps & assignment
-- ---------------------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS priority public.appointment_priority NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS arrival_source public.arrival_source,
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid,
  ADD COLUMN IF NOT EXISTS room_id uuid,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_follow_up boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.appointments.is_follow_up IS
  'Follow-up visit flag; mirrors is_re_examination when both exist.';

-- Backfill is_follow_up from legacy column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'is_re_examination'
  ) THEN
    UPDATE public.appointments
    SET is_follow_up = is_re_examination
    WHERE is_follow_up = false AND is_re_examination = true;
  END IF;
END $$;

-- Infer arrival_source for historical rows
UPDATE public.appointments
SET arrival_source = 'walk_in'::public.arrival_source
WHERE arrival_source IS NULL
  AND status IN ('checked_in', 'in_session')
  AND checked_in_at IS NULL;

UPDATE public.appointments
SET checked_in_at = appointment_date
WHERE status IN ('checked_in', 'in_session', 'completed')
  AND checked_in_at IS NULL;

UPDATE public.appointments
SET session_started_at = appointment_date
WHERE status IN ('in_session', 'completed')
  AND session_started_at IS NULL;

UPDATE public.appointments
SET completed_at = appointment_date
WHERE status = 'completed'
  AND completed_at IS NULL;

-- ---------------------------------------------------------------------------
-- clinic_rooms
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinic_rooms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  label       text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinic_rooms IS 'Physical rooms used for Mission Control occupancy.';

CREATE INDEX IF NOT EXISTS idx_clinic_rooms_tenant
  ON public.clinic_rooms USING btree (tenant_id, sort_order);

-- ---------------------------------------------------------------------------
-- staff_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id                  uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid                      NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id             uuid,
  display_name        text                      NOT NULL,
  role                text                      NOT NULL DEFAULT 'doctor',
  availability        public.staff_availability NOT NULL DEFAULT 'available',
  current_room_id     uuid                      REFERENCES public.clinic_rooms (id) ON DELETE SET NULL,
  status_changed_at   timestamptz               NOT NULL DEFAULT now(),
  avg_consult_minutes integer                   NOT NULL DEFAULT 20 CHECK (avg_consult_minutes > 0),
  created_at          timestamptz               NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.staff_profiles IS 'Clinic staff operational status for Mission Control radar.';

CREATE INDEX IF NOT EXISTS idx_staff_profiles_tenant
  ON public.staff_profiles USING btree (tenant_id, availability);

-- FK from appointments after staff_profiles exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_assigned_staff_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_assigned_staff_id_fkey
      FOREIGN KEY (assigned_staff_id) REFERENCES public.staff_profiles (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_room_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES public.clinic_rooms (id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- appointment_invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointment_invoices (
  id              uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid                   NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  appointment_id  uuid                   NOT NULL REFERENCES public.appointments (id) ON DELETE CASCADE,
  amount_due      integer                NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  amount_paid     integer                NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status          public.invoice_status  NOT NULL DEFAULT 'unpaid',
  created_at      timestamptz            NOT NULL DEFAULT now(),
  updated_at      timestamptz            NOT NULL DEFAULT now(),

  CONSTRAINT appointment_invoices_unique UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_invoices_tenant
  ON public.appointment_invoices USING btree (tenant_id, status);

-- ---------------------------------------------------------------------------
-- operational_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_tasks (
  id              uuid                          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid                          NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  task_type       public.operational_task_type  NOT NULL,
  status          public.operational_task_status NOT NULL DEFAULT 'open',
  severity        smallint                      NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  title           text                          NOT NULL,
  detail          text,
  appointment_id  uuid                          REFERENCES public.appointments (id) ON DELETE CASCADE,
  patient_id      uuid                          REFERENCES public.patients (id) ON DELETE CASCADE,
  due_at          timestamptz,
  created_at      timestamptz                   NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_operational_tasks_tenant_open
  ON public.operational_tasks USING btree (tenant_id, status, severity DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date_status
  ON public.appointments USING btree (tenant_id, appointment_date, status);

-- ---------------------------------------------------------------------------
-- Status transition timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_appointment_operational_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'checked_in'::public.appointment_status AND NEW.checked_in_at IS NULL THEN
      NEW.checked_in_at := now();
    END IF;

    IF NEW.status = 'in_session'::public.appointment_status AND NEW.session_started_at IS NULL THEN
      NEW.session_started_at := now();
    END IF;

    IF NEW.status = 'completed'::public.appointment_status AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;

    IF NEW.status = 'checked_in'::public.appointment_status
       AND NEW.arrival_source IS NULL THEN
      NEW.arrival_source := 'internal'::public.arrival_source;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_operational_timestamps ON public.appointments;
CREATE TRIGGER trg_appointments_operational_timestamps
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_operational_timestamps();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.clinic_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_rooms FORCE ROW LEVEL SECURITY;

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.appointment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY clinic_rooms_select_tenant ON public.clinic_rooms
  FOR SELECT TO authenticated USING (tenant_id = public.get_tenant_id());
CREATE POLICY clinic_rooms_insert_tenant ON public.clinic_rooms
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY clinic_rooms_update_tenant ON public.clinic_rooms
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY clinic_rooms_delete_tenant ON public.clinic_rooms
  FOR DELETE TO authenticated USING (tenant_id = public.get_tenant_id());

CREATE POLICY staff_profiles_select_tenant ON public.staff_profiles
  FOR SELECT TO authenticated USING (tenant_id = public.get_tenant_id());
CREATE POLICY staff_profiles_insert_tenant ON public.staff_profiles
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY staff_profiles_update_tenant ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY staff_profiles_delete_tenant ON public.staff_profiles
  FOR DELETE TO authenticated USING (tenant_id = public.get_tenant_id());

CREATE POLICY appointment_invoices_select_tenant ON public.appointment_invoices
  FOR SELECT TO authenticated USING (tenant_id = public.get_tenant_id());
CREATE POLICY appointment_invoices_insert_tenant ON public.appointment_invoices
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY appointment_invoices_update_tenant ON public.appointment_invoices
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY appointment_invoices_delete_tenant ON public.appointment_invoices
  FOR DELETE TO authenticated USING (tenant_id = public.get_tenant_id());

CREATE POLICY operational_tasks_select_tenant ON public.operational_tasks
  FOR SELECT TO authenticated USING (tenant_id = public.get_tenant_id());
CREATE POLICY operational_tasks_insert_tenant ON public.operational_tasks
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY operational_tasks_update_tenant ON public.operational_tasks
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY operational_tasks_delete_tenant ON public.operational_tasks
  FOR DELETE TO authenticated USING (tenant_id = public.get_tenant_id());

-- ---------------------------------------------------------------------------
-- Realtime (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'staff_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'operational_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointment_invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_invoices;
  END IF;
END $$;
