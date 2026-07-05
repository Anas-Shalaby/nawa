-- =============================================================================
-- Nawa — Patient CRM fields + backfill tracking for ROI analytics
-- Migration: 008_crm_and_backfill_tracking.sql
-- =============================================================================

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.patients.notes IS 'Internal CRM notes visible to clinic staff only.';
COMMENT ON COLUMN public.patients.is_archived IS 'Soft-delete flag; archived patients hidden from default CRM view.';

CREATE INDEX IF NOT EXISTS idx_patients_tenant_archived
  ON public.patients USING btree (tenant_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_warning
  ON public.patients USING btree (tenant_id, no_show_count)
  WHERE is_archived = false;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS replaced_appointment_id uuid
    REFERENCES public.appointments (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.appointments.replaced_appointment_id IS
  'Links a new booking to a previously canceled/no-show slot it backfilled (ROI tracking).';

CREATE INDEX IF NOT EXISTS idx_appointments_replaced
  ON public.appointments USING btree (tenant_id, replaced_appointment_id)
  WHERE replaced_appointment_id IS NOT NULL;
