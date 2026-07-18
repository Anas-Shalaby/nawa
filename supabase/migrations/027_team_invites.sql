-- =============================================================================
-- Nawa — Team invites, login link, suspend
-- Migration: 027_team_invites.sql
-- =============================================================================

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.staff_profiles.email IS 'Login email when the member has Auth access.';
COMMENT ON COLUMN public.staff_profiles.is_suspended IS 'When true, member cannot operate; Auth user may be banned.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_tenant_email
  ON public.staff_profiles (tenant_id, lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.staff_invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  staff_profile_id  uuid REFERENCES public.staff_profiles (id) ON DELETE SET NULL,
  email             text NOT NULL,
  display_name      text NOT NULL,
  role              text NOT NULL DEFAULT 'receptionist',
  department        text,
  invited_by        uuid,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.staff_invites IS 'Audit trail for clinic staff login invites.';

CREATE INDEX IF NOT EXISTS idx_staff_invites_tenant
  ON public.staff_invites USING btree (tenant_id, created_at DESC);

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_invites' AND policyname = 'staff_invites_select_tenant'
  ) THEN
    CREATE POLICY staff_invites_select_tenant
      ON public.staff_invites FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_invites' AND policyname = 'staff_invites_insert_tenant'
  ) THEN
    CREATE POLICY staff_invites_insert_tenant
      ON public.staff_invites FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_invites' AND policyname = 'staff_invites_update_tenant'
  ) THEN
    CREATE POLICY staff_invites_update_tenant
      ON public.staff_invites FOR UPDATE
      USING (tenant_id = public.get_tenant_id());
  END IF;
END $$;
