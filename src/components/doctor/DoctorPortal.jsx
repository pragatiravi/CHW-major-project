import { useRef, useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  Hospital, 
  BrainCircuit, 
  Pill, 
  Search,
  Eye,
  X
} from 'lucide-react';
import MedicationTrackerModal from '../chw/MedicationTrackerModal';
import PatientDetailModal from '../shared/PatientDetailModal';

export default function DoctorPortal({
  patients = [],
  onApproveReferral,
  onRejectReferral,
  onUpdatePatientMedicines,
  onAddReport,
  activeSection = 'triage'
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedModalPatient, setShowMedModalPatient] = useState(null);
  const [showDetailPatient, setShowDetailPatient] = useState(null);
  const recordPanelRef = useRef(null);
  const lastOpenButtonRef = useRef(null);

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

  const currentList = activeSection === 'patients'
    ? sortCriticalFirst(patients)
    : activeSection === 'prescriptions'
      ? sortCriticalFirst(patients.filter((patient) => (patient.medicines || []).length > 0))
      : activeTab === 'pending' ? pendingReferrals : approvedReferrals;
  const filteredList = currentList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = filteredList.find(p => p.id === selectedPatientId) || null;
  const openRecordLabel = activeSection === 'prescriptions'
    ? 'Open medication orders'
    : activeSection === 'patients'
      ? 'Open patient record'
      : 'Open clinical review';

  const handleOpenPatient = (patientId, trigger) => {
    lastOpenButtonRef.current = trigger;
    setSelectedPatientId(patientId);
    setDoctorNotes('');
    window.requestAnimationFrame(() => recordPanelRef.current?.focus());
  };

  const handleClosePatient = () => {
    setSelectedPatientId(null);
    setDoctorNotes('');
    window.requestAnimationFrame(() => lastOpenButtonRef.current?.focus());
  };

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
            <h1 className="text-xl font-bold text-slate-900">
              {activeSection === 'patients' ? 'Clinical Patient Records' : activeSection === 'prescriptions' ? 'Prescription Management' : 'Clinical Referral Review Desk'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeSection === 'patients' ? 'Review longitudinal community records and recent risk assessments' : activeSection === 'prescriptions' ? 'Review active medicines and update patient treatment orders' : 'Triage incoming community health worker referrals and authorize care plans'}
            </p>
          </div>
        </div>

        {activeSection === 'triage' && (
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
        )}
      </div>

      {/* Main Workspace Split Layout */}
      <div className={`${selectedPatient ? 'grid-3-7-col' : 'grid'} gap-6`}>
        {/* Left Column: Priority Triage Queue */}
        <div className="card-box space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              {activeSection === 'patients' ? 'Patient Directory' : activeSection === 'prescriptions' ? 'Patients with Active Medicines' : activeTab === 'pending' ? 'Priority Triage Queue' : 'Approved Referrals'}
            </h3>
            <span className="text-2xs text-slate-400 font-mono">Sorted by urgency</span>
          </div>

          <div className="search-bar-sm">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder={activeSection === 'triage' ? 'Search referral queue...' : 'Search patient records...'}
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
                  <article
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-indigo-400 bg-indigo-50/70 shadow-sm' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
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
                    <button
                      type="button"
                      className="btn btn-secondary text-xs w-full mt-3"
                      onClick={(event) => handleOpenPatient(p.id, event.currentTarget)}
                      disabled={isSelected}
                    >
                      <Eye size={14} aria-hidden="true" />
                      {isSelected ? 'Record open' : openRecordLabel}
                    </button>
                  </article>
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
          <div
            ref={recordPanelRef}
            className="card-box space-y-5"
            tabIndex="-1"
            aria-labelledby="doctor-selected-patient-heading"
          >
            {/* Patient Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 id="doctor-selected-patient-heading" className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                  <span className="badge badge-primary font-mono">ID: {selectedPatient.id}</span>
                  {getRiskBadge(selectedPatient.evaluation?.overallRiskLevel || 'High')}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPatient.age} yrs • {selectedPatient.gender.toUpperCase()} • Sector: {selectedPatient.address} • Contact: {selectedPatient.phone}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setShowDetailPatient(selectedPatient)}
                >
                  <Eye size={14} aria-hidden="true" /> View Full Patient Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={handleClosePatient}
                >
                  <X size={14} aria-hidden="true" />
                  {activeSection === 'prescriptions' ? 'Close medication orders' : 'Close record'}
                </button>
              </div>
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

            {activeSection === 'prescriptions' && (
              <section className="card-box bg-slate-50 p-4 space-y-3" aria-labelledby="active-orders-heading">
                <div className="flex justify-between items-center gap-3">
                  <h3 id="active-orders-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2"><Pill size={16} className="text-indigo-600" /> Active Medication Orders</h3>
                  <button type="button" className="btn btn-primary text-xs" onClick={() => setShowMedModalPatient(selectedPatient)}>Adjust medicines</button>
                </div>
                {(selectedPatient.medicines || []).length ? (
                  <div className="grid-2-col gap-3">
                    {selectedPatient.medicines.map((medicine, index) => (
                      <div key={`${medicine.name}-${index}`} className="p-3 rounded-lg border border-slate-200 bg-white">
                        <strong className="text-xs text-slate-900 block">{medicine.name} {medicine.dosage}</strong>
                        <span className="text-2xs text-slate-500">{medicine.frequency || 'As directed'} · {medicine.time || 'Schedule not set'}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-500">No active medication orders.</p>}
              </section>
            )}

            {/* CHW Referral Intake Notes */}
            {activeSection === 'triage' && (
            <>
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
            </>
            )}
          </div>
        ) : null}
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
