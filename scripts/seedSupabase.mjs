import { createClient } from '@supabase/supabase-js';
import { INITIAL_PATIENTS } from '../src/data/initialData.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serverSecretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.SUPABASE_DEMO_PASSWORD;
const facilityId = '00000000-0000-4000-8000-000000000001';

if (!supabaseUrl || !serverSecretKey || !demoPassword) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SECRET_KEY, and SUPABASE_DEMO_PASSWORD in .env.supabase.local before provisioning.',
  );
}

if (demoPassword.length < 12) {
  throw new Error('SUPABASE_DEMO_PASSWORD must be at least 12 characters.');
}

const supabase = createClient(supabaseUrl, serverSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const accounts = [
  {
    key: 'chw',
    email: 'sunita.patil@communityhealth.org',
    fullName: 'Sunita Patil',
    role: 'chw',
    employeeCode: 'CHW-001',
  },
  {
    key: 'medicalOfficer',
    email: 'ananya.roy@districtmed.org',
    fullName: 'Dr. Ananya Roy',
    role: 'medical_officer',
    employeeCode: 'MO-001',
  },
  {
    key: 'patient',
    email: 'priya.sharma@patienthealth.net',
    fullName: 'Priya Sharma',
    role: 'patient',
    employeeCode: null,
  },
  {
    key: 'supervisor',
    email: 'vikram.singh@subdistrictops.org',
    fullName: 'Vikram Singh',
    role: 'supervisor',
    employeeCode: 'SUP-001',
  },
  {
    key: 'admin',
    email: 'admin.lead@healthsystem.gov',
    fullName: 'Admin Operations',
    role: 'admin',
    employeeCode: 'ADM-001',
  },
];

function ensureNoError(result, context) {
  if (result.error) {
    throw new Error(context + ': ' + result.error.message);
  }
  return result.data;
}

async function findOrCreateUsers() {
  const listed = ensureNoError(
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    'Unable to list Supabase users',
  );
  const existingByEmail = new Map(
    listed.users.map((user) => [user.email?.toLowerCase(), user]),
  );
  const users = new Map();

  for (const account of accounts) {
    let user = existingByEmail.get(account.email.toLowerCase());
    if (!user) {
      const created = ensureNoError(
        await supabase.auth.admin.createUser({
          email: account.email,
          password: demoPassword,
          email_confirm: true,
          app_metadata: { full_name: account.fullName },
        }),
        'Unable to create ' + account.email,
      );
      user = created.user;
    }
    users.set(account.key, user);
  }

  return users;
}

async function provisionProfiles(users) {
  const rows = accounts.map((account) => ({
    id: users.get(account.key).id,
    facility_id: facilityId,
    role: account.role,
    full_name: account.fullName,
    employee_code: account.employeeCode,
    is_active: true,
  }));

  ensureNoError(
    await supabase.from('profiles').upsert(rows, { onConflict: 'id' }),
    'Unable to provision user profiles',
  );

  ensureNoError(
    await supabase
      .from('profiles')
      .update({ supervisor_id: users.get('supervisor').id })
      .eq('id', users.get('chw').id),
    'Unable to assign the CHW supervisor',
  );
}

async function provisionPatients(users) {
  const patientRows = INITIAL_PATIENTS.map((patient) => ({
    public_id: patient.id,
    profile_id: patient.id === 'P7204' ? users.get('patient').id : null,
    facility_id: facilityId,
    registered_by: users.get('chw').id,
    full_name: patient.name,
    age_years: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    address: patient.address,
    family_history: Boolean(patient.familyHistory),
    smoking: Boolean(patient.smoking),
    alcohol: Boolean(patient.alcohol),
    active_lifestyle: Boolean(patient.activeLifestyle),
    follow_up_date: patient.followUpDate || null,
    is_priority: Boolean(patient.isPriority),
  }));

  ensureNoError(
    await supabase.from('patients').upsert(patientRows, { onConflict: 'public_id' }),
    'Unable to provision patients',
  );

  const storedPatients = ensureNoError(
    await supabase.from('patients').select('id, public_id').in(
      'public_id',
      INITIAL_PATIENTS.map((patient) => patient.id),
    ),
    'Unable to reload provisioned patients',
  );
  const databaseIds = new Map(
    storedPatients.map((patient) => [patient.public_id, patient.id]),
  );

  const existingAssignments = ensureNoError(
    await supabase
      .from('patient_assignments')
      .select('patient_id')
      .eq('assigned_to', users.get('chw').id)
      .eq('active', true),
    'Unable to inspect patient assignments',
  );
  const assignedPatientIds = new Set(
    existingAssignments.map((assignment) => assignment.patient_id),
  );
  const newAssignments = storedPatients
    .filter((patient) => !assignedPatientIds.has(patient.id))
    .map((patient) => ({
      patient_id: patient.id,
      assigned_to: users.get('chw').id,
      assigned_by: users.get('supervisor').id,
      active: true,
    }));
  if (newAssignments.length) {
    ensureNoError(
      await supabase.from('patient_assignments').insert(newAssignments),
      'Unable to assign patients',
    );
  }

  return databaseIds;
}

async function provisionClinicalRecords(users, patientIds) {
  const existingVitals = ensureNoError(
    await supabase.from('vitals').select('patient_id').in('patient_id', [...patientIds.values()]),
    'Unable to inspect vitals',
  );
  const patientsWithVitals = new Set(existingVitals.map((vital) => vital.patient_id));
  const vitalRows = INITIAL_PATIENTS.filter(
    (patient) => !patientsWithVitals.has(patientIds.get(patient.id)),
  ).map((patient) => ({
    patient_id: patientIds.get(patient.id),
    recorded_by: users.get('chw').id,
    systolic: patient.systolic,
    diastolic: patient.diastolic,
    glucose_mg_dl: patient.glucose,
    glucose_type: patient.glucoseType,
    heart_rate: patient.heartRate,
    weight_kg: patient.weight,
    height_cm: patient.height,
    bmi: patient.bmi,
  }));
  if (vitalRows.length) {
    ensureNoError(await supabase.from('vitals').insert(vitalRows), 'Unable to seed vitals');
  }

  const screeningRows = INITIAL_PATIENTS.map((patient) => ({
    external_id: 'SEED-' + patient.id,
    patient_id: patientIds.get(patient.id),
    created_by: users.get('chw').id,
    risk: patient.evaluation.overallRiskLevel.toLowerCase(),
    symptoms: patient.symptoms || [],
    input_data: {
      familyHistory: patient.familyHistory,
      smoking: patient.smoking,
      alcohol: patient.alcohol,
      activeLifestyle: patient.activeLifestyle,
    },
    result_data: patient.evaluation,
  }));
  ensureNoError(
    await supabase
      .from('screenings')
      .upsert(screeningRows, { onConflict: 'patient_id,external_id' }),
    'Unable to seed screenings',
  );

  const medicationRows = INITIAL_PATIENTS.flatMap((patient) =>
    (patient.medicines || []).map((medicine) => ({
      external_id: medicine.id,
      patient_id: patientIds.get(patient.id),
      prescribed_by: users.get('medicalOfficer').id,
      medication_name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      start_date: medicine.startDate,
      end_date: medicine.endDate || null,
      status: medicine.status.toLowerCase(),
      missed_doses: medicine.missedDoses || 0,
    })),
  );
  if (medicationRows.length) {
    ensureNoError(
      await supabase
        .from('medication_orders')
        .upsert(medicationRows, { onConflict: 'patient_id,external_id' }),
      'Unable to seed medication orders',
    );
  }

  const referralRows = INITIAL_PATIENTS.filter((patient) => patient.referral).map(
    (patient) => ({
      external_id: 'SEED-' + patient.id,
      patient_id: patientIds.get(patient.id),
      created_by: users.get('chw').id,
      reviewed_by:
        patient.referral.status === 'Pending' ? null : users.get('medicalOfficer').id,
      destination_facility_name: patient.referral.hospitalName,
      destination_clinician_name: patient.referral.doctorName,
      urgency: patient.referral.urgency.toLowerCase(),
      status: patient.referral.status.toLowerCase(),
      reason: patient.referral.reason,
      notes: patient.referral.notes,
      reviewed_at: patient.referral.status === 'Pending' ? null : new Date().toISOString(),
    }),
  );
  if (referralRows.length) {
    ensureNoError(
      await supabase
        .from('referrals')
        .upsert(referralRows, { onConflict: 'patient_id,external_id' }),
      'Unable to seed referrals',
    );
  }
}

const users = await findOrCreateUsers();
await provisionProfiles(users);
const patientIds = await provisionPatients(users);
await provisionClinicalRecords(users, patientIds);

console.log('Supabase synthetic users and clinical records provisioned successfully.');
