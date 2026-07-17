-- =============================================================================
-- Nawa — Family & Dependents Accounts
-- Migration: 023_family_accounts.sql
-- Allows multiple patient rows (dependents) to share one contact phone under a
-- master account via parent_id.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Hierarchy columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS parent_id uuid
    REFERENCES public.patients (id) ON DELETE SET NULL;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS relationship_type varchar(50);

COMMENT ON COLUMN public.patients.parent_id IS
  'Master patient for this dependent. NULL means this row is a master account.';
COMMENT ON COLUMN public.patients.relationship_type IS
  'Relationship to the master patient (child, spouse, sibling, parent, other).';

-- Prevent a row from referencing itself as parent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patients_parent_not_self'
      AND conrelid = 'public.patients'::regclass
  ) THEN
    ALTER TABLE public.patients
      ADD CONSTRAINT patients_parent_not_self
      CHECK (parent_id IS DISTINCT FROM id);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. CRITICAL: drop UNIQUE (tenant_id, phone_number)
-- Masters and dependents may share the exact same phone number.
-- Patient identity remains the primary key `id`.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  -- Named table constraints (e.g. patients_tenant_phone_unique from 001)
  FOR rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'patients'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%phone_number%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS %I',
      rec.conname
    );
  END LOOP;

  -- Unique indexes that are not backed by a table constraint
  FOR rec IN
    SELECT i.relname AS index_name
    FROM pg_index x
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'patients'
      AND x.indisunique = true
      AND x.indisprimary = false
      AND pg_get_indexdef(x.indexrelid) ILIKE '%phone_number%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', rec.index_name);
  END LOOP;
END
$$;

-- Non-unique lookup index so booking / CRM phone search stays fast after
-- uniqueness is removed.
CREATE INDEX IF NOT EXISTS idx_patients_tenant_phone_number
  ON public.patients USING btree (tenant_id, phone_number);

-- ---------------------------------------------------------------------------
-- 3. Family-tree fetch index
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_parent_id
  ON public.patients USING btree (parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_tenant_parent_id
  ON public.patients USING btree (tenant_id, parent_id)
  WHERE parent_id IS NOT NULL;

COMMIT;
