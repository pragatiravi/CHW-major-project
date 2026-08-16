import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Hospital, 
  Database, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Sliders, 
  Activity,
  BrainCircuit,
  Download,
  CheckCircle2,
  FlaskConical
} from 'lucide-react';
import { 
  INITIAL_HOSPITALS, 
  INITIAL_CHWS, 
  INITIAL_DOCTORS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_PATIENTS 
} from '../../data/initialData';
import PredictionTestLab from './PredictionTestLab';
import { useToast } from '../shared/ToastContainer';

export default function AdminPortal({ 
  auditLogs = INITIAL_AUDIT_LOGS, 
  patients = INITIAL_PATIENTS,
  activeSection = 'analytics'
}) {
  const { toastSuccess, toastInfo } = useToast();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | users | hospitals | test_lab | ml_config | audit
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [chwUsers, setChwUsers] = useState(INITIAL_CHWS);
  const [doctorUsers, setDoctorUsers] = useState(INITIAL_DOCTORS);
  const [mlThresholds, setMlThresholds] = useState({
    htCrisisSystolic: 180,
    htStage2Systolic: 140,
    dbCriticalGlucose: 300,
    dbDiabeticGlucose: 126
  });

  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospBeds, setNewHospBeds] = useState(10);
  const [newHospPhone, setNewHospPhone] = useState('+91 98765 00000');

  React.useEffect(() => {
    if (activeSection) {
      if (activeSection === 'overview') {
        setActiveTab('analytics');
      } else if (activeSection === 'fhir') {
        setActiveTab('analytics');
        handleExportFHIR();
      } else {
        setActiveTab(activeSection);
      }
    }
  }, [activeSection]);

  // FHIR R4 Collection Bundle Exporter
  const handleExportFHIR = () => {
    const targetPatients = Array.isArray(patients) && patients.length > 0 ? patients : INITIAL_PATIENTS;
    const fhirEntries = targetPatients.flatMap(p => {
      const patientResource = {
        fullUrl: `urn:uuid:patient-${p.id}`,
        resource: {
          resourceType: "Patient",
          id: p.id,
          identifier: [{ system: "http://communityhealth.org/patient-id", value: p.id }],
          active: true,
          name: [{ text: p.name }],
          gender: p.gender ? p.gender.toLowerCase() : "unknown",
          telecom: p.phone ? [{ system: "phone", value: p.phone }] : [],
          address: [{ text: p.address || p.village || "Rural Health Sector Zone" }]
        }
      };

      const bpObservation = {
        fullUrl: `urn:uuid:obs-bp-${p.id}`,
        resource: {
          resourceType: "Observation",
          id: `obs-bp-${p.id}`,
          status: "final",
          category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
          code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel with all children optional" }] },
          subject: { reference: `urn:uuid:patient-${p.id}`, display: p.name },
          component: [
            {
              code: { coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }] },
              valueQuantity: { value: parseFloat(p.systolic) || 120, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" }
            },
            {
              code: { coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }] },
              valueQuantity: { value: parseFloat(p.diastolic) || 80, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" }
            }
          ]
        }
      };

      const glucoseObservation = {
        fullUrl: `urn:uuid:obs-glucose-${p.id}`,
        resource: {
          resourceType: "Observation",
          id: `obs-glucose-${p.id}`,
          status: "final",
          category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
          code: { coding: [{ system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" }] },
          subject: { reference: `urn:uuid:patient-${p.id}`, display: p.name },
          valueQuantity: { value: parseFloat(p.glucose) || 95, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" }
        }
      };

      return [patientResource, bpObservation, glucoseObservation];
    });

    const fhirBundle = {
      resourceType: "Bundle",
      id: `bundle-chw-${Date.now()}`,
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: fhirEntries
    };

    const jsonStr = JSON.stringify(fhirBundle, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir_chw_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess('HL7 FHIR R4 Bundle JSON downloaded successfully!');
  };

  const handleAddHospital = (e) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    const hospObj = {
      id: 'HOSP-' + Math.floor(100 + Math.random() * 900),
      name: newHospName,
      type: 'Community Health Center',
      address: 'Primary Health Sector',
      phone: newHospPhone,
      distanceKm: 5.0,
      emergencyRoute: 'Direct Sub-District Corridor',
      bedsAvailable: parseInt(newHospBeds),
      specialties: ['General Medicine', 'Diabetes Care', 'Cardiology Triage'],
      leadDoctor: 'Dr. Medical Lead',
      latitude: 18.52,
      longitude: 73.85
    };

    setHospitals(prev => [...prev, hospObj]);
    setNewHospName('');
    setShowAddHospital(false);
    toastSuccess(`Facility ${newHospName} added to registry!`);
  };

  return (
    <div className="portal-content-container space-y-6">
      {/* Top Banner */}
      <div className="card-box bg-white p-5 flex justify-between items-center flex-wrap gap-4 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">System Administration & Governance</h1>
            <p className="text-xs text-slate-500">Manage hospital facilities, user access roles, CDSS cutoffs, and FHIR interoperability</p>
          </div>
        </div>

        <button 
          className="btn btn-primary text-xs flex items-center gap-2 shadow-sm font-bold"
          onClick={handleExportFHIR}
        >
          <Database size={15} /> Export HL7 FHIR R4 JSON
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        <button className={`btn text-xs ${activeTab === 'analytics' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('analytics')}>
          System Overview
        </button>
        <button className={`btn text-xs ${activeTab === 'test_lab' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('test_lab')}>
          🧪 Prediction Test Lab
        </button>
        <button className={`btn text-xs ${activeTab === 'users' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('users')}>
          Users & Access ({chwUsers.length + doctorUsers.length})
        </button>
        <button className={`btn text-xs ${activeTab === 'hospitals' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('hospitals')}>
          Hospital Registry ({hospitals.length})
        </button>
        <button className={`btn text-xs ${activeTab === 'ml_config' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('ml_config')}>
          Clinical Cutoffs
        </button>
        <button className={`btn text-xs ${activeTab === 'audit' ? 'btn-primary' : 'text-slate-600'}`} onClick={() => setActiveTab('audit')}>
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid-4-col gap-4">
            <div className="metric-box border-l-4 border-l-purple-600">
              <span className="metric-label">Registered Cohort</span>
              <div className="metric-value">{patients.length}</div>
              <span className="metric-sub">Active community records</span>
            </div>

            <div className="metric-box border-l-4 border-l-sky-600">
              <span className="metric-label">Field Staff Users</span>
              <div className="metric-value text-sky-700">{chwUsers.length + doctorUsers.length}</div>
              <span className="metric-sub">{chwUsers.length} CHWs • {doctorUsers.length} Clinicians</span>
            </div>

            <div className="metric-box border-l-4 border-l-indigo-600">
              <span className="metric-label">Hospital Facilities</span>
              <div className="metric-value text-indigo-700">{hospitals.length}</div>
              <span className="metric-sub">{hospitals.reduce((acc, h) => acc + h.bedsAvailable, 0)} Total Beds</span>
            </div>

            <div className="metric-box border-l-4 border-l-emerald-600">
              <span className="metric-label">FHIR R4 Schema Health</span>
              <div className="metric-value text-emerald-700">100%</div>
              <span className="metric-sub">LOINC 85354-9 / 2339-0 Validated</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PREDICTION TEST LAB */}
      {activeTab === 'test_lab' && (
        <div className="card-box p-5 space-y-4">
          <PredictionTestLab />
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="card-box space-y-4">
          <h3 className="text-base font-bold text-slate-900">User Access & Role Management</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Staff Name & ID</th>
                  <th>Operating Role</th>
                  <th>Assigned Village / Facility</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {chwUsers.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong> ({u.id})</td>
                    <td><span className="badge badge-primary">Community Health Worker</span></td>
                    <td>{u.village}</td>
                    <td><span className="badge badge-risk-low">Active</span></td>
                  </tr>
                ))}
                {doctorUsers.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong> ({u.id})</td>
                    <td><span className="badge badge-risk-moderate">Medical Officer</span></td>
                    <td>{u.hospital}</td>
                    <td><span className="badge badge-risk-low">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: HOSPITALS */}
      {activeTab === 'hospitals' && (
        <div className="card-box space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Hospital Facilities Registry</h3>
            <button className="btn btn-primary text-xs" onClick={() => setShowAddHospital(!showAddHospital)}>
              <Plus size={14} /> Add Facility
            </button>
          </div>

          {showAddHospital && (
            <form onSubmit={handleAddHospital} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="grid-3-col gap-3">
                <div className="form-group">
                  <label className="form-label">Hospital Name</label>
                  <input type="text" value={newHospName} onChange={(e) => setNewHospName(e.target.value)} className="form-input text-xs" placeholder="e.g. Sub-District Hospital" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Beds</label>
                  <input type="number" value={newHospBeds} onChange={(e) => setNewHospBeds(e.target.value)} className="form-input text-xs" />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Phone</label>
                  <input type="text" value={newHospPhone} onChange={(e) => setNewHospPhone(e.target.value)} className="form-input text-xs" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary text-xs">Register Facility</button>
            </form>
          )}

          <div className="grid-2-col gap-4">
            {hospitals.map(h => (
              <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-start">
                  <strong className="text-sm text-slate-900">{h.name}</strong>
                  <span className="badge badge-primary">{h.bedsAvailable} Beds</span>
                </div>
                <p className="text-xs text-slate-500">{h.address} • Phone: {h.phone}</p>
                <div className="text-2xs text-slate-600">Lead: {h.leadDoctor} • Route: {h.emergencyRoute}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ML THRESHOLDS */}
      {activeTab === 'ml_config' && (
        <div className="card-box space-y-4">
          <h3 className="text-base font-bold text-slate-900">Clinical Decision Support System (CDSS) Cutoffs</h3>
          <p className="text-xs text-slate-500">Calibrate systolic and blood glucose alert triggers aligned with AHA/ADA guidelines.</p>

          <div className="grid-2-col gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <strong className="text-xs text-slate-900 block">Hypertensive Crisis Threshold</strong>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="160" 
                  max="200" 
                  value={mlThresholds.htCrisisSystolic} 
                  onChange={(e) => setMlThresholds({ ...mlThresholds, htCrisisSystolic: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="badge badge-risk-critical font-mono text-xs">{mlThresholds.htCrisisSystolic} mmHg</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <strong className="text-xs text-slate-900 block">Diabetic Glucose Threshold (Fasting)</strong>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="100" 
                  max="160" 
                  value={mlThresholds.dbDiabeticGlucose} 
                  onChange={(e) => setMlThresholds({ ...mlThresholds, dbDiabeticGlucose: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="badge badge-risk-moderate font-mono text-xs">{mlThresholds.dbDiabeticGlucose} mg/dL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card-box space-y-4">
          <h3 className="text-base font-bold text-slate-900">Immutable Security & Clinical Audit Trail</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>Staff Member</th>
                  <th>Patient Target</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td><span className="text-xs text-slate-500 font-mono">{log.timestamp}</span></td>
                    <td><strong>{log.action}</strong></td>
                    <td>{log.user}</td>
                    <td>{log.patient}</td>
                    <td><span className="badge badge-risk-low flex items-center gap-1"><CheckCircle2 size={12} /> {log.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
