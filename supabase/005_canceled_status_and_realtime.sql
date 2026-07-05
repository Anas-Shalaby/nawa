-- =============================================================================
-- Add canceled status + enable Realtime on appointments
-- Run in Supabase SQL Editor after 001–004
-- =============================================================================

ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'canceled';

-- Enable Realtime for live Kanban sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
