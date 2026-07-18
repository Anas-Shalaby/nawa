-- =============================================================================
-- Nawa — Multi-clinic membership access (switcher)
-- Migration: 029_multi_clinic_membership_access.sql
-- Allow users to read their own memberships + tenant names across clinics.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinic_memberships'
      AND policyname = 'clinic_memberships_select_own'
  ) THEN
    CREATE POLICY clinic_memberships_select_own
      ON public.clinic_memberships FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenants'
      AND policyname = 'tenants_select_via_membership'
  ) THEN
    CREATE POLICY tenants_select_via_membership
      ON public.tenants FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.clinic_memberships m
          WHERE m.tenant_id = tenants.id
            AND m.user_id = auth.uid()
            AND m.status = 'active'
        )
      );
  END IF;
END $$;
