-- Fix profiles table + RLS for handle_new_user() trigger (common Supabase template)
-- Run if auth returns "Database error querying schema" or "Database error finding users"

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'عضو جديد'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_service ON public.profiles;

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow auth trigger (supabase_auth_admin) to insert profile rows on signup
DROP POLICY IF EXISTS profiles_insert_auth_admin ON public.profiles;

CREATE POLICY profiles_insert_auth_admin
  ON public.profiles FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

CREATE POLICY profiles_insert_service
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
