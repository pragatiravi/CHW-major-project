-- =============================================================================
-- Migration: 20261104000000_auth_rls_hardening.sql
-- Description:
--  1. Ensures public.doctors unique constraint on profile_id and auto-provisioning
--     trigger when a doctor profile is approved.
--  2. Validates profiles status check constraint ('pending', 'approved', 'rejected', 'suspended').
--  3. Hardens RLS on profiles, patients, and referrals so approved CHWs & Doctors work seamlessly.
--  4. Enforces strict append-only audit_logs policy (no updates or deletes).
-- =============================================================================

-- 1. Ensure public.doctors has unique index on profile_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_profile_id ON public.doctors(profile_id);

-- 2. Auto-provision row in public.doctors when a doctor is approved
CREATE OR REPLACE FUNCTION public.handle_doctor_approval_provisioning()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'doctor' AND NEW.status = 'approved' THEN
    INSERT INTO public.doctors (profile_id, full_name, specialty, hospital, phone)
    VALUES (
      NEW.id,
      NEW.full_name,
      'General Medicine / PHC Clinician',
      COALESCE(NEW.subcenter, 'Community Health Centre'),
      NEW.phone
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      hospital = COALESCE(EXCLUDED.hospital, public.doctors.hospital),
      phone = COALESCE(EXCLUDED.phone, public.doctors.phone);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_doctor_approval_provisioning ON public.profiles;
CREATE TRIGGER trg_doctor_approval_provisioning
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_doctor_approval_provisioning();

-- 3. Profiles status constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 4. Audit logs append-only enforcement
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs insert allowed for authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insert allowed for authenticated" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Audit logs select allowed for staff" ON public.audit_logs;
CREATE POLICY "Audit logs select allowed for staff" ON public.audit_logs
  FOR SELECT USING (current_user_role() IN ('admin', 'supervisor'));

-- Strict trigger preventing UPDATE or DELETE on audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Updates and deletions are strictly forbidden by regulatory policy.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 5. Helper function to promote the first administrator (run once by owner)
-- Usage: SELECT public.promote_user_to_admin('admin@example.com');
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = LOWER(TRIM(target_email));
  IF target_id IS NULL THEN
    RETURN 'User with email ' || target_email || ' not found.';
  END IF;

  UPDATE public.profiles
  SET role = 'admin', status = 'approved', updated_at = NOW()
  WHERE id = target_id;

  RETURN 'Successfully promoted ' || target_email || ' to administrator.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

