import { supabase } from './supabase';
import { assessPatientRisk } from '../utils/predictionEngine';

function assertResult(result, context) {
  if (result.error) {
    throw new Error(context + ': ' + result.error.message);
  }
  return result.data || [];
}

function latestByPatient(rows, timestampField) {
  const latest = new Map();
  [...rows]
    .sort((a, b) => new Date(b[timestampField]) - new Date(a[timestampField]))
    .forEach((row) => {
      if (!latest.has(row.patient_id)) latest.set(row.patient_id, row);
    });
  return latest;
}

function groupByPatient(rows) {
  return rows.reduce((groups, row) => {
    const current = groups.get(row.patient_id) || [];
    current.push(row);
    groups.set(row.patient_id, current);
    return groups;
  }, new Map());
}

function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
}

function mapMedication(order) {
  return {
    id: order.external_id,
    databaseId: order.id,
    name: order.medication_name,
    dosage: order.dosage,
    frequency: order.frequency,
    instructions: order.instructions,
    startDate: order.start_date,
    endDate: order.end_date,
    status: titleCase(order.status),
    missedDoses: order.missed_doses,
  };
}

function mapReferral(referral) {
  if (!referral) return null;
  return {
    databaseId: referral.id,
    status: titleCase(referral.status),
    hospitalName: referral.destination_facility_name,
    doctorName: referral.destination_clinician_name,
    urgency: titleCase(referral.urgency),
    reason: referral.reason,
    notes: referral.notes,
    dateGenerated: new Date(referral.created_at).toLocaleDateString(),
  };
}

export async function fetchMedicalOfficerPatients() {
  const patientsResult = await supabase
    .from('patients')
    .select(
      'id, public_id, full_name, age_years, gender, phone, address, family_history, smoking, alcohol, active_lifestyle, follow_up_date, is_priority, registered_at',
    )
    .order('is_priority', { ascending: false })
    .order('created_at', { ascending: false });

  const patientRows = assertResult(patientsResult, 'Unable to load patient records');
  if (patientRows.length === 0) return [];

  const patientIds = patientRows.map((patient) => patient.id);
  const [vitalsResult, screeningsResult, medicationsResult, referralsResult, assignmentsResult] =
    await Promise.all([
      supabase
        .from('vitals')
        .select('*')
        .in('patient_id', patientIds)
        .order('recorded_at', { ascending: false }),
      supabase
        .from('screenings')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('medication_orders')
        .select('*')
        .in('patient_id', patientIds)
        .neq('status', 'discontinued')
        .order('created_at', { ascending: true }),
      supabase
        .from('referrals')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('patient_assignments')
        .select('patient_id, assigned_to')
        .in('patient_id', patientIds)
        .eq('active', true),
    ]);

  const vitals = assertResult(vitalsResult, 'Unable to load patient vitals');
  const screenings = assertResult(screeningsResult, 'Unable to load screenings');
  const medications = assertResult(medicationsResult, 'Unable to load medication orders');
  const referrals = assertResult(referralsResult, 'Unable to load referrals');
  const assignments = assertResult(assignmentsResult, 'Unable to load patient assignments');

  const assigneeIds = [...new Set(assignments.map((assignment) => assignment.assigned_to))];
  const profilesResult = assigneeIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', assigneeIds)
    : { data: [], error: null };
  const profiles = assertResult(profilesResult, 'Unable to load assigned care workers');
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
  const assignmentByPatient = new Map(
    assignments.map((assignment) => [
      assignment.patient_id,
      profileNames.get(assignment.assigned_to) || 'Assigned care worker',
    ]),
  );

  const latestVitals = latestByPatient(vitals, 'recorded_at');
  const latestScreenings = latestByPatient(screenings, 'created_at');
  const latestReferrals = latestByPatient(referrals, 'created_at');
  const medicationsByPatient = groupByPatient(medications);

  return patientRows.map((patient) => {
    const vital = latestVitals.get(patient.id) || {};
    const screening = latestScreenings.get(patient.id) || {};
    const mapped = {
      id: patient.public_id,
      databaseId: patient.id,
      name: patient.full_name,
      age: patient.age_years,
      gender: patient.gender || 'unknown',
      phone: patient.phone || 'Not recorded',
      address: patient.address || 'Not recorded',
      systolic: vital.systolic,
      diastolic: vital.diastolic,
      glucose: vital.glucose_mg_dl,
      glucoseType: vital.glucose_type || 'random',
      heartRate: vital.heart_rate,
      weight: vital.weight_kg,
      height: vital.height_cm,
      bmi: vital.bmi,
      symptoms: screening.symptoms || [],
      familyHistory: patient.family_history,
      smoking: patient.smoking,
      alcohol: patient.alcohol,
      activeLifestyle: patient.active_lifestyle,
      followUpDate: patient.follow_up_date,
      isPriority: patient.is_priority,
      dateRegistered: new Date(patient.registered_at).toLocaleDateString(),
      assignedCHW: assignmentByPatient.get(patient.id) || 'Not assigned',
      syncStatus: 'synced',
      medicines: (medicationsByPatient.get(patient.id) || []).map(mapMedication),
      referral: mapReferral(latestReferrals.get(patient.id)),
      reports: [],
      counsellingHistory: [],
    };

    return {
      ...mapped,
      evaluation: assessPatientRisk(mapped),
    };
  });
}

export async function syncMedicalOfficerMedicationOrders(patient, medicines) {
  if (!patient?.databaseId) {
    throw new Error('This patient record is not linked to Supabase.');
  }

  const { data, error } = await supabase.rpc('sync_medication_orders', {
    target_patient_id: patient.databaseId,
    orders: medicines,
  });

  if (error) {
    throw new Error('Unable to save medication orders: ' + error.message);
  }

  return (data || []).map(mapMedication);
}

export async function reviewMedicalOfficerReferral(patient, status, notes) {
  if (!patient?.referral?.databaseId) {
    throw new Error('This referral is not linked to Supabase.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Your secure session has expired. Sign in again.');
  }

  const { data, error } = await supabase
    .from('referrals')
    .update({
      status,
      notes,
      reviewed_by: userData.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', patient.referral.databaseId)
    .select('*')
    .single();

  if (error) {
    throw new Error('Unable to update the referral: ' + error.message);
  }

  return mapReferral(data);
}
