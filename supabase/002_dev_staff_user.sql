-- =============================================================================
-- Nawa — Create dev staff Auth user via SQL
-- Run in Supabase Dashboard → SQL Editor (after 001_initial_schema.sql + seed.sql)
--
-- Default credentials (change before production):
--   Email:    secretary@clinic.example
--   Password: NawaDev2026!
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Required by existing Supabase trigger: handle_new_user() → public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'عضو جديد'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_user_id   uuid := gen_random_uuid();
  v_email     text := 'secretary@clinic.example';
  v_password  text := 'NawaDev2026!';
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE NOTICE 'User % already exists — updating tenant_id only.', v_email;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('tenant_id', v_tenant_id::text)
    WHERE email = v_email;

    RETURN;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'tenant_id', v_tenant_id::text
    ),
    -- Trigger handle_new_user() reads display_name (not full_name)
    jsonb_build_object('display_name', 'Clinic Secretary'),
    false,
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'Created staff user: % (id: %)', v_email, v_user_id;
END $$;

-- Verify auth user + profile row
SELECT u.id, u.email, u.raw_app_meta_data, p.display_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'secretary@clinic.example';
