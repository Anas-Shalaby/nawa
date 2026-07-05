-- =============================================================================
-- Nawa — Visual EHR: patient_media table + clinic_ehr storage policies
-- Migration: 009_patient_media_ehr.sql
-- =============================================================================

CREATE TYPE public.patient_media_tag AS ENUM (
  'before',
  'after',
  'x-ray',
  'general'
);

CREATE TABLE public.patient_media (
  id          uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid                   NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  patient_id  uuid                   NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  file_path   text                   NOT NULL,
  tag         public.patient_media_tag NOT NULL DEFAULT 'general',
  notes       text,
  created_at  timestamptz            NOT NULL DEFAULT now(),

  CONSTRAINT patient_media_file_path_unique UNIQUE (tenant_id, file_path)
);

COMMENT ON TABLE public.patient_media IS
  'Before/after and clinical images per patient (Visual EHR).';

CREATE INDEX idx_patient_media_tenant_id
  ON public.patient_media USING btree (tenant_id);

CREATE INDEX idx_patient_media_patient_id
  ON public.patient_media USING btree (patient_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: patient_media
-- ---------------------------------------------------------------------------
ALTER TABLE public.patient_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_media FORCE ROW LEVEL SECURITY;

CREATE POLICY patient_media_select_tenant
  ON public.patient_media
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY patient_media_insert_tenant
  ON public.patient_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_id
        AND p.tenant_id = public.get_tenant_id()
    )
  );

CREATE POLICY patient_media_delete_tenant
  ON public.patient_media
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- ---------------------------------------------------------------------------
-- Storage bucket: clinic_ehr (private)
-- Path convention: {tenant_id}/{patient_id}/{filename}
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic_ehr',
  'clinic_ehr',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY clinic_ehr_select_tenant
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'clinic_ehr'
    AND (storage.foldername(name))[1] = public.get_tenant_id()::text
  );

CREATE POLICY clinic_ehr_insert_tenant
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinic_ehr'
    AND (storage.foldername(name))[1] = public.get_tenant_id()::text
    AND (storage.foldername(name))[2] IS NOT NULL
  );

CREATE POLICY clinic_ehr_delete_tenant
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clinic_ehr'
    AND (storage.foldername(name))[1] = public.get_tenant_id()::text
  );
