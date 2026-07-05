-- =============================================================================
-- Nawa — Clinic suspension flag for Super Admin
-- Migration: 013_tenant_is_active.sql
-- =============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tenants.is_active IS
  'When false, clinic staff login and public booking are blocked.';
