-- =============================================================================
-- Nawa — Re-examination / follow-up appointment flag
-- Migration: 012_is_re_examination.sql
-- =============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS is_re_examination boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.appointments.is_re_examination IS
  'True when booked as إعادة كشف (complimentary or reduced follow-up visit).';
