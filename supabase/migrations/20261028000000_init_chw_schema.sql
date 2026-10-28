-- =============================================================================
-- Community Health Worker (CHW) Healthcare Toolkit
-- Supabase / PostgreSQL Schema Migration: Normalized Production Architecture
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to inspect current user role from auth context
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'anon'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- 1. PROFILES (Extends auth.users with healthcare operational attributes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'chw' CHECK (role IN ('chw', 'supervisor', 'doctor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  subcenter TEXT NOT NULL DEFAULT 'Primary Health Subcenter',
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  language_pref TEXT NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'kn', 'hi', 'mr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON public.profiles(supervisor_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- Trigger to automatically create a pending profile upon user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status, language_pref)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'chw',
    'pending',
    COALESCE(NEW.raw_user_meta_data->>'language_pref', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. PATIENTS (Demographics, identification & consent tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_id TEXT UNIQUE NOT NULL, -- e.g., P7204 or national health card identifier
  legacy_id TEXT UNIQUE, -- Explicit legacy mapping to string IDs like P7204
  name TEXT NOT NULL,
  dob DATE,
  age INT NOT NULL CHECK (age >= 0 AND age <= 130),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  village TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  abha_id TEXT UNIQUE, -- Ayushman Bharat Health Account ID (optional)
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_chw UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_chw ON public.patients(assigned_chw);
CREATE INDEX IF NOT EXISTS idx_patients_village ON public.patients(village);

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =============================================================================
-- 3. VISITS (Longitudinal vital encounters; never overwrite historical vitals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chw_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  systolic INT NOT NULL CHECK (systolic >= 40 AND systolic <= 300),
  diastolic INT NOT NULL CHECK (diastolic >= 30 AND diastolic <= 200),
  glucose NUMERIC(5, 2) NOT NULL CHECK (glucose >= 20 AND glucose <= 700),
  glucose_type TEXT NOT NULL DEFAULT 'random' CHECK (glucose_type IN ('fasting', 'random', 'postprandial')),
  weight NUMERIC(4, 1) CHECK (weight > 0 AND weight < 350),
  height NUMERIC(4, 1) CHECK (height > 0 AND height < 260),
  bmi NUMERIC(4, 1),
  heart_rate INT CHECK (heart_rate >= 30 AND heart_rate <= 220),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  family_history BOOLEAN NOT NULL DEFAULT false,
  smoking BOOLEAN NOT NULL DEFAULT false,
  alcohol BOOLEAN NOT NULL DEFAULT false,
  active_lifestyle BOOLEAN NOT NULL DEFAULT true,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Critical')),
  risk_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_chw_id ON public.visits(chw_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_risk_level ON public.visits(risk_level);

CREATE TRIGGER trg_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =============================================================================
-- 4. PREDICTIONS (Algorithmic risk inferences linked to visits)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  probability NUMERIC(5, 2) NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_visit_id ON public.predictions(visit_id);

-- =============================================================================
-- 5. COUNSELLING SESSIONS (ThinkLets structured counselling logs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.counselling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chw_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  thinklet_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  patient_commitment TEXT,
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counselling_patient_id ON public.counselling_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_counselling_thinklet_id ON public.counselling_sessions(thinklet_id);

-- =============================================================================
-- 6. REFERRALS (Emergency and specialist hospital referrals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  referring_chw_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hospital_name TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'priority' CHECK (urgency IN ('routine', 'priority', 'emergency')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Declined', 'Completed')),
  reason TEXT NOT NULL,
  doctor_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_patient_id ON public.referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_hospital ON public.referrals(hospital_name);

CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =============================================================================
-- 7. DOCTORS, MEDICATIONS & PRESCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT 'General Medicine',
  hospital TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name TEXT NOT NULL,
  brand_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('Antihypertensive', 'Antidiabetic', 'Statin', 'Emergency', 'General')),
  standard_dosage TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time_schedule TEXT,
  duration TEXT,
  taken_today BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);

CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =============================================================================
-- 8. FOLLOW-UPS (Automated clinical recall scheduling)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_chw_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Overdue', 'Cancelled')),
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON public.follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON public.follow_ups(due_date);

CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- =============================================================================
-- 9. VACCINATIONS (Rural immunization tracking module)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose_number INT NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  given_date DATE,
  given_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  batch_number TEXT,
  status TEXT NOT NULL DEFAULT 'Due' CHECK (status IN ('Due', 'Completed', 'Overdue', 'Exempted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON public.vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_due_date ON public.vaccinations(due_date);

-- =============================================================================
-- 10. EMERGENCY REPORTS (Critical incident reporting with geolocation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('Hypertensive Crisis', 'Severe Hypoglycemia', 'Myocardial Infarction Suspected', 'Stroke Suspected', 'Maternal Emergency', 'Other')),
  description TEXT NOT NULL,
  location_address TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  ambulance_dispatched BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Dispatched', 'En Route', 'Hospitalized', 'Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON public.emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_created ON public.emergency_reports(created_at DESC);

-- =============================================================================
-- 11. INVENTORY & INVENTORY TRANSACTIONS (Medicine & diagnostic strip stock)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Medication', 'Diagnostic Strip', 'PPE', 'Device', 'First Aid')),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'strips',
  reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  subcenter TEXT NOT NULL DEFAULT 'Central PHC Warehouse',
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Received', 'Issued to CHW', 'Dispensed to Patient', 'Discarded/Expired')),
  quantity INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_item ON public.inventory(item_name);

-- =============================================================================
-- 12. CHAT LOGS (Guidance assistant query logs & safety audit)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'en',
  mode TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online', 'offline')),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  red_flag_detected BOOLEAN NOT NULL DEFAULT false,
  retrieved_topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_red_flag ON public.chat_logs(red_flag_detected);

-- =============================================================================
-- 13. AUDIT LOGS (Immutable security and regulatory audit trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Supervisors can view assigned CHW profiles" ON public.profiles
  FOR SELECT USING (
    current_user_role() = 'supervisor' AND (supervisor_id = auth.uid() OR id = auth.uid())
  );

-- 2. Patients Policies
CREATE POLICY "Admins have full access to patients" ON public.patients
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "CHWs can access assigned or created patients" ON public.patients
  FOR ALL USING (
    current_user_role() = 'chw' AND (created_by = auth.uid() OR assigned_chw = auth.uid())
  );

CREATE POLICY "Supervisors can access team patients" ON public.patients
  FOR SELECT USING (
    current_user_role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = public.patients.created_by AND supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view referred patients" ON public.patients
  FOR SELECT USING (
    current_user_role() = 'doctor' AND EXISTS (
      SELECT 1 FROM public.referrals WHERE patient_id = public.patients.id
    )
  );

-- 3. Visits Policies
CREATE POLICY "Admins have full access to visits" ON public.visits
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "CHWs can insert and view their own visits" ON public.visits
  FOR ALL USING (
    current_user_role() = 'chw' AND chw_id = auth.uid()
  );

CREATE POLICY "Supervisors can view team visits" ON public.visits
  FOR SELECT USING (
    current_user_role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = public.visits.chw_id AND supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view visits of referred patients" ON public.visits
  FOR SELECT USING (
    current_user_role() = 'doctor' AND EXISTS (
      SELECT 1 FROM public.referrals WHERE patient_id = public.visits.patient_id
    )
  );

-- 4. Referrals Policies
CREATE POLICY "Admins have full access to referrals" ON public.referrals
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "CHWs can manage their generated referrals" ON public.referrals
  FOR ALL USING (
    current_user_role() = 'chw' AND referring_chw_id = auth.uid()
  );

CREATE POLICY "Doctors can view and update referrals" ON public.referrals
  FOR ALL USING (current_user_role() = 'doctor');

CREATE POLICY "Supervisors can view team referrals" ON public.referrals
  FOR SELECT USING (current_user_role() = 'supervisor');

-- 5. Prescriptions & General Tables
CREATE POLICY "Clinicians and CHWs can view prescriptions" ON public.prescriptions
  FOR SELECT USING (true);

CREATE POLICY "Doctors and Admins can create and update prescriptions" ON public.prescriptions
  FOR ALL USING (current_user_role() IN ('doctor', 'admin'));

CREATE POLICY "Staff can view inventory" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "Supervisors and Admins can manage inventory" ON public.inventory
  FOR ALL USING (current_user_role() IN ('supervisor', 'admin'));

CREATE POLICY "Emergency reports visible to team" ON public.emergency_reports
  FOR ALL USING (true);

CREATE POLICY "Audit logs insertable by all, readable by admin" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Audit logs select by admin" ON public.audit_logs
  FOR SELECT USING (current_user_role() = 'admin');
