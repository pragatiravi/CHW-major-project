import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Hospital, 
  BrainCircuit, 
  Pill, 
  User, 
  AlertTriangle, 
  FileText, 
  Search, 
  Calendar 
} from 'lucide-react';

export default function DoctorPortal({
  patients,
  onApproveReferral,
  onRejectReferral,
  onOpenPatientDetail,
  onOpenMedicationModal
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const referredPatients = patients.filter(p => p.referral);
  const pendingReferrals = referredPatients.filter(p => p.referral && p.referral.status === 'Pending');
  const approvedReferrals = referredPatients.filter(p => p.referral && p.referral.status === 'Approved');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || pendingReferrals[0] || approvedReferrals[0];

  const filteredList = (activeTab === 'pending' ? pendingReferrals : approvedReferrals).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (patientId) => {
    onApproveReferral(patientId, doctorNotes || 'Approved by attending clinician. Treatment plan initiated.');
    setDoctorNotes('');
  };

  const handleReject = (patientId) => {
    onRejectReferral(patientId, doctorNotes || 'Referral reviewed. Managed under primary community care.');
    setDoctorNotes('');
  };

  return (
    <div className="portal-container">
      {/* Top Banner */}
      <div className="portal-header-banner bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="portal-badge-icon bg-indigo-500/20 text-indigo-400">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="portal-title">Doctor Portal & Clinical Consultation</h1>
            <p className="portal-subtitle">Review AI Risk Predictions, Approve CHW Hospital Referrals & Update Patient Treatment Plans</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="stat-pill">
            <span className="stat-num text-amber-400">{pendingReferrals.length}</span>
            <span className="stat-lbl">Pending Referrals</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num text-emerald-400">{approvedReferrals.length}</span>
            <span className="stat-lbl">Approved Patients</span>
          </div>
        </div>
      </div>

      {/* Main Doctor Workspace Layout */}
      <div className="grid-3-7-col gap-4 mt-4">
        {/* Left Column: Referrals Queue List */}
        <div className="card-box bg-secondary">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              <button 
                className={`btn text-xs ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingReferrals.length})
              </button>
              <button 
                className={`btn text-xs ${activeTab === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved ({approvedReferrals.length})
              </button>
            </div>
          </div>

          <div className="search-bar-sm mb-3">
            <Search size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="referral-list space-y-2">
            {filteredList.length > 0 ? (
              filteredList.map((p) => {
                const evalData = p.evaluation || {};
                const overall = evalData.overall || {};

                return (
                  <div 
                    key={p.id}
                    className={`referral-card-item ${selectedPatient?.id === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPatientId(p.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm">{p.name}</strong>
                        <div className="text-2xs text-gray-400">{p.age} yrs • {p.gender.toUpperCase()} • ID: {p.id}</div>
                      </div>
                      <span className={`badge ${overall.riskLevel === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                        {overall.riskLevel || 'High'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 mt-2 line-clamp-2">
                      {p.referral?.reason}
                    </div>
                    <div className="text-2xs text-gray-500 mt-1">
                      CHW: {p.assignedCHW} • Issued: {p.referral?.dateGenerated}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state py-6">
                <CheckCircle2 size={32} className="text-gray-500 mb-2" />
                <p className="text-xs text-gray-400">No {activeTab} referrals found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Clinical Review Drawer */}
        {selectedPatient ? (
          <div className="card-box bg-secondary space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                  <span className="badge badge-primary">ID: {selectedPatient.id}</span>
                  <span className="badge badge-danger">{selectedPatient.evaluation?.overall?.riskLevel} Risk</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedPatient.age} yrs • {selectedPatient.gender.toUpperCase()} • Address: {selectedPatient.address} • Phone: {selectedPatient.phone}
                </p>
              </div>
              <button className="btn btn-secondary text-xs" onClick={() => onOpenPatientDetail(selectedPatient)}>
                View Full Patient Record
              </button>
            </div>

            {/* Vital Signs Bar */}
            <div className="vitals-grid">
              <div className="vital-card">
                <div className="vital-label">Blood Pressure</div>
                <div className="vital-value text-indigo-400">{selectedPatient.systolic}/{selectedPatient.diastolic} mmHg</div>
                <div className="vital-sub">{selectedPatient.evaluation?.hypertension?.category}</div>
              </div>
              <div className="vital-card">
                <div className="vital-label">Blood Glucose</div>
                <div className="vital-value text-amber-400">{selectedPatient.glucose} mg/dL</div>
                <div className="vital-sub">Type: {selectedPatient.glucoseType}</div>
              </div>
              <div className="vital-card">
                <div className="vital-label">BMI & Weight</div>
                <div className="vital-value text-emerald-400">{selectedPatient.bmi} kg/m²</div>
                <div className="vital-sub">{selectedPatient.weight} kg</div>
              </div>
            </div>

            {/* AI Risk & SHAP Breakdown */}
            <div className="card-box bg-slate-900 border-indigo-500/40">
              <h4 className="text-indigo-400 font-bold mb-2 flex items-center gap-1">
                <BrainCircuit size={16} /> AI Disease Risk & Explainability Breakdown
              </h4>
              <div className="grid-2-col gap-3 text-xs">
                <div>
                  <strong className="text-rose-400">Hypertension (Risk: {selectedPatient.evaluation?.hypertension?.riskScore}%):</strong>
                  <ul className="list-disc pl-4 text-gray-300 mt-1 space-y-0.5">
                    {selectedPatient.evaluation?.hypertension?.explanations?.map((exp, idx) => (
                      <li key={idx}>{exp.feature}: {exp.detail}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-amber-400">Diabetes (Risk: {selectedPatient.evaluation?.diabetes?.riskScore}%):</strong>
                  <ul className="list-disc pl-4 text-gray-300 mt-1 space-y-0.5">
                    {selectedPatient.evaluation?.diabetes?.explanations?.map((exp, idx) => (
                      <li key={idx}>{exp.feature}: {exp.detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Referral Request Info */}
            <div className="card-box bg-slate-900 border-slate-700">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1">
                <Hospital size={16} className="text-blue-400" /> Referral Details
              </h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div><strong>Requested Hospital:</strong> {selectedPatient.referral?.hospitalName}</div>
                <div><strong>Referral Reason:</strong> {selectedPatient.referral?.reason}</div>
                <div><strong>Current Doctor Notes:</strong> {selectedPatient.referral?.notes || 'None'}</div>
              </div>
            </div>

            {/* Doctor Decision & Notes Panel */}
            <div className="card-box bg-slate-900 border-indigo-500">
              <h4 className="text-white font-bold mb-2">👨‍⚕️ Clinician Assessment & Treatment Order</h4>
              <textarea 
                placeholder="Enter doctor clinical review, diagnostic test orders, or prescription instructions..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="form-input text-xs"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => onOpenMedicationModal(selectedPatient)}>
                  <Pill size={14} /> Prescribe / Adjust Medications
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-danger text-xs flex items-center gap-1" onClick={() => handleReject(selectedPatient.id)}>
                    <XCircle size={14} /> Decline Referral
                  </button>
                  <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => handleApprove(selectedPatient.id)}>
                    <CheckCircle2 size={14} /> Approve Referral & Treatment Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-box bg-secondary empty-state">
            <Stethoscope size={48} className="text-gray-500 mb-2" />
            <p>Select a patient referral from the left queue to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
