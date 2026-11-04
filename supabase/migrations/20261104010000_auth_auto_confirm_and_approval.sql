-- =============================================================================
-- Migration: 20261104010000_auth_auto_confirm_and_approval.sql
-- Description: Auto-confirm user emails in auth.users and approve registered roles
--              so new registrations can immediately sign in.
-- =============================================================================

-- 1. Trigger to automatically confirm emails upon user creation in auth.users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_confirm_new_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- 2. Update handle_new_user trigger to approve frontline staff and patients
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  assigned_role TEXT;
  initial_status TEXT;
  requested_lang TEXT;
  user_full_name TEXT;
  user_phone TEXT;
  user_village TEXT;
BEGIN
  -- Extract metadata safely
  requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'chw'));
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  requested_lang := COALESCE(NEW.raw_user_meta_data->>'language_pref', 'en');
  user_phone     := NEW.raw_user_meta_data->>'phone';
  user_village   := COALESCE(NEW.raw_user_meta_data->>'village', NEW.raw_user_meta_data->>'subcenter', 'Primary Health Subcenter');

  -- Normalize language preference
  IF requested_lang NOT IN ('en', 'kn', 'hi', 'mr') THEN
    requested_lang := 'en';
  END IF;

  -- Server-side Role Matrix:
  IF requested_role IN ('chw', 'doctor', 'supervisor', 'patient') THEN
    assigned_role := requested_role;
    initial_status := 'approved';
  ELSE
    -- Security Guard: Admin cannot be requested via public signup
    assigned_role := 'chw';
    initial_status := 'approved';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    status,
    language_pref,
    phone,
    subcenter,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_full_name,
    assigned_role,
    initial_status,
    requested_lang,
    user_phone,
    user_village,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    language_pref = EXCLUDED.language_pref,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any existing unconfirmed auth users
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. Backfill any existing pending profiles to approved
UPDATE public.profiles
SET status = 'approved'
WHERE status = 'pending';

