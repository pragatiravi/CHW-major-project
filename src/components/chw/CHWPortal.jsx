import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  BrainCircuit, 
  BookOpen, 
  Pill, 
  Hospital, 
  Navigation, 
  WifiOff, 
  RefreshCw, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  Heart, 
  Activity, 
  Clock 
} from 'lucide-react';
import PatientRegistrationModal from './PatientRegistrationModal';
import AIScreeningModal from './AIScreeningModal';
import ThinkLetsCounsellingModal from './ThinkLetsCounsellingModal';
import MedicationTrackerModal from './MedicationTrackerModal';
import OfflineSyncQueueModal from './OfflineSyncQueueModal';
import NearbyHospitalsMap from '../maps/NearbyHospitalsMap';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function CHWPortal({
  patients,
  onSavePatient,
  onDeletePatient,
  onUpdatePatientMedicines,
  onAddReport,
  onSaveCounsellingSession,
  onSaveReferral,
  isOffline,
  toggleOffline,
  offlineQueue,
  syncLogs,
  onSyncOfflineData,
  onRestoreBackup,
  userRole,
  globalSearch
}) {
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'followups', 'referrals'
  const [filterRisk, setFilterRisk] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Active Modals State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [showDetailPatient, setShowDetailPatient] = useState(null);
  const [showAIScreeningPatient, setShowAIScreeningPatient] = useState(null);
  const [showCounsellingPatient, setShowCounsellingPatient] = useState(null);
  const [showMedicationPatient, setShowMedicationPatient] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showReferralPatient, setShowReferralPatient] = useState(null);

  // Compute Dashboard Metrics
  const totalPatients = patients.length;
  const criticalCount = patients.filter(p => p.evaluation?.overall?.riskLevel === 'Critical').length;
  const highRiskCount = patients.filter(p => p.evaluation?.overall?.riskLevel === 'High').length;
  const pendingReferralCount = patients.filter(p => p.referral && p.referral.status === 'Pending').length;
  const followupsToday = patients.filter(p => (p.evaluation?.overall?.followUpDays || 30) <= 7).length;

  const searchQuery = globalSearch || localSearch;

  const filteredPatients = patients.filter(p => {
    const matchesRisk = filterRisk === 'all' || p.evaluation?.overall?.riskLevel?.toLowerCase() === filterRisk.toLowerCase();
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const getRiskClass = (level) => {
    switch (level) {
      case 'Critical': return 'badge-risk-critical';
      case 'High': return 'badge-risk-high';
      case 'Moderate': return 'badge-risk-moderate';
      default: return 'badge-risk-low';
    }
  };

  const handleOpenReferralForm = (patient) => {
    const hospName = 'District Memorial Community Hospital';
    const doctorName = 'Dr. Ananya Roy';
    const reason = patient.evaluation?.overall?.referralReason || 'Elevated chronic disease risk criteria.';

    const referralObj = {
      status: 'Pending',
      hospitalName: hospName,
      doctorName: doctorName,
      urgency: patient.evaluation?.overall?.referralUrgency || 'Normal',
      reason: reason,
      dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    onSaveReferral(patient.id, referralObj);
    alert(`Hospital Referral generated for ${patient.name} to ${hospName}!`);
  };

  return (
    <div className="portal-container">
      {/* Top Banner & Quick Stat Cards */}
      <div className="portal-header-banner bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="portal-badge-icon bg-blue-500/20 text-blue-400">
              <Users size={28} />
            </div>
            <div>
              <h1 className="portal-title">Community Health Worker (CHW) Field Portal</h1>
              <p className="portal-subtitle">AI Screening, Offline Data Sync, ThinkLets Counselling & Follow-up Care</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary flex items-center gap-1.5 shadow-lg" onClick={() => { setSelectedPatientForEdit(null); setShowRegisterModal(true); }}>
              <UserPlus size={18} /> Register Patient
            </button>
            <button className="btn btn-secondary flex items-center gap-1.5" onClick={() => setShowSyncModal(true)}>
              <WifiOff size={16} /> Sync Queue ({offlineQueue.length})
            </button>
            <button className="btn btn-secondary flex items-center gap-1.5" onClick={() => setShowMapModal(true)}>
              <Navigation size={16} /> Hospital Map
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-5-col gap-3 mt-4">
        <div className="metric-box border-l-4 border-indigo-500">
          <span className="metric-label">Total Registered Patients</span>
          <div className="metric-value text-indigo-400 mt-1">{totalPatients}</div>
          <span className="metric-sub">Active Field Cases</span>
        </div>

        <div className="metric-box border-l-4 border-rose-500">
          <span className="metric-label">High / Critical Risk Cases</span>
          <div className="metric-value text-rose-400 mt-1">{criticalCount + highRiskCount}</div>
          <span className="metric-sub">{criticalCount} Critical • {highRiskCount} High</span>
        </div>

        <div className="metric-box border-l-4 border-amber-500">
          <span className="metric-label">Follow-ups Due This Week</span>
          <div className="metric-value text-amber-400 mt-1">{followupsToday}</div>
          <span className="metric-sub">Scheduled Visits</span>
        </div>

        <div className="metric-box border-l-4 border-blue-500">
          <span className="metric-label">Pending Hospital Referrals</span>
          <div className="metric-value text-blue-400 mt-1">{pendingReferralCount}</div>
          <span className="metric-sub">Awaiting Doctor Review</span>
        </div>

        <div className="metric-box border-l-4 border-emerald-500">
          <span className="metric-label">Local Offline Queue</span>
          <div className="metric-value text-emerald-400 mt-1">{offlineQueue.length}</div>
          <span className="metric-sub">{isOffline ? 'Offline Mode Active' : 'Synced Cloud DB'}</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters */}
      <div className="flex justify-between items-center mt-4">
        <div className="detail-tabs">
          <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            👥 Patient Directory ({filteredPatients.length})
          </button>
          <button className={`tab-btn ${activeTab === 'followups' ? 'active' : ''}`} onClick={() => setActiveTab('followups')}>
            📅 Follow-up Schedule
          </button>
          <button className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`} onClick={() => setActiveTab('referrals')}>
            🏥 Hospital Referrals
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="search-bar-sm">
            <Search size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patients..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="form-input text-xs w-36">
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Risk</option>
            <option value="high">High Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="tab-content mt-3">
        {activeTab === 'patients' && (
          <div className="card-box bg-secondary">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient Name & ID</th>
                    <th>Age / Gender</th>
                    <th>Vitals (BP & Glucose)</th>
                    <th>Symptoms</th>
                    <th>AI Risk Assessment</th>
                    <th>Sync Status</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => {
                      const evalData = p.evaluation || {};
                      const overall = evalData.overall || {};

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="patient-avatar-sm">{p.name.charAt(0)}</div>
                              <div>
                                <strong className="text-white text-sm cursor-pointer hover:text-indigo-400" onClick={() => setShowDetailPatient(p)}>
                                  {p.name}
                                </strong>
                                <div className="text-2xs text-gray-400">ID: {p.id} • {p.phone}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="text-xs text-gray-300">{p.age} yrs</span>
                            <div className="text-2xs text-gray-400">{p.gender.toUpperCase()}</div>
                          </td>

                          <td>
                            <div className="text-xs text-indigo-400 font-bold">{p.systolic}/{p.diastolic} <span className="text-2xs text-gray-400">mmHg</span></div>
                            <div className="text-2xs text-amber-400">{p.glucose} mg/dL ({p.glucoseType})</div>
                          </td>

                          <td>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.symptoms && p.symptoms.length > 0 ? (
                                p.symptoms.slice(0, 2).map(s => <span key={s} className="tag-pill text-2xs">{s.replace('_', ' ')}</span>)
                              ) : (
                                <span className="text-2xs text-gray-500">None</span>
                              )}
                              {p.symptoms && p.symptoms.length > 2 && <span className="text-2xs text-gray-400">+{p.symptoms.length - 2}</span>}
                            </div>
                          </td>

                          <td>
                            <span className={`risk-badge ${getRiskClass(overall.riskLevel)}`}>
                              {overall.riskLevel || 'Low'}
                            </span>
                            <div className="text-2xs text-gray-400 mt-0.5">
                              HTN: {evalData.hypertension?.riskScore}% • DB: {evalData.diabetes?.riskScore}%
                            </div>
                          </td>

                          <td>
                            <span className="badge badge-success text-2xs flex items-center gap-1">
                              <CheckCircle size={10} /> {p.syncStatus || 'synced'}
                            </span>
                          </td>

                          <td>
                            <div className="flex gap-1">
                              <button className="btn-icon-xs text-indigo-400" title="Inspect Detail" onClick={() => setShowDetailPatient(p)}>
                                <Eye size={14} />
                              </button>
                              <button className="btn-icon-xs text-purple-400" title="Run AI Screening" onClick={() => setShowAIScreeningPatient(p)}>
                                <BrainCircuit size={14} />
                              </button>
                              <button className="btn-icon-xs text-emerald-400" title="ThinkLets Counselling" onClick={() => setShowCounsellingPatient(p)}>
                                <BookOpen size={14} />
                              </button>
                              <button className="btn-icon-xs text-amber-400" title="Prescriptions" onClick={() => setShowMedicationPatient(p)}>
                                <Pill size={14} />
                              </button>
                              <button className="btn-icon-xs text-blue-400" title="Generate Referral" onClick={() => handleOpenReferralForm(p)}>
                                <Hospital size={14} />
                              </button>
                              <button className="btn-icon-xs text-gray-400" title="Edit Patient" onClick={() => { setSelectedPatientForEdit(p); setShowRegisterModal(true); }}>
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">
                        No patients matched the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="card-box bg-secondary">
            <h3 className="text-sm font-bold text-white mb-3">Scheduled Follow-Up Visits Calendar</h3>
            <div className="grid-3-col gap-3">
              {patients.map(p => {
                const days = p.evaluation?.overall?.followUpDays || 30;
                return (
                  <div key={p.id} className="card-box bg-slate-900 border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm">{p.name}</strong>
                        <div className="text-2xs text-gray-400">ID: {p.id}</div>
                      </div>
                      <span className={`badge badge-${p.evaluation?.overall?.riskLevel?.toLowerCase()}`}>
                        {p.evaluation?.overall?.riskLevel}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> Due in {days} Days
                      </span>
                      <button className="btn btn-primary text-2xs" onClick={() => setShowDetailPatient(p)}>
                        Start Visit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="card-box bg-secondary">
            <h3 className="text-sm font-bold text-white mb-3">Hospital Referral Pipeline</h3>
            <div className="grid-2-col gap-4">
              {patients.filter(p => p.referral).map(p => (
                <div key={p.id} className="card-box bg-slate-900 border-indigo-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <p className="text-2xs text-gray-400">Target Hospital: <strong>{p.referral?.hospitalName}</strong></p>
                    </div>
                    <span className={`badge ${p.referral?.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                      {p.referral?.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 mt-2 bg-slate-950 p-2 rounded border border-slate-800">
                    Reason: {p.referral?.reason}
                  </p>

                  <div className="flex justify-between items-center mt-3 text-2xs text-gray-400">
                    <span>Issued: {p.referral?.dateGenerated}</span>
                    <button className="btn btn-secondary text-2xs" onClick={() => setShowDetailPatient(p)}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialogs */}
      {showRegisterModal && (
        <PatientRegistrationModal 
          onClose={() => setShowRegisterModal(false)}
          onSavePatient={onSavePatient}
          initialData={selectedPatientForEdit}
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
          onSelectHospitalForReferral={(hosp) => {
            alert(`Selected hospital: ${hosp.name}`);
            setShowMapModal(false);
          }}
        />
      )}
    </div>
  );
}
