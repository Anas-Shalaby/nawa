-- =============================================================================
-- Nawa — Patient financial ledger & payment history
-- Migration: 010_financial_ledger.sql
-- =============================================================================

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS total_balance_due integer NOT NULL DEFAULT 0
    CHECK (total_balance_due >= 0);

COMMENT ON COLUMN public.patients.total_balance_due IS
  'Outstanding balance in EGP (integer). Updated server-side on payment recording.';

CREATE TABLE public.patient_payments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  patient_id  uuid        NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  amount_paid integer     NOT NULL CHECK (amount_paid > 0),
  paid_at     timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.patient_payments IS 'Ledger of patient installment / balance payments.';

CREATE INDEX idx_patient_payments_tenant_id
  ON public.patient_payments USING btree (tenant_id);

CREATE INDEX idx_patient_payments_patient_id
  ON public.patient_payments USING btree (patient_id, paid_at DESC);

ALTER TABLE public.patient_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY patient_payments_select_tenant
  ON public.patient_payments
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY patient_payments_insert_tenant
  ON public.patient_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.tenant_id = public.get_tenant_id()
    )
  );
