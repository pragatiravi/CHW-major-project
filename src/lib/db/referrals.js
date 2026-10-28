import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Save hospital referral
 */
export async function saveReferral(patientId, referralObj) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('id')
        .eq('custom_id', patientId)
        .single();

      if (patientRecord?.id) {
        await supabase
          .from('referrals')
          .insert([{
            patient_id: patientRecord.id,
            hospital_name: referralObj.hospitalName,
            urgency: (referralObj.urgency || 'priority').toLowerCase(),
            status: referralObj.status || 'Pending',
            reason: referralObj.reason || 'Screening risk stratification flag',
            doctor_notes: referralObj.notes || null,
          }]);
      }
    } catch (err) {
      console.warn('Supabase saveReferral error:', err);
    }
  }

  return referralObj;
}

/**
 * Update referral status by reviewing clinician
 */
export async function updateReferralStatus(patientId, status, doctorNotes, doctorId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('id')
        .eq('custom_id', patientId)
        .single();

      if (patientRecord?.id) {
        await supabase
          .from('referrals')
          .update({
            status: status === 'approved' ? 'Approved' : 'Declined',
            doctor_notes: doctorNotes,
            reviewed_by: doctorId,
            reviewed_at: new Date().toISOString(),
          })
          .eq('patient_id', patientRecord.id)
          .eq('status', 'Pending');
      }
    } catch (err) {
      console.warn('Supabase updateReferralStatus error:', err);
    }
  }

  return true;
}
