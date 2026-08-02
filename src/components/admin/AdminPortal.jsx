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
  Activity 
} from 'lucide-react';
import { INITIAL_HOSPITALS, INITIAL_CHWS, INITIAL_DOCTORS, INITIAL_AUDIT_LOGS, INITIAL_PATIENTS } from '../../data/initialData';

export default function AdminPortal({ auditLogs = INITIAL_AUDIT_LOGS, patients = INITIAL_PATIENTS }) {
  const [activeTab, setActiveTab] = useState('analytics');
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

  // FHIR R4 Collection Bundle Exporter
  const handleExportFHIR = () => {
    const targetPatients = Array.isArray(patients) && patients.length > 0 ? patients : INITIAL_PATIENTS;
    const fhirEntries = targetPatients.flatMap(p => {
      // 1. Patient Resource
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

      // 2. BP Observation Resource
      const bpObservation = {
        fullUrl: `urn:uuid:obs-bp-${p.id}`,
        resource: {
          resourceType: "Observation",
          id: `obs-bp-${p.id}`,
          status: "final",
          category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
          code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }] },
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

      // 3. Glucose Observation Resource
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
  };

  const handleAddHospital = (e) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    const hospObj = {
      id: 'HOSP-' + Math.floor(100 + Math.random() * 900),
      name: newHospName,
      type: 'Community Health Center',
      address: 'Sector Health Zone',
      phone: newHospPhone,
      distanceKm: 5.0,
      emergencyRoute: 'Direct Sub-District Corridor',
      bedsAvailable: parseInt(newHospBeds),
      specialties: ['General Medicine', 'Diabetes Care'],
      leadDoctor: 'Dr. Clinical Lead',
      latitude: 18.52,
      longitude: 73.85
    };

    setHospitals(prev => [...prev, hospObj]);
    setNewHospName('');
    setShowAddHospital(false);
  };

  return (
    <div className="portal-container">
      {/* Top Banner */}
      <div className="portal-header-banner bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="portal-badge-icon bg-purple-500/20 text-purple-400">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="portal-title">Administrator System Portal</h1>
            <p className="portal-subtitle">Manage User Roles, Hospital Infrastructure, ML Model Rules & System Audit Logs</p>
          </div>
        </div>
        <button 
          className="btn btn-primary text-xs flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md"
          onClick={handleExportFHIR}
          title="Export Patient & Clinical Data to HL7 FHIR R4 JSON standard format"
        >
          <Database size={16} /> Export FHIR R4 JSON
        </button>
      </div>

      {/* Tabs */}
      <div className="detail-tabs mt-4">
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📊 System Monitoring & District Analytics
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 User & Role Management
        </button>
        <button className={`tab-btn ${activeTab === 'hospitals' ? 'active' : ''}`} onClick={() => setActiveTab('hospitals')}>
          🏥 Hospital Registry Management
        </button>
        <button className={`tab-btn ${activeTab === 'ml_config' ? 'active' : ''}`} onClick={() => setActiveTab('ml_config')}>
          ⚙️ AI Model Threshold Configuration
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          🔒 System Audit & Access Logs
        </button>
      </div>

      <div className="tab-content mt-4">
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* System KPIs Grid */}
            <div className="grid-4-col gap-3">
              <div className="card-box bg-slate-900 border-indigo-800">
                <span className="text-2xs uppercase text-slate-400 font-semibold">Total Registered Patients</span>
                <div className="text-2xl font-extrabold text-white mt-1">{(patients || INITIAL_PATIENTS).length}</div>
                <span className="text-2xs text-emerald-400">↑ 2 Registrations Today</span>
              </div>
              <div className="card-box bg-slate-900 border-indigo-800">
                <span className="text-2xs uppercase text-slate-400 font-semibold">Active CHWs & Doctors</span>
                <div className="text-2xl font-extrabold text-white mt-1">{chwUsers.length + doctorUsers.length}</div>
                <span className="text-2xs text-sky-400">{chwUsers.length} CHWs • {doctorUsers.length} Doctors</span>
              </div>
              <div className="card-box bg-slate-900 border-rose-800">
                <span className="text-2xs uppercase text-slate-400 font-semibold">High Risk Cases & Referrals</span>
                <div className="text-2xl font-extrabold text-rose-400 mt-1">1 Critical</div>
                <span className="text-2xs text-slate-400">1 Pending • 2 Completed</span>
              </div>
              <div className="card-box bg-slate-900 border-emerald-800">
                <span className="text-2xs uppercase text-slate-400 font-semibold">Follow-up Compliance & Health</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">94.2%</div>
                <span className="text-2xs text-emerald-300">0 Offline Devices Waiting Sync</span>
              </div>
            </div>

            {/* District Analytics & Disease Statistics */}
            <div className="grid-2-col gap-4">
              <div className="card-box bg-secondary">
                <h3 className="text-sm font-bold text-white mb-2">District-wise Coverage & Performance</h3>
                <div className="space-y-2 text-xs">
                  <div className="card-box bg-slate-900 border-slate-800 flex justify-between">
                    <div>
                      <strong className="text-white">Vimanapura Sector 3</strong>
                      <div className="text-2xs text-slate-400">CHW: Sunita Patil</div>
                    </div>
                    <span className="badge badge-success text-2xs">3 Patients • 100% Synced</span>
                  </div>
                  <div className="card-box bg-slate-900 border-slate-800 flex justify-between">
                    <div>
                      <strong className="text-white">Health Zone East</strong>
                      <div className="text-2xs text-slate-400">CHW: Rajesh Kumar</div>
                    </div>
                    <span className="badge badge-success text-2xs">2 Patients • 100% Synced</span>
                  </div>
                </div>
              </div>

              <div className="card-box bg-secondary">
                <h3 className="text-sm font-bold text-white mb-2">Disease Distribution Analytics</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Hypertension Risk (Stage 1 & 2)</span>
                      <span className="font-bold text-sky-400">60% (3 Patients)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-3/5"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Diabetes & High Glucose</span>
                      <span className="font-bold text-indigo-400">40% (2 Patients)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="card-box bg-secondary">
              <h3 className="text-sm font-bold text-white mb-3">Community Health Workers (CHWs)</h3>
              <div className="grid-3-col gap-3">
                {chwUsers.map(u => (
                  <div key={u.id} className="card-box bg-slate-900 border-slate-700">
                    <strong className="text-white text-sm">{u.name}</strong>
                    <div className="text-2xs text-gray-400 mt-1">{u.zone} • {u.phone}</div>
                    <span className="badge badge-primary text-2xs mt-2">Role: CHW</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-box bg-secondary">
              <h3 className="text-sm font-bold text-white mb-3">Assigned Doctors & Clinicians</h3>
              <div className="grid-3-col gap-3">
                {doctorUsers.map(d => (
                  <div key={d.id} className="card-box bg-slate-900 border-slate-700">
                    <strong className="text-white text-sm">{d.name}</strong>
                    <div className="text-2xs text-gray-400 mt-1">{d.specialty} • {d.hospital}</div>
                    <span className="badge badge-success text-2xs mt-2">Role: Doctor</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="card-box bg-secondary">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Registered Healthcare Facilities & Hospitals</h3>
              <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => setShowAddHospital(!showAddHospital)}>
                <Plus size={14} /> Add New Hospital
              </button>
            </div>

            {showAddHospital && (
              <form onSubmit={handleAddHospital} className="card-box bg-slate-900 mb-4 border-indigo-500">
                <h4 className="text-xs font-bold text-indigo-400 mb-2">Register Hospital</h4>
                <div className="grid-3-col gap-2">
                  <div className="form-group">
                    <label>Hospital Name</label>
                    <input type="text" value={newHospName} onChange={(e) => setNewHospName(e.target.value)} className="form-input text-xs" required />
                  </div>
                  <div className="form-group">
                    <label>Available Beds</label>
                    <input type="number" value={newHospBeds} onChange={(e) => setNewHospBeds(e.target.value)} className="form-input text-xs" required />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input type="text" value={newHospPhone} onChange={(e) => setNewHospPhone(e.target.value)} className="form-input text-xs" required />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowAddHospital(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary text-xs">Save Hospital</button>
                </div>
              </form>
            )}

            <div className="grid-3-col gap-3">
              {hospitals.map(h => (
                <div key={h.id} className="card-box bg-slate-900 border-slate-700">
                  <h4 className="font-bold text-white text-sm">{h.name}</h4>
                  <div className="text-2xs text-gray-400 mt-1">{h.type} • {h.address}</div>
                  <div className="text-xs text-emerald-400 mt-2 font-bold">{h.bedsAvailable} Beds Available</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ml_config' && (
          <div className="card-box bg-secondary">
            <h3 className="text-sm font-bold text-white mb-2">Machine Learning Decision Rule Tuning</h3>
            <p className="text-xs text-gray-400 mb-4">Adjust clinical thresholds used by Random Forest, Logistic Regression, and Decision Tree engines.</p>

            <div className="grid-2-col gap-4">
              <div className="card-box bg-slate-900 border-slate-700">
                <h4 className="text-xs font-bold text-rose-400 mb-2">Hypertension Risk Boundaries</h4>
                <div className="form-group">
                  <label className="text-2xs text-gray-300">Crisis Systolic Cutoff (mmHg)</label>
                  <input 
                    type="number" 
                    value={mlThresholds.htCrisisSystolic} 
                    onChange={(e) => setMlThresholds({ ...mlThresholds, htCrisisSystolic: parseInt(e.target.value) })}
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group mt-2">
                  <label className="text-2xs text-gray-300">Stage 2 Systolic Cutoff (mmHg)</label>
                  <input 
                    type="number" 
                    value={mlThresholds.htStage2Systolic} 
                    onChange={(e) => setMlThresholds({ ...mlThresholds, htStage2Systolic: parseInt(e.target.value) })}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="card-box bg-slate-900 border-slate-700">
                <h4 className="text-xs font-bold text-amber-400 mb-2">Diabetes Risk Boundaries</h4>
                <div className="form-group">
                  <label className="text-2xs text-gray-300">Severe Hyperglycemia Glucose Cutoff (mg/dL)</label>
                  <input 
                    type="number" 
                    value={mlThresholds.dbCriticalGlucose} 
                    onChange={(e) => setMlThresholds({ ...mlThresholds, dbCriticalGlucose: parseInt(e.target.value) })}
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group mt-2">
                  <label className="text-2xs text-gray-300">Fasting Diabetic Threshold (mg/dL)</label>
                  <input 
                    type="number" 
                    value={mlThresholds.dbDiabeticGlucose} 
                    onChange={(e) => setMlThresholds({ ...mlThresholds, dbDiabeticGlucose: parseInt(e.target.value) })}
                    className="form-input text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="card-box bg-secondary">
            <h3 className="text-sm font-bold text-white mb-3">System Security & Audit Activity Trail</h3>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="card-box bg-slate-900 border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono text-indigo-400 font-bold mr-2">{log.id}</span>
                    <strong className="text-white">{log.user}</strong> ({log.role})
                    <p className="text-gray-300 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-neutral">{log.action}</span>
                    <div className="text-2xs text-gray-500 mt-1">{log.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
