-- Allow HEIF (some iPhones) in clinic_ehr bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]
WHERE id = 'clinic_ehr';
