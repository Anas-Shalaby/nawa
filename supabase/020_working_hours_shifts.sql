-- Split shifts support for weekly clinic availability
ALTER TABLE public.working_hours
  ADD COLUMN IF NOT EXISTS shifts jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.working_hours.shifts IS
  'JSON array of {start,end} time windows (HH:mm). Enables morning/evening split shifts.';

-- Backfill shifts from legacy start_time/end_time
UPDATE public.working_hours
SET shifts = jsonb_build_array(
  jsonb_build_object(
    'start', to_char(start_time, 'HH24:MI'),
    'end', to_char(end_time, 'HH24:MI')
  )
)
WHERE is_open = true
  AND start_time IS NOT NULL
  AND end_time IS NOT NULL
  AND (shifts = '[]'::jsonb OR shifts IS NULL);

-- Relax CHECK so open days can rely on shifts JSON (legacy columns still filled on save)
ALTER TABLE public.working_hours
  DROP CONSTRAINT IF EXISTS working_hours_times_check;

ALTER TABLE public.working_hours
  ADD CONSTRAINT working_hours_times_check CHECK (
    (is_open = false)
    OR (
      is_open = true
      AND (
        (
          start_time IS NOT NULL
          AND end_time IS NOT NULL
          AND start_time < end_time
        )
        OR jsonb_array_length(shifts) > 0
      )
    )
  );
