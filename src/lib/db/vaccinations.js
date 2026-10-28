import { supabase, isSupabaseConfigured } from '../supabaseClient';

const LOCAL_VACCINATIONS_KEY = 'chw_vaccinations';

function getLocalVaccinations() {
  try {
    const raw = localStorage.getItem(LOCAL_VACCINATIONS_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 'VAC-01', patientId: 'P7204', patientName: 'Priya Sharma', vaccineName: 'Tetanus Toxoid (TT)', doseNumber: 1, dueDate: '2026-06-15', status: 'Completed', givenDate: '2026-06-15' },
      { id: 'VAC-02', patientId: 'P7204', patientName: 'Priya Sharma', vaccineName: 'Influenza (Seasonal)', doseNumber: 1, dueDate: '2026-09-01', status: 'Due' },
      { id: 'VAC-03', patientId: 'P4389', patientName: 'Fatima Begum', vaccineName: 'Pneumococcal (PCV20)', doseNumber: 1, dueDate: '2026-07-10', status: 'Overdue' }
    ];
  } catch {
    return [];
  }
}

export async function fetchVaccinations(patientId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('vaccinations').select('*, patients(name, custom_id)');
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map(v => ({
          id: v.id,
          patientId: v.patients?.custom_id || v.patient_id,
          patientName: v.patients?.name || 'Community Patient',
          vaccineName: v.vaccine_name,
          doseNumber: v.dose_number,
          dueDate: v.due_date,
          givenDate: v.given_date,
          status: v.status,
          batchNumber: v.batch_number
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchVaccinations error:', err);
    }
  }

  const local = getLocalVaccinations();
  return patientId ? local.filter(v => v.patientId === patientId) : local;
}

export async function recordVaccination(record) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('vaccinations').insert([{
        patient_id: record.patientId,
        vaccine_name: record.vaccineName,
        dose_number: record.doseNumber || 1,
        due_date: record.dueDate || new Date().toISOString().split('T')[0],
        given_date: record.givenDate || null,
        status: record.status || 'Completed',
        batch_number: record.batchNumber || null
      }]);
    } catch (err) {
      console.warn('Supabase recordVaccination error:', err);
    }
  }

  const current = getLocalVaccinations();
  const next = [record, ...current];
  try {
    localStorage.setItem(LOCAL_VACCINATIONS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save vaccination locally:', e);
  }
  return record;
}
