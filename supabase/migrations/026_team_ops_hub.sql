-- =============================================================================
-- Nawa — Team Operations Hub extensions on staff_profiles
-- Migration: 026_team_ops_hub.sql
-- =============================================================================

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS leave_until timestamptz,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3, 2);

COMMENT ON COLUMN public.staff_profiles.department IS 'Optional department label for Team Ops Hub.';
COMMENT ON COLUMN public.staff_profiles.phone IS 'Optional contact phone for quick call actions.';
COMMENT ON COLUMN public.staff_profiles.leave_until IS 'When set in the future, member shows as on leave.';
COMMENT ON COLUMN public.staff_profiles.rating_avg IS 'Optional patient satisfaction average 0–5.';

CREATE INDEX IF NOT EXISTS idx_staff_profiles_tenant_role
  ON public.staff_profiles USING btree (tenant_id, role);
