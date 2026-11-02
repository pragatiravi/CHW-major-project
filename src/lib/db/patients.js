import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { INITIAL_PATIENTS } from '../../data/initialData';
import { recordPatientVisit, fetchVisitsForPatient } from './visits';
import { 
  savePatientLocally, 
  getLocalPatientsFromDB, 
  enqueueSyncOperation, 
  removeSyncQueueItem 
} from './dexieDb';

function getCacheKey(userId) {
  return 'chw_patients_' + (userId || 'anon');
}

function getLocalPatients(userId, userRole) {
  try {
    const key = getCacheKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Initial seed for known demo profiles if empty
    if (userId === '00000000-0000-0000-0000-000000000003' || (!userId && userRole === 'chw')) {
      return INITIAL_PATIENTS;
    }
    if (userRole === 'doctor' && (userId === '00000000-0000-0000-0000-000000000005' || !userId)) {
      return INITIAL_PATIENTS.filter(p => Boolean(p.referral));
    }
    if ((userRole === 'supervisor' || userRole === 'admin') && 
        (userId === '00000000-0000-0000-0000-000000000001' || userId === '00000000-0000-0000-0000-000000000002' || !userId)) {
      return INITIAL_PATIENTS;
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalPatients(patients, userId) {
  try {
    const key = getCacheKey(userId);
    localStorage.setItem(key, JSON.stringify(patients));
  } catch (e) {
    console.error('Failed to save local patient cache:', e);
  }
}

/**
 * Fetch all active community patients scoped to the authenticated user context
 */
export async function fetchPatients(currentUser = null) {
  const userId = currentUser?.id;
  const userRole = currentUser?.role;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          visits (*),
          referrals (*),
          prescriptions (*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Database query error');
      }

      if (Array.isArray(data)) {
        // Map normalized DB records to UI patient shape
        const mapped = data.map(record => {
          const sortedVisits = (record.visits || []).sort(
            (a, b) => new Date(b.visit_date) - new Date(a.visit_date)
          );
          const latestVisit = sortedVisits[0] || {};
          const latestReferral = (record.referrals || []).find(r => !r.deleted_at);

          return {
            id: record.custom_id || record.id,
            db_id: record.id,
            legacy_id: record.legacy_id || record.custom_id,
            name: record.name,
            age: record.age,
            gender: record.gender,
            village: record.village,
            address: record.address || record.village,
            phone: record.phone || '',
            abha_id: record.abha_id,
            systolic: latestVisit.systolic || 120,
            diastolic: latestVisit.diastolic || 80,
            glucose: latestVisit.glucose || 95,
            glucoseType: latestVisit.glucose_type || 'random',
            bmi: latestVisit.bmi || 24.0,
            weight: latestVisit.weight || 65,
            height: latestVisit.height || 165,
            heartRate: latestVisit.heart_rate || 75,
            symptoms: latestVisit.symptoms || [],
            familyHistory: latestVisit.family_history ?? true,
            smoking: latestVisit.smoking ?? false,
            alcohol: latestVisit.alcohol ?? false,
            activeLifestyle: latestVisit.active_lifestyle ?? true,
            medicines: record.prescriptions || [],
            referral: latestReferral ? {
              hospitalName: latestReferral.hospital_name,
              urgency: latestReferral.urgency,
              status: latestReferral.status,
              reason: latestReferral.reason,
              notes: latestReferral.doctor_notes
            } : null,
            assignedCHW: record.assigned_chw || currentUser?.name || 'Field CHW',
            syncStatus: 'synced'
          };
        });

        // Update scoped local cache and IndexedDB with fresh remote records
        saveLocalPatients(mapped, userId);
        for (const record of mapped) {
          savePatientLocally(record).catch(() => {});
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchPatients query failed, falling back to scoped local store:', err);
    }
  }

  try {
    const dexieRecords = await getLocalPatientsFromDB(userId);
    if (Array.isArray(dexieRecords) && dexieRecords.length > 0) {
      return dexieRecords;
    }
  } catch {
    // Fall through to memory/localStorage
  }

  return getLocalPatients(userId, userRole);
}

/**
 * Save or update a patient and persist a new longitudinal visit row.
 * Throws on remote failure so UI can surface error with retry option.
 */
export async function savePatient(patientRecord, currentUser = null) {
  const userId = currentUser?.id || 'anon';
  const userName = currentUser?.name || 'Field CHW';

  // 1. Record the new visit row (never overwrites historical visits)
  try {
    await recordPatientVisit({
      patientId: patientRecord.id,
      chwId: userId,
      systolic: patientRecord.systolic,
      diastolic: patientRecord.diastolic,
      glucose: patientRecord.glucose,
      glucoseType: patientRecord.glucoseType,
      weight: patientRecord.weight,
      height: patientRecord.height,
      bmi: patientRecord.bmi,
      heartRate: patientRecord.heartRate,
      symptoms: patientRecord.symptoms,
      familyHistory: patientRecord.familyHistory,
      smoking: patientRecord.smoking,
      alcohol: patientRecord.alcohol,
      activeLifestyle: patientRecord.activeLifestyle,
      riskLevel: patientRecord.evaluation?.overallRiskLevel || 'Low',
      riskScore: patientRecord.evaluation?.overallScore || 0,
      visitDate: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging visit encounter:', err);
  }

  // 2. Prepare payload & update local Dexie IndexedDB first (Offline-First)
  const patientPayload = {
    custom_id: patientRecord.id,
    legacy_id: patientRecord.legacy_id || patientRecord.id,
    name: patientRecord.name,
    age: parseInt(patientRecord.age) || 45,
    gender: (patientRecord.gender || 'female').toLowerCase(),
    village: patientRecord.village || 'Community Sector',
    address: patientRecord.address || '',
    phone: patientRecord.phone || '',
    created_by: userId !== 'anon' ? userId : null,
    assigned_chw: userId !== 'anon' ? userId : null,
    updated_at: new Date().toISOString()
  };

  const recordWithStaff = {
    ...patientRecord,
    ...patientPayload,
    assignedCHW: userName,
    created_by: userId
  };

  // Write to IndexedDB immediately
  await savePatientLocally(recordWithStaff);

  // Enqueue in Outbox sync queue with client-generated custom_id
  const syncItem = await enqueueSyncOperation({
    entity: 'patients',
    entityId: patientRecord.id,
    operation: 'UPSERT',
    payload: patientPayload
  });

  // 3. Persist to Supabase if online and configured
  if (isSupabaseConfigured && supabase && typeof navigator !== 'undefined' && navigator.onLine) {
    const { error } = await supabase
      .from('patients')
      .upsert([patientPayload], { onConflict: 'custom_id' });

    if (!error) {
      // Successfully pushed; dequeue from outbox
      if (syncItem?.id) await removeSyncQueueItem(syncItem.id);
    } else {
      throw new Error(`Failed to save patient to database: ${error.message}`);
    }
  }

  // 4. Update scoped synchronous cache
  const currentPatients = getLocalPatients(userId, currentUser?.role);
  const existingIdx = currentPatients.findIndex(p => p.id === patientRecord.id);
  let updatedPatients;

  if (existingIdx >= 0) {
    updatedPatients = [...currentPatients];
    updatedPatients[existingIdx] = recordWithStaff;
  } else {
    updatedPatients = [recordWithStaff, ...currentPatients];
  }

  saveLocalPatients(updatedPatients, userId);
  return recordWithStaff;
}

/**
 * Soft delete a patient record
 */
export async function deletePatient(patientId, currentUser = null) {
  // Queue delete operation in outbox
  const syncItem = await enqueueSyncOperation({
    entity: 'patients',
    entityId: patientId,
    operation: 'DELETE',
    payload: { custom_id: patientId }
  });

  if (isSupabaseConfigured && supabase && typeof navigator !== 'undefined' && navigator.onLine) {
    const { error } = await supabase
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('custom_id', patientId);

    if (!error) {
      if (syncItem?.id) await removeSyncQueueItem(syncItem.id);
    } else {
      throw new Error(`Failed to delete patient from database: ${error.message}`);
    }
  }

  const currentPatients = getLocalPatients(currentUser?.id, currentUser?.role);
  const filtered = currentPatients.filter(p => p.id !== patientId);
  saveLocalPatients(filtered, currentUser?.id);
  return true;
}

/**
 * Fetch patient longitudinal visit history
 */
export async function fetchPatientVisitHistory(patientId, currentUser = null) {
  return fetchVisitsForPatient(patientId, currentUser?.id);
}
