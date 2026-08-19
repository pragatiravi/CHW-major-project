import { useState } from 'react';
import { 
  X, 
  Pill, 
  Hospital, 
  BookOpen, 
  BrainCircuit,
  Printer,
  Trash2
} from 'lucide-react';
import { exportPatientSummaryPDF } from '../../utils/pdfExport';

export default function PatientDetailModal({
  patient,
  onClose,
  onOpenAIScreening,
  onOpenCounselling,
  onOpenReferral,
  onOpenMedicationModal,
  onDeletePatient,
  onAddReport,
  userRole
}) {
  const [activeTab, setActiveTab] = useState('overview'); // overview | vitals | medications | counselling | referrals | reports
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  if (!patient) return null;

  const evalData = patient.evaluation || {};
  const overallRisk = evalData.overallRiskLevel || evalData.overall?.riskLevel || 'Low';

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return <span className="badge badge-risk-critical">Critical Risk</span>;
      case 'High': return <span className="badge badge-risk-high">High Risk</span>;
      case 'Moderate': return <span className="badge badge-risk-moderate">Moderate</span>;
      default: return <span className="badge badge-risk-low">Low Risk</span>;
    }
  };

  const handleUploadReport = (e) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    
    const newRep = {
      id: 'REP-' + Math.floor(100 + Math.random() * 900),
      title: reportTitle,
      date: new Date().toISOString().split('T')[0],
      fileType: 'pdf',
      summary: reportSummary || 'Patient clinical report uploaded.'
    };
    onAddReport(patient.id, newRep);
    setReportTitle('');
    setReportSummary('');
    setShowUploadForm(false);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="patient-detail-title">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-3">
            <div className="patient-avatar-sm" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="patient-detail-title" className="text-lg font-bold text-slate-900">{patient.name}</h2>
                <span className="badge badge-primary font-mono text-2xs">ID: {patient.id}</span>
                {getRiskBadge(overallRisk)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} yrs • {patient.gender.toUpperCase()} • Sector: {patient.address} • Contact: {patient.phone}
              </p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close patient details"><X size={16} /></button>
        </div>

        {/* Action Toolbar */}
        <div className="flex gap-2 p-3 px-6 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {userRole === 'chw' && <button className="btn btn-primary text-xs" onClick={() => onOpenAIScreening(patient)}>
            <BrainCircuit size={14} /> Run Screening
          </button>}
          {userRole === 'chw' && <button className="btn btn-secondary text-xs" onClick={() => onOpenCounselling(patient)}>
            <BookOpen size={14} /> Counselling
          </button>}
          {userRole === 'chw' && <button className="btn btn-secondary text-xs" onClick={() => onOpenReferral(patient)}>
            <Hospital size={14} /> Refer
          </button>}
          {(userRole === 'chw' || userRole === 'doctor') && <button className="btn btn-secondary text-xs" onClick={() => onOpenMedicationModal(patient)}>
            <Pill size={14} /> Medicines
          </button>}
          <button className="btn btn-secondary text-xs" onClick={() => exportPatientSummaryPDF(patient)}>
            <Printer size={14} /> PDF Passport
          </button>
          {userRole === 'chw' && <button className="btn btn-danger-outline text-xs ml-auto" onClick={() => onDeletePatient(patient.id)}>
            <Trash2 size={14} /> Delete
          </button>}
        </div>

        {/* Drawer Tabs */}
        <div className="drawer-tabs">
          <button 
            className={`drawer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => setActiveTab('vitals')}
          >
            Vitals & Screening
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'medications' ? 'active' : ''}`}
            onClick={() => setActiveTab('medications')}
          >
            Medications ({patient.medicines?.length || 0})
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'counselling' ? 'active' : ''}`}
            onClick={() => setActiveTab('counselling')}
          >
            Counselling
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            Referrals & Reports
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="drawer-content space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid-3-col gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-sky-50/50">
                  <span className="text-2xs font-bold text-sky-700 uppercase tracking-wider block">Blood Pressure</span>
                  <div className="text-xl font-bold text-sky-950 mt-0.5">{patient.systolic}/{patient.diastolic} <span className="text-xs font-normal text-slate-500">mmHg</span></div>
                  <span className="text-2xs text-slate-600 block mt-0.5 font-medium">{evalData.hypertension?.category || 'Stage 2 Hypertension'}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-amber-50/50">
                  <span className="text-2xs font-bold text-amber-700 uppercase tracking-wider block">Blood Sugar</span>
                  <div className="text-xl font-bold text-amber-950 mt-0.5">{patient.glucose} <span className="text-xs font-normal text-slate-500">mg/dL</span></div>
                  <span className="text-2xs text-slate-600 block mt-0.5 font-medium">{patient.glucoseType || 'Random'} Reading</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/50">
                  <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">BMI</span>
                  <div className="text-xl font-bold text-emerald-950 mt-0.5">{patient.bmi} <span className="text-xs font-normal text-slate-500">kg/m²</span></div>
                  <span className="text-2xs text-slate-600 block mt-0.5 font-medium">{patient.weight || 65} kg • {patient.height || 160} cm</span>
                </div>
              </div>

              {/* Presenting Symptoms */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <strong className="text-xs text-slate-900 block">Reported Symptoms</strong>
                <div className="flex flex-wrap gap-1.5">
                  {patient.symptoms && patient.symptoms.length > 0 ? (
                    patient.symptoms.map(s => (
                      <span key={s} className="tag-pill text-xs">
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No active symptoms reported.</span>
                  )}
                </div>
              </div>

              {/* Clinical Assessment Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                    <BrainCircuit size={16} className="text-sky-600" /> AI Risk Stratification Summary
                  </strong>
                  <span className="badge badge-neutral text-2xs font-mono">Confidence: {evalData.confidenceScore || 95}%</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {evalData.whyThisResult || 'Patient exhibits chronic risk indicators aligned with clinical guidelines.'}
                </p>
                <div className="text-2xs text-slate-500 pt-1">
                  Recommended Recall: <strong>{evalData.followUpDays || 30} Days</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VITALS & FACTORS */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="grid-2-col gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <strong className="text-xs text-rose-700 block">
                    Hypertension Factors ({evalData.hypertension?.riskScore || 0}% Risk):
                  </strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-2xs">
                    {evalData.hypertension?.explanations?.map((exp, i) => (
                      <li key={i}><strong>{exp.feature}</strong> ({exp.impact}): {exp.detail}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <strong className="text-xs text-amber-700 block">
                    Diabetes Factors ({evalData.diabetes?.riskScore || 0}% Risk):
                  </strong>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-2xs">
                    {evalData.diabetes?.explanations?.map((exp, i) => (
                      <li key={i}><strong>{exp.feature}</strong> ({exp.impact}): {exp.detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICATIONS */}
          {activeTab === 'medications' && (
            <div className="space-y-3">
              {patient.medicines && patient.medicines.length > 0 ? (
                patient.medicines.map((med, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <strong className="text-sm text-slate-900 block">{med.name} ({med.dosage})</strong>
                      <span className="text-xs text-slate-500">{med.frequency} • Time: {med.time}</span>
                    </div>
                    <span className={`badge ${med.takenToday ? 'badge-risk-low' : 'badge-neutral'} text-xs`}>
                      {med.takenToday ? 'Taken Today' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No active medication orders.</p>
              )}
            </div>
          )}

          {/* TAB 4: COUNSELLING */}
          {activeTab === 'counselling' && (
            <div className="space-y-3">
              {patient.counsellingHistory && patient.counsellingHistory.length > 0 ? (
                patient.counsellingHistory.map((sess, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900">{sess.topic}</strong>
                      <span className="text-2xs text-slate-400">{sess.date}</span>
                    </div>
                    <p className="text-slate-600">{sess.notes}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 mb-3">No counselling history recorded.</p>
                  <button className="btn btn-primary text-xs" onClick={() => onOpenCounselling(patient)}>
                    Conduct ThinkLets Session
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REFERRALS & REPORTS */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {patient.referral ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-900">{patient.referral.hospitalName}</strong>
                    <span className={`badge ${patient.referral.status === 'Approved' ? 'badge-risk-low' : 'badge-risk-moderate'}`}>
                      {patient.referral.status}
                    </span>
                  </div>
                  <p className="text-slate-600"><strong>Reason:</strong> {patient.referral.reason}</p>
                  {patient.referral.notes && (
                    <p className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                      <strong>Doctor Notes:</strong> {patient.referral.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No active hospital referrals.</p>
              )}

              {/* Upload Report Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-900">Clinical Reports & Documents</h4>
                  <button className="btn btn-secondary text-xs" onClick={() => setShowUploadForm(!showUploadForm)}>
                    + Upload Report
                  </button>
                </div>

                {showUploadForm && (
                  <form onSubmit={handleUploadReport} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 mb-3">
                    <div className="form-group">
                      <label className="form-label">Report Title</label>
                      <input type="text" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} className="form-input text-xs" placeholder="e.g. Fasting Lipid Profile" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Summary</label>
                      <input type="text" value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} className="form-input text-xs" placeholder="e.g. Total cholesterol 195 mg/dL" />
                    </div>
                    <button type="submit" className="btn btn-primary text-xs">Save Report</button>
                  </form>
                )}

                <div className="space-y-2">
                  {patient.reports && patient.reports.length > 0 ? (
                    patient.reports.map((rep, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-900 block">{rep.title}</strong>
                          <span className="text-2xs text-slate-500">{rep.summary}</span>
                        </div>
                        <span className="text-2xs text-slate-400">{rep.date}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-2xs text-slate-400">No external reports uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
