-- =============================================================================
-- Nawa — Clinic memberships (User × Clinic)
-- Migration: 028_clinic_memberships.sql
-- Source of truth for role / access inside a tenant. JWT staff_role is a cache.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_memberships (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id            uuid NOT NULL,
  staff_profile_id   uuid REFERENCES public.staff_profiles (id) ON DELETE SET NULL,
  role               text NOT NULL DEFAULT 'receptionist',
  status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'suspended', 'invited')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinic_memberships_tenant_user_unique UNIQUE (tenant_id, user_id)
);

COMMENT ON TABLE public.clinic_memberships IS
  'Membership of an Auth user in a clinic (tenant). Role/status are the authorization source of truth.';

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user
  ON public.clinic_memberships USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_tenant_status
  ON public.clinic_memberships USING btree (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_staff_profile
  ON public.clinic_memberships USING btree (staff_profile_id)
  WHERE staff_profile_id IS NOT NULL;

-- Backfill from linked staff profiles
INSERT INTO public.clinic_memberships (
  tenant_id,
  user_id,
  staff_profile_id,
  role,
  status
)
SELECT
  sp.tenant_id,
  sp.user_id,
  sp.id,
  COALESCE(NULLIF(trim(sp.role), ''), 'receptionist'),
  CASE WHEN COALESCE(sp.is_suspended, false) THEN 'suspended' ELSE 'active' END
FROM public.staff_profiles sp
WHERE sp.user_id IS NOT NULL
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET
  staff_profile_id = EXCLUDED.staff_profile_id,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

ALTER TABLE public.clinic_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_memberships FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_memberships' AND policyname = 'clinic_memberships_select_tenant'
  ) THEN
    CREATE POLICY clinic_memberships_select_tenant
      ON public.clinic_memberships FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_memberships' AND policyname = 'clinic_memberships_insert_tenant'
  ) THEN
    CREATE POLICY clinic_memberships_insert_tenant
      ON public.clinic_memberships FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_memberships' AND policyname = 'clinic_memberships_update_tenant'
  ) THEN
    CREATE POLICY clinic_memberships_update_tenant
      ON public.clinic_memberships FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_memberships' AND policyname = 'clinic_memberships_delete_tenant'
  ) THEN
    CREATE POLICY clinic_memberships_delete_tenant
      ON public.clinic_memberships FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;
END $$;
