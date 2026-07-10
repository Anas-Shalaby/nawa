-- Doctor / clinic public identity for patient booking portal
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS cover_url text;

COMMENT ON COLUMN public.tenants.doctor_name IS 'Public doctor display name on booking portal';
COMMENT ON COLUMN public.tenants.specialty IS 'Public specialty shown on booking portal';
COMMENT ON COLUMN public.tenants.bio IS 'Public professional bio';
COMMENT ON COLUMN public.tenants.credentials IS 'JSON array of credential badge strings';
COMMENT ON COLUMN public.tenants.avatar_url IS 'Public doctor avatar image URL';
COMMENT ON COLUMN public.tenants.cover_url IS 'Public clinic cover image URL';

-- Public branding assets (avatars / covers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-branding',
  'clinic-branding',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY clinic_branding_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clinic-branding');

CREATE POLICY clinic_branding_auth_upload
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'clinic-branding');

CREATE POLICY clinic_branding_auth_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'clinic-branding')
  WITH CHECK (bucket_id = 'clinic-branding');

CREATE POLICY clinic_branding_auth_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'clinic-branding');
