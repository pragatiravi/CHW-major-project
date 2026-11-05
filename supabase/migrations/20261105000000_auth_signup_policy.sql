-- Restore the intended public signup lifecycle. Previous migrations replaced
-- the auth.users trigger with a version that approved every staff account.
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

  INSERT INTO public.profiles (
    id, full_name, role, status, language_pref, phone, subcenter, created_at, updated_at
  ) VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    initial_status,
    requested_lang,
    nullif(NEW.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(NEW.raw_user_meta_data ->> 'village', ''), 'Primary Health Subcenter'),
    now(), now()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Respect the project's Supabase Confirm email setting so verification and
-- resend flows can function. The prior migration force-confirmed every signup.
DROP TRIGGER IF EXISTS trg_auto_confirm_new_user ON auth.users;

-- Pin search paths on legacy SECURITY DEFINER functions before they run.
ALTER FUNCTION public.current_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_profile_role_security() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_doctor_approval_provisioning() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_audit_log_modification() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_confirm_new_user() SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.auto_confirm_new_user() FROM PUBLIC, anon, authenticated;

-- This legacy bootstrap helper must only be callable by the database owner.
-- Supabase client roles must never be able to promote an arbitrary email.
ALTER FUNCTION public.promote_user_to_admin(text) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Run in the Supabase SQL editor to inspect an account and approve a CHW:
-- SELECT id,email,email_confirmed_at,created_at FROM auth.users WHERE email=lower(trim('chw@example.org'));
-- SELECT id,full_name,role,status,subcenter,supervisor_id FROM public.profiles WHERE id=(SELECT id FROM auth.users WHERE email=lower(trim('chw@example.org')));
-- UPDATE public.profiles SET status='approved',subcenter='PHC / Subcenter name',updated_at=now()
-- WHERE id=(SELECT id FROM auth.users WHERE email=lower(trim('chw@example.org')))
--   AND role IN ('chw','doctor','supervisor');
