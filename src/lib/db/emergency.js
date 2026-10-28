import { supabase, isSupabaseConfigured } from '../supabaseClient';

const LOCAL_EMERGENCY_KEY = 'chw_emergency_reports';

function getLocalEmergencyReports() {
  try {
    const raw = localStorage.getItem(LOCAL_EMERGENCY_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'EMG-101',
        patientId: 'P4389',
        patientName: 'Fatima Begum',
        incidentType: 'Hypertensive Crisis',
        description: 'BP 185/112 with chest tightness. Dispatched ambulance 108.',
        locationAddress: 'Old Fort Market Sector, Gate 2',
        status: 'Dispatched',
        createdAt: '2026-06-12 10:15 AM',
        ambulanceDispatched: true
      }
    ];
  } catch {
    return [];
  }
}

export async function fetchEmergencyReports() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*, patients(name, custom_id)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(r => ({
          id: r.id,
          patientId: r.patients?.custom_id || r.patient_id,
          patientName: r.patients?.name || 'Community Patient',
          incidentType: r.incident_type,
          description: r.description,
          locationAddress: r.location_address,
          status: r.status,
          createdAt: new Date(r.created_at).toLocaleString(),
          ambulanceDispatched: r.ambulance_dispatched
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchEmergencyReports error:', err);
    }
  }

  return getLocalEmergencyReports();
}

export async function createEmergencyReport(report) {
  const reportPayload = {
    id: report.id || ('EMG-' + Math.floor(100 + Math.random() * 900)),
    patientId: report.patientId,
    patientName: report.patientName || 'Community Patient',
    incidentType: report.incidentType || 'Hypertensive Crisis',
    description: report.description,
    locationAddress: report.locationAddress || 'Field Location',
    status: report.status || 'Reported',
    createdAt: new Date().toLocaleString(),
    ambulanceDispatched: Boolean(report.ambulanceDispatched)
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('emergency_reports').insert([{
        incident_type: reportPayload.incidentType,
        description: reportPayload.description,
        location_address: reportPayload.locationAddress,
        status: reportPayload.status,
        ambulance_dispatched: reportPayload.ambulanceDispatched
      }]);
    } catch (err) {
      console.warn('Supabase createEmergencyReport error:', err);
    }
  }

  const current = getLocalEmergencyReports();
  const next = [reportPayload, ...current];
  try {
    localStorage.setItem(LOCAL_EMERGENCY_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save emergency report locally:', e);
  }
  return reportPayload;
}
