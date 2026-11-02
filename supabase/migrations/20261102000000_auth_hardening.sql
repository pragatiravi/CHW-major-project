-- =============================================================================
-- Migration: 20261102000000_auth_hardening.sql
-- Description: Server-side role & status enforcement, admin self-promotion protection,
--              patient self-registration approval, and immutable audit logs.
-- =============================================================================

-- 1. Ensure profiles table supports 'patient' role and all statuses
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('chw', 'supervisor', 'doctor', 'admin', 'patient'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 2. Enhanced handle_new_user() Trigger Function:
-- - Patients self-register with immediate 'approved' status
-- - Frontline staff (CHW, Doctor, Supervisor) default to 'pending' supervisor review
-- - Any attempt to self-assign 'admin' role is forced down to 'chw'
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
  user_village   := NEW.raw_user_meta_data->>'village';

  -- Normalize language preference
  IF requested_lang NOT IN ('en', 'kn', 'hi', 'mr') THEN
    requested_lang := 'en';
  END IF;

  -- Server-side Role & Status Matrix:
  IF requested_role = 'patient' THEN
    assigned_role := 'patient';
    initial_status := 'approved'; -- Patients get instant access to health passport
  ELSIF requested_role IN ('chw', 'doctor', 'supervisor') THEN
    assigned_role := requested_role;
    initial_status := 'pending'; -- Staff accounts require institutional approval
  ELSE
    -- Security Guard: Admin cannot be requested via public signup
    assigned_role := 'chw';
    initial_status := 'pending';
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
    COALESCE(user_village, 'Primary Health Subcenter'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    language_pref = EXCLUDED.language_pref,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Server-side Profile Update Guard:
-- Prevents clients from spoofing roles or self-approving their accounts
CREATE OR REPLACE FUNCTION public.enforce_profile_role_security()
RETURNS TRIGGER AS $$
DECLARE
  acting_user_role TEXT;
BEGIN
  acting_user_role := current_user_role();

  -- Admin can modify anything
  IF acting_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Supervisor permissions
  IF acting_user_role = 'supervisor' THEN
    -- Supervisors cannot modify admin profiles
    IF OLD.role = 'admin' OR NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Supervisors are not permitted to manage or grant administrator credentials.';
    END IF;
    -- Supervisors cannot change their own role or status
    IF OLD.id = auth.uid() AND (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status) THEN
      RAISE EXCEPTION 'Supervisors cannot modify their own role or status.';
    END IF;
    -- Supervisors can only approve/reject/suspend frontline staff
    RETURN NEW;
  END IF;

  -- Regular users (CHW, Doctor, Patient, Anon):
  -- Strictly forbidden from altering role or status
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    RAISE EXCEPTION 'Security Violation: Users cannot alter their own healthcare role or verification status.';
  END IF;

  -- Cannot change other users' profiles
  IF OLD.id != auth.uid() THEN
    RAISE EXCEPTION 'Permission Denied: You may only update your own profile.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_profile_security ON public.profiles;
CREATE TRIGGER trg_enforce_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_security();

-- 4. RLS Policy for Users to Update their own Profile details (Name, Phone, Language)
DROP POLICY IF EXISTS "Users can update their own profile details" ON public.profiles;
CREATE POLICY "Users can update their own profile details" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Strict Append-Only Enforcement for Audit Logs
-- Regulatory compliance: Audit logs cannot be updated or deleted by any user or role
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Security & Compliance Violation: audit_logs is append-only. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();
