import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  saveVisitLocally, 
  getLocalVisitsFromDB, 
  enqueueSyncOperation, 
  removeSyncQueueItem 
} from './dexieDb';

function getLocalVisits(userId) {
  try {
    const key = 'chw_visits_' + (userId || 'anon');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVisits(visits, userId) {
  try {
    const key = 'chw_visits_' + (userId || 'anon');
    localStorage.setItem(key, JSON.stringify(visits));
  } catch (e) {
    console.error('Failed to save local visits:', e);
  }
}

/**
 * Record a new clinical screening visit (never overwrites historical visits)
 */
export async function recordPatientVisit(visitData) {
  const visitPayload = {
    id: visitData.id || ('v_' + Date.now()),
    patient_id: visitData.patientId || visitData.patient_id,
    chw_id: visitData.chwId || visitData.chw_id || null,
    visit_date: visitData.visitDate || new Date().toISOString(),
    systolic: parseInt(visitData.systolic) || 120,
    diastolic: parseInt(visitData.diastolic) || 80,
    glucose: parseFloat(visitData.glucose) || 90,
    glucose_type: visitData.glucoseType || 'random',
    weight: parseFloat(visitData.weight) || null,
    height: parseFloat(visitData.height) || null,
    bmi: parseFloat(visitData.bmi) || null,
    heart_rate: parseInt(visitData.heartRate) || 75,
    symptoms: Array.isArray(visitData.symptoms) ? visitData.symptoms : [],
    family_history: Boolean(visitData.familyHistory),
    smoking: Boolean(visitData.smoking),
    alcohol: Boolean(visitData.alcohol),
    active_lifestyle: Boolean(visitData.activeLifestyle),
    risk_level: visitData.riskLevel || 'Low',
    risk_score: parseInt(visitData.riskScore) || 0,
    created_at: new Date().toISOString(),
  };

  // 1. Write to local IndexedDB first (Offline-First)
  await saveVisitLocally(visitPayload);

  // 2. Queue in outbox
  const syncItem = await enqueueSyncOperation({
    entity: 'visits',
    entityId: visitPayload.id,
    operation: 'INSERT',
    payload: visitPayload
  });

  // 3. Persist to Supabase if online and configured
  if (isSupabaseConfigured && supabase && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .insert([visitPayload])
        .select()
        .single();
      if (!error && data) {
        if (syncItem?.id) await removeSyncQueueItem(syncItem.id);
        return data;
      }
    } catch (err) {
      console.warn('Supabase visit recording failed, kept in outbox queue:', err);
    }
  }

  // 4. Update synchronous fallback store
  const allVisits = getLocalVisits(visitPayload.chw_id);
  const nextVisits = [visitPayload, ...allVisits];
  saveLocalVisits(nextVisits, visitPayload.chw_id);
  return visitPayload;
}

/**
 * Retrieve longitudinal visit history for a specific patient
 */
export async function fetchVisitsForPatient(patientId, userId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase visit fetch error:', err);
    }
  }

  try {
    const dbVisits = await getLocalVisitsFromDB(patientId);
    if (Array.isArray(dbVisits) && dbVisits.length > 0) {
      return dbVisits.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    }
  } catch {
    // Fall through
  }

  const allVisits = getLocalVisits(userId);
  return allVisits
    .filter(v => v.patient_id === patientId || v.patientId === patientId)
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
}
