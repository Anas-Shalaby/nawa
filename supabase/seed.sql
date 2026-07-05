-- Demo seed for local development (run after 001_initial_schema.sql)
-- Set MOCK_TENANT_ID in .env.local to the tenant UUID below.

INSERT INTO public.tenants (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nova Dental Clinic',
  'nova-dental'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (tenant_id, name, duration_minutes, price_egp, pre_visit_instructions)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Consultation',
    30,
    500,
    'Please arrive 10 minutes early.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Follow-up',
    20,
    300,
    'Bring previous prescription if available.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Teeth Cleaning',
    45,
    800,
    'Avoid eating 30 minutes before your appointment.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.patients (tenant_id, name, phone_number, no_show_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ahmed Hassan', '01001234567', 0),
  ('00000000-0000-0000-0000-000000000001', 'Banned Patient', '01999999999', 2)
ON CONFLICT (tenant_id, phone_number) DO NOTHING;

-- Staff user: prefer Admin API (fixes GoTrue login):
--   npm run seed:dev-user
-- Or run this SQL after creating public.profiles (see top of file).
