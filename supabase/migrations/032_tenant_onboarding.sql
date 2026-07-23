-- Migration 032: Add onboarding status to tenants

ALTER TABLE public.tenants 
ADD COLUMN is_onboarded boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tenants.is_onboarded IS 'Indicates if the clinic has completed the initial guided onboarding flow.';
