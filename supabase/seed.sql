-- =============================================================================
-- Community Health Worker (CHW) Healthcare Toolkit
-- Supabase Realistic Synthetic Seed Dataset (with auth.users and profiles FK)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create real Supabase Auth users in auth.users so FK references succeed
-- All demo passwords are set to real bcrypt hashes:
-- Admin: DemoAdmin@123!
-- Supervisor: DemoSupervisor@123!
-- Sunita (CHW): DemoCHW@123!
-- Ramesh (CHW): DemoCHW@123!
-- Doctor: DemoDoctor@123!
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.lead@healthsystem.gov', crypt('DemoAdmin@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Operations"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vikram.singh@subdistrictops.org', crypt('DemoSupervisor@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Singh"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sunita.patil@communityhealth.org', crypt('DemoCHW@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sunita Patil"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ramesh.kumar@communityhealth.org', crypt('DemoCHW@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ramesh Kumar"}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya.roy@districtmed.org', crypt('DemoDoctor@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Ananya Roy (M.D.)"}', now(), now())
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_sup_id   UUID := '00000000-0000-0000-0000-000000000002';
  v_chw1_id  UUID := '00000000-0000-0000-0000-000000000003';
  v_chw2_id  UUID := '00000000-0000-0000-0000-000000000004';
  v_doc_id   UUID := '00000000-0000-0000-0000-000000000005';

  v_p1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_p2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_p3_id UUID := '33333333-3333-3333-3333-333333333333';
  v_p4_id UUID := '44444444-4444-4444-4444-444444444444';

  v_visit1_id UUID := gen_random_uuid();
  v_visit2_id UUID := gen_random_uuid();
  v_visit3_id UUID := gen_random_uuid();
  v_visit4_id UUID := gen_random_uuid();
  v_visit5_id UUID := gen_random_uuid();
BEGIN
  -- 1. Profiles (with verified 'approved' status)
  INSERT INTO public.profiles (id, full_name, phone, role, status, subcenter, supervisor_id, language_pref)
  VALUES
    (v_admin_id, 'Admin Operations', '+91 98000 00001', 'admin', 'approved', 'District Health Office', NULL, 'en'),
    (v_sup_id, 'Vikram Singh', '+91 98000 00002', 'supervisor', 'approved', 'Belagavi Sub-District PHC', v_admin_id, 'en'),
    (v_chw1_id, 'Sunita Patil', '+91 98000 00003', 'chw', 'approved', 'Vimanapura Subcenter', v_sup_id, 'kn'),
    (v_chw2_id, 'Ramesh Kumar', '+91 98000 00004', 'chw', 'approved', 'Kittur Rural Subcenter', v_sup_id, 'kn'),
    (v_doc_id, 'Dr. Ananya Roy (M.D.)', '+91 98000 00005', 'doctor', 'approved', 'District Civil Hospital', NULL, 'en')
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    supervisor_id = EXCLUDED.supervisor_id;

  -- 2. Patients with explicit legacy_id mapping
  INSERT INTO public.patients (id, custom_id, legacy_id, name, dob, age, gender, village, address, phone, abha_id, created_by, assigned_chw, consent_given)
  VALUES
    (v_p1_id, 'P7204', 'P7204', 'Priya Sharma', '1972-04-12', 54, 'female', 'Vimanapura Sector 3', 'House 42, Cross Road', '+91 98450 12345', '91-7204-8891-2310', v_chw1_id, v_chw1_id, true),
    (v_p2_id, 'P4389', 'P4389', 'Fatima Begum', '1964-08-20', 62, 'female', 'Old Fort Market Sector', 'Near Market Gate 2', '+91 94480 23456', '91-4389-1122-9901', v_chw1_id, v_chw1_id, true),
    (v_p3_id, 'P1092', 'P1092', 'Suresh Pujari', '1978-11-05', 48, 'male', 'Kittur Rural Zone', 'Main Panchayat Lane', '+91 97410 34567', '91-1092-4433-5561', v_chw2_id, v_chw2_id, true),
    (v_p4_id, 'P8841', 'P8841', 'Manjula Gowda', '1992-02-14', 34, 'female', 'Vimanapura Sector 1', 'Subcenter Quarter 5', '+91 99000 45678', '91-8841-7788-0012', v_chw1_id, v_chw1_id, true)
  ON CONFLICT (custom_id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    created_by = EXCLUDED.created_by,
    assigned_chw = EXCLUDED.assigned_chw;

  -- 3. Visits (Longitudinal encounters)
  INSERT INTO public.visits (id, patient_id, chw_id, visit_date, systolic, diastolic, glucose, glucose_type, weight, height, bmi, heart_rate, symptoms, family_history, smoking, alcohol, active_lifestyle, risk_level, risk_score)
  VALUES
    (v_visit1_id, v_p1_id, v_chw1_id, NOW() - INTERVAL '60 days', 154, 96, 178, 'fasting', 74.0, 163.0, 27.9, 82, ARRAY['headache', 'fatigue'], true, false, false, false, 'High', 74),
    (v_visit5_id, v_p1_id, v_chw1_id, NOW() - INTERVAL '10 days', 142, 92, 155, 'fasting', 72.5, 163.0, 27.3, 76, ARRAY['headache'], true, false, false, true, 'Moderate', 52),
    (v_visit2_id, v_p2_id, v_chw1_id, NOW() - INTERVAL '2 days', 185, 112, 210, 'random', 68.0, 155.0, 28.3, 94, ARRAY['chest_pain', 'dizziness'], true, false, false, false, 'Critical', 94),
    (v_visit3_id, v_p3_id, v_chw2_id, NOW() - INTERVAL '15 days', 148, 94, 185, 'random', 78.0, 170.0, 27.0, 78, ARRAY['blurred_vision'], true, true, false, false, 'High', 68),
    (v_visit4_id, v_p4_id, v_chw1_id, NOW() - INTERVAL '25 days', 118, 76, 92, 'fasting', 54.0, 158.0, 21.6, 72, ARRAY[]::TEXT[], false, false, false, true, 'Low', 12)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Referrals
  INSERT INTO public.referrals (visit_id, patient_id, referring_chw_id, hospital_name, urgency, status, reason, doctor_notes, reviewed_by, reviewed_at)
  VALUES
    (v_visit2_id, v_p2_id, v_chw1_id, 'District Civil Hospital, Belagavi', 'emergency', 'Approved', 'Hypertensive crisis BP 185/112 with chest pain angina symptoms.', 'Urgent ECG performed. Started on IV antihypertensive protocol.', v_doc_id, NOW() - INTERVAL '1 day'),
    (v_visit5_id, v_p1_id, v_chw1_id, 'Taluk Hospital Kittur', 'priority', 'Pending', 'Stage 2 Hypertension and fasting hyperglycemia requiring regimen adjustment.', NULL, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- 5. Prescriptions
  INSERT INTO public.prescriptions (patient_id, medicine_name, dosage, frequency, time_schedule, duration, taken_today)
  VALUES
    (v_p1_id, 'Amlodipine Besylate', '5mg', 'Once Daily', '08:00 AM', '30 Days', true),
    (v_p1_id, 'Metformin HCl', '500mg', 'Twice Daily', '08:00 AM & 08:00 PM', '30 Days', false),
    (v_p2_id, 'Telmisartan', '40mg', 'Once Daily', '08:00 AM', '15 Days', true),
    (v_p3_id, 'Enalapril', '5mg', 'Once Daily', '09:00 AM', '30 Days', true)
  ON CONFLICT DO NOTHING;

  -- 6. Follow-Ups
  INSERT INTO public.follow_ups (patient_id, assigned_chw_id, due_date, status, reminder_sent, notes)
  VALUES
    (v_p1_id, v_chw1_id, CURRENT_DATE + INTERVAL '7 days', 'Scheduled', false, 'Check BP and review sodium restriction compliance'),
    (v_p2_id, v_chw1_id, CURRENT_DATE + INTERVAL '2 days', 'Scheduled', true, 'Post-emergency discharge follow-up check'),
    (v_p3_id, v_chw2_id, CURRENT_DATE + INTERVAL '14 days', 'Scheduled', false, 'Fasting blood sugar re-screen')
  ON CONFLICT DO NOTHING;

  -- 7. Vaccinations
  INSERT INTO public.vaccinations (patient_id, vaccine_name, dose_number, due_date, given_date, status, batch_number)
  VALUES
    (v_p4_id, 'Tetanus Toxoid (TT)', 1, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', 'Completed', 'TT-2026-B81'),
    (v_p4_id, 'Influenza (Seasonal)', 1, CURRENT_DATE + INTERVAL '20 days', NULL, 'Due', NULL)
  ON CONFLICT DO NOTHING;

  -- 8. Emergency Reports
  INSERT INTO public.emergency_reports (patient_id, reporter_id, incident_type, description, location_address, ambulance_dispatched, status)
  VALUES
    (v_p2_id, v_chw1_id, 'Hypertensive Crisis', 'Severe BP elevation 185/112 with chest tightness. Dispatched 108 ambulance to Old Fort Market.', 'Old Fort Market Sector, Gate 2', true, 'Hospitalized')
  ON CONFLICT DO NOTHING;

  -- 9. Inventory
  INSERT INTO public.inventory (item_name, category, quantity, unit, reorder_level, subcenter, batch_number, expiry_date)
  VALUES
    ('Blood Glucose Test Strips (Accu-Chek)', 'Diagnostic Strip', 120, 'strips', 50, 'Vimanapura Subcenter', 'ST-8902', '2027-04-30'),
    ('Amlodipine 5mg Tablets', 'Medication', 450, 'tablets', 100, 'Vimanapura Subcenter', 'AML-441', '2027-08-31'),
    ('Metformin 500mg Tablets', 'Medication', 380, 'tablets', 100, 'Vimanapura Subcenter', 'MET-901', '2027-09-30'),
    ('Digital Sphygmomanometer BP Cuffs (Adult)', 'Device', 4, 'units', 2, 'Vimanapura Subcenter', 'BP-OMR2', NULL),
    ('Sterile Alcohol Swabs', 'First Aid', 600, 'swabs', 150, 'Vimanapura Subcenter', 'SW-112', '2028-01-31')
  ON CONFLICT DO NOTHING;

  -- 10. Audit Logs
  INSERT INTO public.audit_logs (user_name, role, action, entity, entity_id, details)
  VALUES
    ('Sunita Patil', 'chw', 'SCREENING_SAVED', 'visits', v_visit5_id::text, 'Follow-up screening completed for Priya Sharma (P7204)'),
    ('Dr. Ananya Roy (M.D.)', 'doctor', 'REFERRAL_APPROVED', 'referrals', v_p2_id::text, 'Emergency referral approved for Fatima Begum (P4389)')
  ON CONFLICT DO NOTHING;

END $$;
