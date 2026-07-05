-- =============================================================================
-- Nawa — Add in_session status for vertical smart queue state machine
-- Migration: 007_in_session_status.sql
-- =============================================================================

ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'in_session' AFTER 'checked_in';
