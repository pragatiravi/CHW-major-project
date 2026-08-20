export async function fetchMedicalOfficerPatients() { return []; }
export async function syncMedicalOfficerMedicationOrders(patient, medicines) { return medicines; }
export async function reviewMedicalOfficerReferral(patient, status, notes) { if (!patient?.referral) return null; return { ...patient.referral, status: status === 'approved' ? 'Approved' : 'Declined', notes }; }
