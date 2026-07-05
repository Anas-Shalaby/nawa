-- =============================================================================
-- Nawa — Session doctor notes on appointments
-- Migration: 011_doctor_notes.sql
-- =============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_notes text;

COMMENT ON COLUMN public.appointments.doctor_notes IS
  'Clinic instructions for this visit (e.g. bring X-rays). Used on follow-up bookings.';
