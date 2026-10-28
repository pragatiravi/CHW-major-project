import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Fetch prescriptions for a given patient
 */
export async function fetchPrescriptions(patientId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('id')
        .eq('custom_id', patientId)
        .single();

      if (patientRecord?.id) {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', patientRecord.id)
          .eq('is_active', true);

        if (!error && data) return data;
      }
    } catch (err) {
      console.warn('Supabase fetchPrescriptions error:', err);
    }
  }

  return [];
}

/**
 * Update or save prescriptions for a patient
 */
export async function savePrescriptions(patientId, medicinesList) {
  if (isSupabaseConfigured && supabase && Array.isArray(medicinesList)) {
    try {
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('id')
        .eq('custom_id', patientId)
        .single();

      if (patientRecord?.id) {
        // Deactivate old active prescriptions
        await supabase
          .from('prescriptions')
          .update({ is_active: false })
          .eq('patient_id', patientRecord.id);

        // Insert new prescription rows
        const rows = medicinesList.map(med => ({
          patient_id: patientRecord.id,
          medicine_name: med.name,
          dosage: med.dosage || 'Standard',
          frequency: med.frequency || 'Daily',
          time_schedule: med.time || 'Morning',
          taken_today: Boolean(med.takenToday),
          is_active: true
        }));

        if (rows.length > 0) {
          await supabase.from('prescriptions').insert(rows);
        }
      }
    } catch (err) {
      console.warn('Supabase savePrescriptions error:', err);
    }
  }

  return medicinesList;
}
