-- Phase 2: multi-session packages and calendar color tags.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_package boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sessions_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS color_code varchar(7);

UPDATE public.services
SET
  is_package = COALESCE(is_package, false),
  sessions_count = GREATEST(COALESCE(sessions_count, 1), 1)
WHERE is_package IS NULL
   OR sessions_count IS NULL
   OR sessions_count < 1;

ALTER TABLE public.services
  ALTER COLUMN is_package SET DEFAULT false,
  ALTER COLUMN is_package SET NOT NULL,
  ALTER COLUMN sessions_count SET DEFAULT 1,
  ALTER COLUMN sessions_count SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.services'::regclass
      AND conname = 'services_sessions_count_positive'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_sessions_count_positive
      CHECK (sessions_count >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.services'::regclass
      AND conname = 'services_color_code_hex'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_color_code_hex
      CHECK (
        color_code IS NULL
        OR color_code ~ '^#[0-9A-Fa-f]{6}$'
      );
  END IF;
END
$$;

COMMENT ON COLUMN public.services.is_package IS
  'True when the catalog item represents a multi-session package.';
COMMENT ON COLUMN public.services.sessions_count IS
  'Number of sessions included; normalized to 1 for single services.';
COMMENT ON COLUMN public.services.color_code IS
  'Optional #RRGGBB tag used in calendar and queue UI.';
