-- Public clinic contact details used by booking and discipline flows.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS clinic_phone text,
  ADD COLUMN IF NOT EXISTS clinic_location text,
  ADD COLUMN IF NOT EXISTS clinic_latitude double precision,
  ADD COLUMN IF NOT EXISTS clinic_longitude double precision;

COMMENT ON COLUMN public.tenants.clinic_phone IS
  'Clinic public phone number. Used when a soft-banned patient must contact reception.';
COMMENT ON COLUMN public.tenants.clinic_location IS
  'Clinic public address or map location shown on the booking portal.';
COMMENT ON COLUMN public.tenants.clinic_latitude IS
  'Clinic latitude captured from browser geolocation.';
COMMENT ON COLUMN public.tenants.clinic_longitude IS
  'Clinic longitude captured from browser geolocation.';

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_clinic_coordinates_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_clinic_coordinates_check CHECK (
    (clinic_latitude IS NULL AND clinic_longitude IS NULL)
    OR (
      clinic_latitude BETWEEN -90 AND 90
      AND clinic_longitude BETWEEN -180 AND 180
    )
  );
