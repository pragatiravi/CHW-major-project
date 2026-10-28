import { fetchPatients, savePrescriptions, updateReferralStatus } from './db';

/**
 * Fetch referred patients for Medical Officer triage queue
 */
export async function fetchMedicalOfficerPatients() {
  const allPatients = await fetchPatients();
  // Filter patients with pending or approved hospital referrals
  return allPatients.filter(patient => Boolean(patient.referral));
}

/**
 * Sync clinician medication orders to patient profile
 */
export async function syncMedicalOfficerMedicationOrders(patient, medicines) {
  if (!patient?.id) return medicines;
  return savePrescriptions(patient.id, medicines);
}

/**
 * Review hospital referral (Approve or Decline)
 */
export async function reviewMedicalOfficerReferral(patient, status, notes) {
  if (!patient?.id || !patient.referral) return null;
  await updateReferralStatus(patient.id, status, notes);
  return {
    ...patient.referral,
    status: status === 'approved' ? 'Approved' : 'Declined',
    notes,
  };
}
