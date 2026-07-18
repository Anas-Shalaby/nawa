-- =============================================================================
-- Nawa — Clinic roles & permission overrides
-- Migration: 030_clinic_roles.sql
-- Custom roles + per-membership grant/deny overlays.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  key         text NOT NULL,
  label       text NOT NULL,
  is_system   boolean NOT NULL DEFAULT false,
  based_on    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinic_roles_tenant_key_unique UNIQUE (tenant_id, key)
);

COMMENT ON TABLE public.clinic_roles IS
  'Per-clinic role definitions. System roles may be virtual (code defaults) or materialized rows.';

CREATE TABLE IF NOT EXISTS public.clinic_role_permissions (
  role_id     uuid NOT NULL REFERENCES public.clinic_roles (id) ON DELETE CASCADE,
  permission  text NOT NULL,
  PRIMARY KEY (role_id, permission)
);

COMMENT ON TABLE public.clinic_role_permissions IS
  'Permission keys granted to a clinic_roles row.';

ALTER TABLE public.clinic_memberships
  ADD COLUMN IF NOT EXISTS permission_overrides jsonb,
  ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.clinic_roles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_roles_tenant
  ON public.clinic_roles USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_custom_role
  ON public.clinic_memberships USING btree (custom_role_id)
  WHERE custom_role_id IS NOT NULL;

ALTER TABLE public.clinic_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_role_permissions FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_roles' AND policyname = 'clinic_roles_select_tenant'
  ) THEN
    CREATE POLICY clinic_roles_select_tenant
      ON public.clinic_roles FOR SELECT
      USING (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_roles' AND policyname = 'clinic_roles_insert_tenant'
  ) THEN
    CREATE POLICY clinic_roles_insert_tenant
      ON public.clinic_roles FOR INSERT
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_roles' AND policyname = 'clinic_roles_update_tenant'
  ) THEN
    CREATE POLICY clinic_roles_update_tenant
      ON public.clinic_roles FOR UPDATE
      USING (tenant_id = public.get_tenant_id())
      WITH CHECK (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_roles' AND policyname = 'clinic_roles_delete_tenant'
  ) THEN
    CREATE POLICY clinic_roles_delete_tenant
      ON public.clinic_roles FOR DELETE
      USING (tenant_id = public.get_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_role_permissions' AND policyname = 'clinic_role_permissions_select_tenant'
  ) THEN
    CREATE POLICY clinic_role_permissions_select_tenant
      ON public.clinic_role_permissions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.clinic_roles r
          WHERE r.id = role_id AND r.tenant_id = public.get_tenant_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_role_permissions' AND policyname = 'clinic_role_permissions_insert_tenant'
  ) THEN
    CREATE POLICY clinic_role_permissions_insert_tenant
      ON public.clinic_role_permissions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.clinic_roles r
          WHERE r.id = role_id AND r.tenant_id = public.get_tenant_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_role_permissions' AND policyname = 'clinic_role_permissions_delete_tenant'
  ) THEN
    CREATE POLICY clinic_role_permissions_delete_tenant
      ON public.clinic_role_permissions FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.clinic_roles r
          WHERE r.id = role_id AND r.tenant_id = public.get_tenant_id()
        )
      );
  END IF;
END $$;
