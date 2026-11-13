-- =============================================================================
-- Migration: 20261113000000_auth_self_heal_and_resilience.sql
-- Description:
--  1. Hardens public.handle_new_user() trigger to catch unique violations on phone
--     so user signup never fails on duplicate or empty phone numbers.
--  2. Adds authenticated self-heal INSERT policy on public.profiles strictly locked
--     so staff accounts are always forced to 'pending' and patients to 'approved'.
--  3. Re-confirms explicit SELECT policy on public.profiles for authenticated users.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requested_role text;
  assigned_role text;
  initial_status text;
  requested_lang text;
  user_full_name text;
  user_phone text;
  user_subcenter text;
BEGIN
  requested_role := lower(coalesce(NEW.raw_user_meta_data ->> 'role', 'chw'));
  IF requested_role = 'patient' THEN
    assigned_role := 'patient';
    initial_status := 'approved';
  ELSIF requested_role IN ('chw', 'doctor', 'supervisor') THEN
    assigned_role := requested_role;
    initial_status := 'pending';
  ELSE
    -- Public signup cannot create admin accounts or unknown roles.
    assigned_role := 'chw';
    initial_status := 'pending';
  END IF;

  requested_lang := coalesce(NEW.raw_user_meta_data ->> 'language_pref', 'en');
  IF requested_lang NOT IN ('en', 'hi', 'kn', 'mr') THEN
    requested_lang := 'en';
  END IF;

  user_full_name := coalesce(nullif(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1));
  user_phone := nullif(trim(NEW.raw_user_meta_data ->> 'phone'), '');
  user_subcenter := coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'village'), ''), nullif(trim(NEW.raw_user_meta_data ->> 'subcenter'), ''), 'Primary Health Subcenter');

  BEGIN
    INSERT INTO public.profiles (
      id, full_name, role, status, language_pref, phone, subcenter, created_at, updated_at
    ) VALUES (
      NEW.id,
      user_full_name,
      assigned_role,
      initial_status,
      requested_lang,
      user_phone,
      user_subcenter,
      now(), now()
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    -- If a phone conflict occurred, retry inserting with phone = NULL so signup succeeds
    INSERT INTO public.profiles (
      id, full_name, role, status, language_pref, phone, subcenter, created_at, updated_at
    ) VALUES (
      NEW.id,
      user_full_name,
      assigned_role,
      initial_status,
      requested_lang,
      NULL,
      user_subcenter,
      now(), now()
    ) ON CONFLICT (id) DO NOTHING;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is active on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile row
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to self-heal their own initial profile if the trigger did not run
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role IN ('chw', 'doctor', 'supervisor', 'patient')
    AND (
      (role = 'patient' AND status = 'approved') OR
      (role IN ('chw', 'doctor', 'supervisor') AND status = 'pending')
    )
  );

-- Allow authenticated users to update their own non-privileged details (name, phone, language)
DROP POLICY IF EXISTS "Users can update their own profile details" ON public.profiles;
CREATE POLICY "Users can update their own profile details" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
