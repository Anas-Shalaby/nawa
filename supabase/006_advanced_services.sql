-- =============================================================================
-- Advanced service modeling: price + pre-visit instructions
-- Run in Supabase SQL Editor after 001–005
-- =============================================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_egp integer
    CHECK (price_egp IS NULL OR price_egp >= 0);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS pre_visit_instructions text;

COMMENT ON COLUMN public.services.price_egp IS 'Optional price in Egyptian pounds.';
COMMENT ON COLUMN public.services.pre_visit_instructions IS 'Shown to patients before booking.';
