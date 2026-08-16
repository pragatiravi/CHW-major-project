import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Hospital, 
  BrainCircuit, 
  Pill, 
  Search, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import MedicationTrackerModal from '../chw/MedicationTrackerModal';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function DoctorPortal({
  patients = [],
  onApproveReferral,
  onRejectReferral,
  onUpdatePatientMedicines,
  onAddReport,
  onSaveReferral,
  activeSection = 'triage'
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedModalPatient, setShowMedModalPatient] = useState(null);
  const [showDetailPatient, setShowDetailPatient] = useState(null);

  useEffect(() => {
    if (activeSection === 'triage') {
      setActiveTab('pending');
    }
  }, [activeSection]);

  const referredPatients = patients.filter(p => p.referral);
  
  // Sort Critical & High first
  const sortCriticalFirst = (list) => {
    const priorityWeight = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1 };
    return [...list].sort((a, b) => {
      const wA = priorityWeight[a.evaluation?.overallRiskLevel || 'Low'] || 1;
      const wB = priorityWeight[b.evaluation?.overallRiskLevel || 'Low'] || 1;
      return wB - wA;
    });
  };

  const pendingReferrals = sortCriticalFirst(referredPatients.filter(p => p.referral && p.referral.status === 'Pending'));
  const approvedReferrals = sortCriticalFirst(referredPatients.filter(p => p.referral && p.referral.status === 'Approved'));

  const currentList = activeTab === 'pending' ? pendingReferrals : approvedReferrals;
  const filteredList = currentList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || filteredList[0] || null;

  const handleApprove = (patientId) => {
    onApproveReferral(patientId, doctorNotes || 'Approved by attending clinician. Treatment plan initiated.');
    setDoctorNotes('');
  };

  const handleReject = (patientId) => {
    onRejectReferral(patientId, doctorNotes || 'Referral reviewed. Managed under primary community care protocol.');
    setDoctorNotes('');
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return <span className="badge badge-risk-critical">Critical Risk</span>;
      case 'High': return <span className="badge badge-risk-high">High Risk</span>;
      case 'Moderate': return <span className="badge badge-risk-moderate">Moderate</span>;
      default: return <span className="badge badge-risk-low">Low Risk</span>;
    }
  };

  return (
    <div className="portal-content-container space-y-6">
      {/* Header Banner */}
      <div className="card-box bg-white p-5 flex justify-between items-center flex-wrap gap-4 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clinical Referral Review Desk</h1>
            <p className="text-xs text-slate-500">Triage incoming community health worker referrals and authorize care plans</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              className={`btn text-xs ${activeTab === 'pending' ? 'btn-primary' : 'text-slate-600'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Reviews ({pendingReferrals.length})
            </button>
            <button 
              className={`btn text-xs ${activeTab === 'approved' ? 'btn-primary' : 'text-slate-600'}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedReferrals.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Split Layout */}
      <div className="grid-3-7-col gap-6">
        {/* Left Column: Priority Triage Queue */}
        <div className="card-box space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'pending' ? 'Priority Triage Queue' : 'Approved Referrals'}
            </h3>
            <span className="text-2xs text-slate-400 font-mono">Sorted by urgency</span>
          </div>

          <div className="search-bar-sm">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search referral queue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredList.length > 0 ? (
              filteredList.map(p => {
                const isSelected = selectedPatient?.id === p.id;
                const risk = p.evaluation?.overallRiskLevel || 'High';

                return (
                  <div 
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-400 bg-indigo-50/70 shadow-sm' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedPatientId(p.id)}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <strong className="text-sm text-slate-900 block">{p.name}</strong>
                        <span className="text-2xs text-slate-500 font-mono">ID: {p.id} • {p.age} yrs</span>
                      </div>
                      {getRiskBadge(risk)}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {p.referral?.reason || 'Chronic risk factors recorded in field screening.'}
                    </p>

                    <div className="flex justify-between items-center text-3xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      <span>CHW: {p.assignedCHW || 'Sunita Patil'}</span>
                      <span>{p.referral?.dateGenerated || 'Recent'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state py-12 text-center text-slate-500">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold">No {activeTab} referrals</p>
                <p className="text-2xs text-slate-400 mt-0.5">You're all caught up with the intake queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Clinical Review Workspace */}
        {selectedPatient ? (
          <div className="card-box space-y-5">
            {/* Patient Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                  <span className="badge badge-primary font-mono">ID: {selectedPatient.id}</span>
                  {getRiskBadge(selectedPatient.evaluation?.overallRiskLevel || 'High')}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPatient.age} yrs • {selectedPatient.gender.toUpperCase()} • Sector: {selectedPatient.address} • Contact: {selectedPatient.phone}
                </p>
              </div>

              <button 
                className="btn btn-secondary text-xs"
                onClick={() => setShowDetailPatient(selectedPatient)}
              >
                View Full Patient Record
              </button>
            </div>

            {/* Vitals Summary Card */}
            <div className="grid-3-col gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-sky-50/50">
                <span className="text-2xs font-bold text-sky-700 uppercase tracking-wider block">Blood Pressure</span>
                <div className="text-xl font-bold text-sky-950 mt-0.5">
                  {selectedPatient.systolic}/{selectedPatient.diastolic} <span className="text-xs font-normal text-slate-500">mmHg</span>
                </div>
                <span className="text-2xs text-slate-600 block mt-0.5 font-medium">
                  {selectedPatient.evaluation?.hypertension?.category || 'Stage 2 Hypertension'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-amber-50/50">
                <span className="text-2xs font-bold text-amber-700 uppercase tracking-wider block">Blood Glucose</span>
                <div className="text-xl font-bold text-amber-950 mt-0.5">
                  {selectedPatient.glucose} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <span className="text-2xs text-slate-600 block mt-0.5 font-medium">
                  Type: {selectedPatient.glucoseType} • {selectedPatient.evaluation?.diabetes?.category || 'Diabetic Range'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/50">
                <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">BMI & Weight</span>
                <div className="text-xl font-bold text-emerald-950 mt-0.5">
                  {selectedPatient.bmi} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                </div>
                <span className="text-2xs text-slate-600 block mt-0.5 font-medium">
                  {selectedPatient.weight || 70} kg • {selectedPatient.height || 160} cm
                </span>
              </div>
            </div>

            {/* AI Decision Support & Key Contributing Factors */}
            <div className="card-box bg-slate-50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BrainCircuit size={16} className="text-sky-600" /> Key Contributing Factors
                </h4>
                <span className="badge badge-neutral font-mono text-2xs">
                  Confidence: {selectedPatient.evaluation?.confidenceScore || 95}%
                </span>
              </div>

              <div className="grid-2-col gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <strong className="text-rose-700 block text-xs">
                    Hypertension Factors ({selectedPatient.evaluation?.hypertension?.riskScore || 0}% Risk):
                  </strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-2xs">
                    {selectedPatient.evaluation?.hypertension?.explanations?.map((exp, i) => (
                      <li key={i}><strong>{exp.feature}</strong> ({exp.impact}): {exp.detail}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <strong className="text-amber-700 block text-xs">
                    Diabetes Factors ({selectedPatient.evaluation?.diabetes?.riskScore || 0}% Risk):
                  </strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-2xs">
                    {selectedPatient.evaluation?.diabetes?.explanations?.map((exp, i) => (
                      <li key={i}><strong>{exp.feature}</strong> ({exp.impact}): {exp.detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CHW Referral Intake Notes */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <strong className="text-slate-900 flex items-center gap-1.5">
                  <Hospital size={14} className="text-indigo-600" /> Field Referral Intake
                </strong>
                <span className="badge badge-warning text-3xs">{selectedPatient.referral?.status || 'Pending'}</span>
              </div>
              <p><strong>Reason:</strong> {selectedPatient.referral?.reason}</p>
              <p className="text-2xs text-slate-500">
                Dispatched by CHW {selectedPatient.assignedCHW || 'Sunita Patil'} on {selectedPatient.referral?.dateGenerated}
              </p>
            </div>

            {/* Doctor Decision & Prescription Action Box */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">
                Clinician Assessment & Orders
              </h4>
              <textarea 
                placeholder="Enter clinical notes, diagnostic lab requests, or follow-up instructions for the field health worker..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="form-input text-xs"
                rows={3}
              />

              <div className="flex justify-between items-center flex-wrap gap-2 pt-1">
                <button 
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                  onClick={() => setShowMedModalPatient(selectedPatient)}
                >
                  <Pill size={14} className="text-indigo-600" /> Prescribe / Adjust Medications
                </button>

                <div className="flex gap-2">
                  <button 
                    className="btn btn-danger-outline text-xs"
                    onClick={() => handleReject(selectedPatient.id)}
                  >
                    Decline Referral
                  </button>
                  <button 
                    className="btn btn-primary text-xs font-bold shadow-sm"
                    onClick={() => handleApprove(selectedPatient.id)}
                  >
                    <CheckCircle2 size={14} /> Approve Treatment Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-box empty-state py-16 text-center text-slate-400">
            <Stethoscope size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Patient Selected</p>
            <p className="text-xs text-slate-400 mt-1">Choose a referral from the triage queue on the left to start clinical review.</p>
          </div>
        )}
      </div>

      {/* Medication Order Modal */}
      {showMedModalPatient && (
        <MedicationTrackerModal 
          patient={showMedModalPatient}
          onClose={() => setShowMedModalPatient(null)}
          onUpdatePatientMedicines={onUpdatePatientMedicines}
        />
      )}

      {/* Patient Detail Drawer */}
      {showDetailPatient && (
        <PatientDetailModal 
          patient={showDetailPatient}
          onClose={() => setShowDetailPatient(null)}
          onOpenAIScreening={() => {}}
          onOpenCounselling={() => {}}
          onOpenReferral={() => {}}
          onOpenMedicationModal={(p) => setShowMedModalPatient(p)}
          onDeletePatient={() => {}}
          onAddReport={onAddReport}
          userRole="doctor"
        />
      )}
    </div>
  );
}
