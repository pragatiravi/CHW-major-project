import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Save ThinkLets counselling encounter
 */
export async function saveCounsellingSession(patientId, sessionRecord) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('id')
        .eq('custom_id', patientId)
        .single();

      if (patientRecord?.id) {
        await supabase
          .from('counselling_sessions')
          .insert([{
            patient_id: patientRecord.id,
            thinklet_id: sessionRecord.scriptId || sessionRecord.id || 'general',
            language: sessionRecord.language || 'en',
            completed_steps: sessionRecord.completedSteps || [],
            patient_commitment: sessionRecord.commitment || null,
          }]);
      }
    } catch (err) {
      console.warn('Supabase saveCounsellingSession error:', err);
    }
  }

  return sessionRecord;
}
