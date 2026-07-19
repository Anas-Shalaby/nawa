-- =============================================================================
-- Nawah — Structured prescriptions
-- Migration: 031_prescriptions.sql
-- prescriptions + lines + clinic templates + medicine favorites + chronic meds
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  patient_id         uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  created_by         uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  doctor_name        text NOT NULL DEFAULT '',
  clinic_name        text NOT NULL DEFAULT '',
  specialty          text NOT NULL DEFAULT '',
  status             text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'void')),
  general_notes      text,
  public_token       uuid NOT NULL DEFAULT gen_random_uuid(),
  duplicated_from_id uuid REFERENCES public.prescriptions (id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prescriptions_public_token_unique UNIQUE (public_token)
);

COMMENT ON TABLE public.prescriptions IS
  'Structured e-prescriptions per patient. Replaces free-text append to patients.notes.';

CREATE TABLE IF NOT EXISTS public.prescription_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions (id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  sort_order      integer NOT NULL DEFAULT 0,
  medicine_name   text NOT NULL,
  dose_amount     text NOT NULL DEFAULT '1',
  form            text NOT NULL DEFAULT 'قرص',
  frequency       text NOT NULL DEFAULT '',
  duration        text NOT NULL DEFAULT '',
  notes           text NOT NULL DEFAULT '',
  is_chronic      boolean NOT NULL DEFAULT false,
  is_custom       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prescription_lines IS
  'Ordered medicine lines for a prescription.';

CREATE TABLE IF NOT EXISTS public.prescription_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  created_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prescription_templates IS
  'Clinic-saved prescription templates (doctor packs).';

CREATE TABLE IF NOT EXISTS public.prescription_template_lines (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  uuid NOT NULL REFERENCES public.prescription_templates (id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  medicine_name text NOT NULL,
  dose_amount  text NOT NULL DEFAULT '1',
  form         text NOT NULL DEFAULT 'قرص',
  frequency    text NOT NULL DEFAULT '',
  duration     text NOT NULL DEFAULT '',
  notes        text NOT NULL DEFAULT '',
  is_chronic   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.medicine_favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dose_amount   text NOT NULL DEFAULT '1',
  form          text NOT NULL DEFAULT 'قرص',
  frequency     text NOT NULL DEFAULT '',
  duration      text NOT NULL DEFAULT '',
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medicine_favorites_unique UNIQUE (tenant_id, user_id, medicine_name)
);

COMMENT ON TABLE public.medicine_favorites IS
  'Per-user favorite medicines with default dosage recipe.';

CREATE TABLE IF NOT EXISTS public.patient_chronic_medications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  patient_id    uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dose_amount   text NOT NULL DEFAULT '1',
  form          text NOT NULL DEFAULT 'قرص',
  frequency     text NOT NULL DEFAULT '',
  duration      text NOT NULL DEFAULT '',
  notes         text NOT NULL DEFAULT '',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_chronic_meds_unique UNIQUE (tenant_id, patient_id, medicine_name)
);

COMMENT ON TABLE public.patient_chronic_medications IS
  'Sticky chronic medications for a patient, reusable in new prescriptions.';

CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_patient
  ON public.prescriptions USING btree (tenant_id, patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescription_lines_rx
  ON public.prescription_lines USING btree (prescription_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_prescription_templates_tenant
  ON public.prescription_templates USING btree (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medicine_favorites_user
  ON public.medicine_favorites USING btree (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_patient_chronic_patient
  ON public.patient_chronic_medications USING btree (tenant_id, patient_id)
  WHERE is_active = true;

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_template_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_favorites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.patient_chronic_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_chronic_medications FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- prescriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_select_tenant') THEN
    CREATE POLICY prescriptions_select_tenant ON public.prescriptions FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_insert_tenant') THEN
    CREATE POLICY prescriptions_insert_tenant ON public.prescriptions FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_update_tenant') THEN
    CREATE POLICY prescriptions_update_tenant ON public.prescriptions FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_delete_tenant') THEN
    CREATE POLICY prescriptions_delete_tenant ON public.prescriptions FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;

  -- prescription_lines
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_lines' AND policyname = 'prescription_lines_select_tenant') THEN
    CREATE POLICY prescription_lines_select_tenant ON public.prescription_lines FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_lines' AND policyname = 'prescription_lines_insert_tenant') THEN
    CREATE POLICY prescription_lines_insert_tenant ON public.prescription_lines FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_lines' AND policyname = 'prescription_lines_update_tenant') THEN
    CREATE POLICY prescription_lines_update_tenant ON public.prescription_lines FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_lines' AND policyname = 'prescription_lines_delete_tenant') THEN
    CREATE POLICY prescription_lines_delete_tenant ON public.prescription_lines FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;

  -- templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_templates' AND policyname = 'prescription_templates_select_tenant') THEN
    CREATE POLICY prescription_templates_select_tenant ON public.prescription_templates FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_templates' AND policyname = 'prescription_templates_insert_tenant') THEN
    CREATE POLICY prescription_templates_insert_tenant ON public.prescription_templates FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_templates' AND policyname = 'prescription_templates_update_tenant') THEN
    CREATE POLICY prescription_templates_update_tenant ON public.prescription_templates FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_templates' AND policyname = 'prescription_templates_delete_tenant') THEN
    CREATE POLICY prescription_templates_delete_tenant ON public.prescription_templates FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;

  -- template lines
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_template_lines' AND policyname = 'prescription_template_lines_select_tenant') THEN
    CREATE POLICY prescription_template_lines_select_tenant ON public.prescription_template_lines FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_template_lines' AND policyname = 'prescription_template_lines_insert_tenant') THEN
    CREATE POLICY prescription_template_lines_insert_tenant ON public.prescription_template_lines FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_template_lines' AND policyname = 'prescription_template_lines_update_tenant') THEN
    CREATE POLICY prescription_template_lines_update_tenant ON public.prescription_template_lines FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescription_template_lines' AND policyname = 'prescription_template_lines_delete_tenant') THEN
    CREATE POLICY prescription_template_lines_delete_tenant ON public.prescription_template_lines FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;

  -- favorites (own rows only within tenant)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicine_favorites' AND policyname = 'medicine_favorites_select_own') THEN
    CREATE POLICY medicine_favorites_select_own ON public.medicine_favorites FOR SELECT
      USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicine_favorites' AND policyname = 'medicine_favorites_insert_own') THEN
    CREATE POLICY medicine_favorites_insert_own ON public.medicine_favorites FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id() AND user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicine_favorites' AND policyname = 'medicine_favorites_update_own') THEN
    CREATE POLICY medicine_favorites_update_own ON public.medicine_favorites FOR UPDATE
      USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid())
      WITH CHECK (tenant_id = public.get_tenant_id() AND user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicine_favorites' AND policyname = 'medicine_favorites_delete_own') THEN
    CREATE POLICY medicine_favorites_delete_own ON public.medicine_favorites FOR DELETE
      USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid());
  END IF;

  -- chronic meds
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_chronic_medications' AND policyname = 'patient_chronic_select_tenant') THEN
    CREATE POLICY patient_chronic_select_tenant ON public.patient_chronic_medications FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_chronic_medications' AND policyname = 'patient_chronic_insert_tenant') THEN
    CREATE POLICY patient_chronic_insert_tenant ON public.patient_chronic_medications FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_chronic_medications' AND policyname = 'patient_chronic_update_tenant') THEN
    CREATE POLICY patient_chronic_update_tenant ON public.patient_chronic_medications FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_chronic_medications' AND policyname = 'patient_chronic_delete_tenant') THEN
    CREATE POLICY patient_chronic_delete_tenant ON public.patient_chronic_medications FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;
END $$;
