-- =============================================================================
-- Nawa — Clinic SaaS subscription plans
-- Migration: 017_tenant_subscriptions.sql
-- =============================================================================

CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'expired',
  'cancelled'
);

CREATE TABLE public.subscription_plans (
  id               text        PRIMARY KEY,
  name_ar          text        NOT NULL,
  name_en          text        NOT NULL,
  description_ar   text,
  description_en   text,
  duration_months  integer     NOT NULL CHECK (duration_months > 0),
  price_egp        integer     NOT NULL DEFAULT 0 CHECK (price_egp >= 0),
  setup_fee_egp    integer     NOT NULL DEFAULT 0 CHECK (setup_fee_egp >= 0),
  is_active        boolean     NOT NULL DEFAULT true,
  sort_order       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscription_plans IS
  'Catalog of clinic SaaS plans shown at registration.';

CREATE TABLE public.tenant_subscriptions (
  id         uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid                   NOT NULL UNIQUE REFERENCES public.tenants (id) ON DELETE CASCADE,
  plan_id    text                   NOT NULL REFERENCES public.subscription_plans (id),
  status     public.subscription_status NOT NULL DEFAULT 'active',
  starts_at  timestamptz            NOT NULL DEFAULT now(),
  ends_at    timestamptz            NOT NULL,
  created_at timestamptz            NOT NULL DEFAULT now(),
  updated_at timestamptz            NOT NULL DEFAULT now(),
  CONSTRAINT tenant_subscriptions_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX idx_tenant_subscriptions_plan_id
  ON public.tenant_subscriptions USING btree (plan_id);

CREATE INDEX idx_tenant_subscriptions_ends_at
  ON public.tenant_subscriptions USING btree (ends_at);

COMMENT ON TABLE public.tenant_subscriptions IS
  'Current SaaS subscription per clinic. One active row per tenant.';

CREATE OR REPLACE FUNCTION public.set_tenant_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenant_subscriptions_set_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_subscriptions_updated_at();

INSERT INTO public.subscription_plans (
  id,
  name_ar,
  name_en,
  description_ar,
  description_en,
  duration_months,
  price_egp,
  setup_fee_egp,
  sort_order
) VALUES
  (
    'free_6mo',
    'الخطة المجانية',
    'Free plan',
    '٦ أشهر مجانًا — جرّب نواة بدون أي تكلفة',
    '6 months free — try Nawa at no cost',
    6,
    0,
    0,
    0
  ),
  (
    'paid_6mo',
    'خطة العيادة',
    'Clinic plan',
    'اشتراك نصف سنوي مع تفعيل شخصي للعيادة',
    '6-month subscription with white-glove onboarding',
    6,
    3000,
    500,
    1
  );

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_select_active
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY tenant_subscriptions_select_tenant
  ON public.tenant_subscriptions
  FOR SELECT
  USING (tenant_id = public.get_tenant_id());
