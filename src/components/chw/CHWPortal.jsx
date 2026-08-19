import { useState } from 'react';
import {
  UserPlus, 
  BrainCircuit, 
  BookOpen, 
  Pill, 
  Hospital, 
  WifiOff, 
  Search, 
  AlertTriangle,
  Clock,
  CheckCircle2, 
  Plus,
  MapPin
} from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import GuidedScreeningWizard from './GuidedScreeningWizard';
import AIScreeningModal from './AIScreeningModal';
import ThinkLetsCounsellingModal from './ThinkLetsCounsellingModal';
import MedicationTrackerModal from './MedicationTrackerModal';
import OfflineSyncQueueModal from './OfflineSyncQueueModal';
import NearbyHospitalsMap from '../maps/NearbyHospitalsMap';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function CHWPortal({
  patients = [],
  onSavePatient,
  onDeletePatient,
  onUpdatePatientMedicines,
  onAddReport,
  onSaveCounsellingSession,
  onSaveReferral,
  isOffline,
  toggleOffline,
  offlineQueue = [],
  syncLogs = [],
  onSyncOfflineData,
  onRestoreBackup,
  userRole,
  globalSearch = '',
  activeSection = 'home',
  currentUser
}) {
  const activeTab = activeSection || 'home';
  const [filterRisk, setFilterRisk] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Modals & Drawers
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [showDetailPatient, setShowDetailPatient] = useState(null);
  const [showAIScreeningPatient, setShowAIScreeningPatient] = useState(null);
  const [showCounsellingPatient, setShowCounsellingPatient] = useState(null);
  const [showMedicationPatient, setShowMedicationPatient] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Compute Metrics
  const totalPatients = patients.length;
  const criticalPatients = patients.filter(p => (p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel) === 'Critical');
  const highRiskPatients = patients.filter(p => (p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel) === 'High');
  const needsAttentionList = [...criticalPatients, ...highRiskPatients];
  const pendingReferralCount = patients.filter(p => p.referral && p.referral.status === 'Pending').length;
  const followupsDueList = patients.filter(p => (p.evaluation?.followUpDays || p.evaluation?.overall?.followUpDays || 30) <= 7);

  const searchQuery = globalSearch || localSearch;

  const filteredPatients = patients.filter(p => {
    const risk = (p.evaluation?.overallRiskLevel || p.evaluation?.overall?.riskLevel || 'Low').toLowerCase();
    const matchesRisk = filterRisk === 'all' || risk === filterRisk.toLowerCase();
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return <span className="badge badge-risk-critical">Critical Risk</span>;
      case 'High': return <span className="badge badge-risk-high">High Risk</span>;
      case 'Moderate': return <span className="badge badge-risk-moderate">Moderate</span>;
      default: return <span className="badge badge-risk-low">Low Risk</span>;
    }
  };

  const handleOpenReferralForm = (patient) => {
    const hospName = 'District Memorial Community Hospital';
    const doctorName = 'Dr. Ananya Roy';
    const reason = patient.evaluation?.whyThisResult || 'Elevated chronic risk criteria requiring clinical consultation.';

    const referralObj = {
      status: 'Pending',
      hospitalName: hospName,
      doctorName: doctorName,
      urgency: patient.evaluation?.overallRiskLevel === 'Critical' ? 'Urgent' : 'Normal',
      reason: reason,
      dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    onSaveReferral(patient.id, referralObj);
  };

  return (
    <div className="portal-content-container space-y-6">
      {/* =============================================================
          1. CHW HOME: 5-SECOND "WHAT DO I NEED TO DO TODAY?"
          ============================================================= */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Header Card: Greeting + Primary Actions */}
          <div className="chw-workflow-header text-white flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-sky-300 text-xs font-semibold uppercase tracking-wider block">Frontline Field Dashboard</span>
              <h1 className="text-2xl font-bold mt-1 text-white">
                Good morning, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Sunita'}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Here is your clinical summary for today: <strong>{needsAttentionList.length} priority cases</strong> need follow-up or referral.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                className="btn btn-primary btn-lg shadow-md font-bold"
                onClick={() => setShowWizardModal(true)}
              >
                <Plus size={18} /> New Patient Screening
              </button>
            </div>
          </div>

          {/* Today's Overview: 4 Compact Metrics */}
          <div className="grid-4-col gap-4">
            <div className="metric-box border-l-4 border-l-sky-600">
              <span className="metric-label">Assigned Patients</span>
              <div className="metric-value">{totalPatients}</div>
              <span className="metric-sub">Active community cases</span>
            </div>

            <div className="metric-box border-l-4 border-l-rose-600">
              <span className="metric-label">Needs Attention</span>
              <div className="metric-value text-rose-700">{needsAttentionList.length}</div>
              <span className="metric-sub">{criticalPatients.length} Critical • {highRiskPatients.length} High</span>
            </div>

            <div className="metric-box border-l-4 border-l-amber-600">
              <span className="metric-label">Follow-ups Due</span>
              <div className="metric-value text-amber-700">{followupsDueList.length}</div>
              <span className="metric-sub">Within next 7 days</span>
            </div>

            <div className="metric-box border-l-4 border-l-indigo-600">
              <span className="metric-label">Pending Referrals</span>
              <div className="metric-value text-indigo-700">{pendingReferralCount}</div>
              <span className="metric-sub">Awaiting hospital review</span>
            </div>
          </div>

          {/* Core Focus Split: "Needs Attention" & "Today's Follow-ups" */}
          <div className="grid-2-col gap-6">
            {/* Needs Attention Panel */}
            <div className="card-box space-y-4">
              <div className="card-box-header">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" /> Needs Immediate Attention
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">High or critical risk patients requiring clinical review</p>
                </div>
                <span className="badge badge-risk-critical font-mono">{needsAttentionList.length} flagged</span>
              </div>

              <div className="space-y-2.5">
                {needsAttentionList.length > 0 ? (
                  needsAttentionList.slice(0, 4).map(p => (
                    <div 
                      key={p.id} 
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center cursor-pointer"
                      onClick={() => setShowDetailPatient(p)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900">{p.name}</strong>
                          <span className="text-xs text-slate-400 font-mono">({p.id})</span>
                          {getRiskBadge(p.evaluation?.overallRiskLevel || 'High')}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          BP <strong>{p.systolic}/{p.diastolic}</strong> mmHg • Glucose <strong>{p.glucose}</strong> mg/dL • {p.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn btn-secondary text-xs"
                          onClick={() => setShowDetailPatient(p)}
                        >
                          Details
                        </button>
                        <button 
                          className="btn btn-primary text-xs"
                          onClick={() => handleOpenReferralForm(p)}
                        >
                          Refer
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state py-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                    No urgent attention cases today. All high-risk patients are managed.
                  </div>
                )}
              </div>
            </div>

            {/* Today's Follow-up Schedule & Tools */}
            <div className="space-y-6">
              <div className="card-box space-y-4">
                <div className="card-box-header">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock size={18} className="text-sky-600" /> Upcoming Follow-ups
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Recalls due based on clinical guidelines</p>
                  </div>
                  <span className="badge badge-primary">{followupsDueList.length} Due</span>
                </div>

                <div className="space-y-2.5">
                  {followupsDueList.length > 0 ? (
                    followupsDueList.slice(0, 3).map(p => (
                      <div key={p.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                          <strong className="text-sm text-slate-900">{p.name}</strong>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Due in <strong>{p.evaluation?.followUpDays || 7} days</strong> • {p.phone}
                          </div>
                        </div>
                        <button 
                          className="btn btn-secondary text-xs"
                          onClick={() => setShowDetailPatient(p)}
                        >
                          Start Visit
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">No follow-ups due today.</p>
                  )}
                </div>
              </div>

              {/* Contextual field tool not already exposed by the sidebar */}
              <div>
                <button 
                  className="field-tool-card w-full"
                  onClick={() => setShowMapModal(true)}
                >
                  <Hospital size={20} className="text-indigo-600 mb-1" />
                  <strong className="text-sm text-slate-900">Hospital Bed Map</strong>
                  <span className="text-xs text-slate-500">Nearest facility emergency routes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          2. DEDICATED PATIENTS DIRECTORY
          ============================================================= */}
      {activeTab === 'patients' && (
        <div className="card-box space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Directory</h2>
              <p className="text-xs text-slate-500">Search and manage electronic health records for community patients.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="search-bar-sm">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name, ID, village..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)} 
                className="form-input text-xs w-36"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical Risk</option>
                <option value="high">High Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <button 
                className="btn btn-primary text-xs"
                onClick={() => { setSelectedPatientForEdit(null); setShowRegisterModal(true); }}
              >
                <UserPlus size={14} /> Register Patient
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient Name & ID</th>
                  <th>Age / Gender</th>
                  <th>Clinical Risk</th>
                  <th>Last Screening (Vitals)</th>
                  <th>Next Follow-up</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => {
                    const evalData = p.evaluation || {};
                    const risk = evalData.overallRiskLevel || evalData.overall?.riskLevel || 'Low';
                    const followDays = evalData.followUpDays || evalData.overall?.followUpDays || 30;

                    return (
                      <tr 
                        key={p.id}
                        onClick={() => setShowDetailPatient(p)}
                        className="cursor-pointer"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="patient-avatar-sm">{p.name.charAt(0)}</div>
                            <div>
                              <strong className="text-sm text-slate-900 hover:text-sky-600 block">{p.name}</strong>
                              <span className="text-xs text-slate-400 font-mono">ID: {p.id} • {p.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs text-slate-700">{p.age} yrs</span>
                          <span className="text-xs text-slate-400 block uppercase">{p.gender}</span>
                        </td>

                        <td>
                          {getRiskBadge(risk)}
                        </td>

                        <td>
                          <div className="text-xs font-semibold text-slate-800">
                            BP {p.systolic}/{p.diastolic} mmHg
                          </div>
                          <div className="text-xs text-slate-500">
                            Glucose: {p.glucose} mg/dL
                          </div>
                        </td>

                        <td>
                          <span className="text-xs text-slate-700 font-medium">In {followDays} days</span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary text-xs"
                            onClick={(e) => { e.stopPropagation(); setShowDetailPatient(p); }}
                          >
                            View Record
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'screening' && (
        <section className="card-box space-y-4" aria-labelledby="screening-heading">
          <div className="card-box-header">
            <div>
              <h2 id="screening-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><BrainCircuit size={19} className="text-sky-600" /> Guided Clinical Screening</h2>
              <p className="text-xs text-slate-500 mt-1">Start a seven-step screening for a new or returning community patient.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowWizardModal(true)}><Plus size={16} /> Start new screening</button>
          </div>
          <div className="grid-3-col gap-4">
            {patients.slice(0, 6).map((patient) => (
              <article key={patient.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div><strong className="text-sm text-slate-900 block">{patient.name}</strong><span className="text-xs text-slate-500">{patient.id} · {patient.age} years</span></div>
                  {getRiskBadge(patient.evaluation?.overallRiskLevel || 'Low')}
                </div>
                <button type="button" className="btn btn-secondary text-xs w-full" onClick={() => setShowAIScreeningPatient(patient)}>Review latest assessment</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'counselling' && (
        <section className="card-box space-y-4" aria-labelledby="counselling-heading">
          <div className="card-box-header">
            <div>
              <h2 id="counselling-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><BookOpen size={19} className="text-emerald-600" /> ThinkLets Counselling</h2>
              <p className="text-xs text-slate-500 mt-1">Choose a patient and launch the guided lifestyle counselling protocol.</p>
            </div>
            <span className="badge badge-primary">{patients.length} eligible patients</span>
          </div>
          <div className="grid-3-col gap-4">
            {patients.map((patient) => (
              <article key={patient.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <strong className="text-sm text-slate-900 block">{patient.name}</strong>
                <span className="text-xs text-slate-500 block mt-1">{patient.id} · {patient.address}</span>
                <button type="button" className="btn btn-primary text-xs w-full mt-4" onClick={() => setShowCounsellingPatient(patient)}>Begin counselling</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'medications' && (
        <section className="card-box space-y-4" aria-labelledby="medications-heading">
          <div className="card-box-header">
            <div>
              <h2 id="medications-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><Pill size={19} className="text-indigo-600" /> Medication Tracking</h2>
              <p className="text-xs text-slate-500 mt-1">Review active orders and record patient adherence.</p>
            </div>
          </div>
          <div className="grid-3-col gap-4">
            {patients.map((patient) => (
              <article key={patient.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start gap-3"><div><strong className="text-sm text-slate-900 block">{patient.name}</strong><span className="text-xs text-slate-500">{(patient.medicines || []).length} active medicines</span></div>{getRiskBadge(patient.evaluation?.overallRiskLevel || 'Low')}</div>
                <button type="button" className="btn btn-secondary text-xs w-full" onClick={() => setShowMedicationPatient(patient)}>Open medication tracker</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'offline' && (
        <section className="card-box space-y-4" aria-labelledby="offline-heading">
          <div className="card-box-header">
            <div>
              <h2 id="offline-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2"><WifiOff size={19} className="text-amber-600" /> Offline Data & Synchronization</h2>
              <p className="text-xs text-slate-500 mt-1">Review locally queued screenings and synchronization history.</p>
            </div>
            <span className={`badge ${isOffline ? 'badge-risk-high' : 'badge-risk-low'}`}>{isOffline ? 'Offline mode' : 'Cloud connected'}</span>
          </div>
          <div className="grid-3-col gap-4">
            <div className="metric-box"><span className="metric-label">Queued records</span><div className="metric-value">{offlineQueue.length}</div><span className="metric-sub">Waiting for upload</span></div>
            <div className="metric-box"><span className="metric-label">Sync events</span><div className="metric-value">{syncLogs.length}</div><span className="metric-sub">Recorded on this device</span></div>
            <div className="metric-box"><span className="metric-label">Connection</span><div className="metric-value text-base">{isOffline ? 'Local only' : 'Synchronized'}</div><span className="metric-sub">Patient data remains available</span></div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button type="button" className="btn btn-secondary" onClick={toggleOffline}>{isOffline ? 'Restore cloud connection' : 'Simulate offline mode'}</button>
            <button type="button" className="btn btn-primary" onClick={() => setShowSyncModal(true)}>Open sync manager</button>
          </div>
        </section>
      )}

      {/* =============================================================
          3. FOLLOW-UPS TAB
          ============================================================= */}
      {activeTab === 'followups' && (
        <div className="card-box space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Follow-up Schedule</h2>
            <p className="text-xs text-slate-500">Prioritized timeline for community household re-screenings.</p>
          </div>

          <div className="grid-3-col gap-4">
            {patients.map(p => {
              const days = p.evaluation?.followUpDays || p.evaluation?.overall?.followUpDays || 30;
              const risk = p.evaluation?.overallRiskLevel || 'Low';
              return (
                <div key={p.id} className="card-box p-4 border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-sm text-slate-900">{p.name}</strong>
                      {getRiskBadge(risk)}
                    </div>
                    <p className="text-xs text-slate-500">{p.phone} • {p.address}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock size={14} className="text-sky-600" /> Due in {days} days
                    </span>
                    <button className="btn btn-primary text-xs" onClick={() => setShowDetailPatient(p)}>
                      Start Visit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =============================================================
          4. HOSPITAL REFERRALS TAB
          ============================================================= */}
      {activeTab === 'referrals' && (
        <div className="card-box space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hospital Referral Pipeline</h2>
              <p className="text-xs text-slate-500">Track referrals generated to secondary and district hospitals.</p>
            </div>
            <button className="btn btn-secondary text-xs" onClick={() => setShowMapModal(true)}>
              <MapPin size={14} /> Hospital Bed Map
            </button>
          </div>

          <div className="grid-2-col gap-4">
            {patients.filter(p => p.referral).map(p => (
              <div key={p.id} className="card-box p-4 border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{p.name} ({p.id})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Facility: <strong>{p.referral?.hospitalName}</strong></p>
                  </div>
                  <span className={`badge ${p.referral?.status === 'Approved' ? 'badge-risk-low' : 'badge-risk-moderate'}`}>
                    {p.referral?.status}
                  </span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700">
                  <strong>Referral Reason:</strong> {p.referral?.reason}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Generated: {p.referral?.dateGenerated}</span>
                  <button className="btn btn-secondary text-xs" onClick={() => setShowDetailPatient(p)}>
                    View Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS & DRAWERS */}
      {showRegisterModal && (
        <PatientRegistrationModal 
          onClose={() => setShowRegisterModal(false)}
          onSavePatient={onSavePatient}
          initialData={selectedPatientForEdit}
        />
      )}

      {showWizardModal && (
        <GuidedScreeningWizard 
          patients={patients}
          onSavePatient={onSavePatient}
          onOpenCounselling={(p) => { setShowWizardModal(false); setShowCounsellingPatient(p); }}
          onOpenReferral={(p) => { setShowWizardModal(false); handleOpenReferralForm(p); }}
          onClose={() => setShowWizardModal(false)}
        />
      )}

      {showDetailPatient && (
        <PatientDetailModal 
          patient={showDetailPatient}
          onClose={() => setShowDetailPatient(null)}
          onOpenAIScreening={(p) => { setShowDetailPatient(null); setShowAIScreeningPatient(p); }}
          onOpenCounselling={(p) => { setShowDetailPatient(null); setShowCounsellingPatient(p); }}
          onOpenReferral={(p) => { setShowDetailPatient(null); handleOpenReferralForm(p); }}
          onOpenMedicationModal={(p) => { setShowDetailPatient(null); setShowMedicationPatient(p); }}
          onDeletePatient={(id) => { onDeletePatient(id); setShowDetailPatient(null); }}
          onAddReport={onAddReport}
          userRole={userRole}
        />
      )}

      {showAIScreeningPatient && (
        <AIScreeningModal 
          patient={showAIScreeningPatient}
          onClose={() => setShowAIScreeningPatient(null)}
          onOpenReferral={(p) => { setShowAIScreeningPatient(null); handleOpenReferralForm(p); }}
        />
      )}

      {showCounsellingPatient && (
        <ThinkLetsCounsellingModal 
          patient={showCounsellingPatient}
          onClose={() => setShowCounsellingPatient(null)}
          onSaveCounsellingSession={onSaveCounsellingSession}
        />
      )}

      {showMedicationPatient && (
        <MedicationTrackerModal 
          patient={showMedicationPatient}
          onClose={() => setShowMedicationPatient(null)}
          onUpdatePatientMedicines={onUpdatePatientMedicines}
        />
      )}

      {showSyncModal && (
        <OfflineSyncQueueModal 
          onClose={() => setShowSyncModal(false)}
          offlineQueue={offlineQueue}
          syncLogs={syncLogs}
          onSyncOfflineData={onSyncOfflineData}
          patients={patients}
          onRestoreBackup={onRestoreBackup}
        />
      )}

      {showMapModal && (
        <NearbyHospitalsMap 
          onClose={() => setShowMapModal(false)}
          onSelectHospitalForReferral={() => {
            setShowMapModal(false);
          }}
        />
      )}
    </div>
  );
}
