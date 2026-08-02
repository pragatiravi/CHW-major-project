import React, { useState } from 'react';
import { 
  X, 
  User, 
  Heart, 
  Activity, 
  Calendar, 
  Pill, 
  FileText, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  Hospital, 
  Plus, 
  Trash2, 
  Upload, 
  BookOpen, 
  BrainCircuit 
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  if (!patient) return null;

  const evalData = patient.evaluation || {};
  const overall = evalData.overall || {};
  const ht = evalData.hypertension || {};
  const db = evalData.diabetes || {};

  const getRiskClass = (level) => {
    switch (level) {
      case 'Critical': return 'badge-risk-critical';
      case 'High': return 'badge-risk-high';
      case 'Moderate': return 'badge-risk-moderate';
      default: return 'badge-risk-low';
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
      summary: reportSummary || 'Patient medical report uploaded.'
    };
    onAddReport(patient.id, newRep);
    setReportTitle('');
    setReportSummary('');
    setShowUploadForm(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="patient-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-block">
            <div className="patient-avatar-large">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="patient-head-name">
                <h2>{patient.name}</h2>
                <span className={`badge ${getRiskClass(overall.riskLevel)}`}>
                  {overall.riskLevel || 'Low'} Risk
                </span>
                <span className="badge badge-primary">ID: {patient.id}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {patient.age} yrs • {patient.gender.toUpperCase()} • Registered: {patient.dateRegistered} • Health Worker: {patient.assignedCHW || 'Sunita Patil'}
              </p>
            </div>
          </div>
          <button className="close-btn text-slate-500 hover:text-slate-800" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Action Toolbar */}
        <div className="detail-action-bar">
          <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => onOpenAIScreening(patient)}>
            <BrainCircuit size={16} /> AI Health Assessment
          </button>
          <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => onOpenCounselling(patient)}>
            <BookOpen size={16} /> Patient Counselling
          </button>
          <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => onOpenReferral(patient)}>
            <Hospital size={16} /> Hospital Referral
          </button>
          <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => onOpenMedicationModal(patient)}>
            <Pill size={16} /> Prescriptions
          </button>
          {userRole === 'admin' && (
            <button className="btn btn-danger-outline text-xs flex items-center gap-1 ml-auto" onClick={() => onDeletePatient(patient.id)}>
              <Trash2 size={16} /> Delete Record
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="detail-tabs px-6 pt-3 bg-white">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Patient Summary & Vitals
          </button>
          <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            AI Disease Prediction
          </button>
          <button className={`tab-btn ${activeTab === 'meds' ? 'active' : ''}`} onClick={() => setActiveTab('meds')}>
            Medications ({patient.medicines?.length || 0})
          </button>
          <button className={`tab-btn ${activeTab === 'referral' ? 'active' : ''}`} onClick={() => setActiveTab('referral')}>
            Hospital Referral {patient.referral ? '🟢' : ''}
          </button>
          <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            Medical Reports ({patient.reports?.length || 0})
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="modal-body p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Current Health Vitals & Measurements</h4>
              <div className="vitals-grid">
                <div className="vital-card">
                  <div className="vital-label">Blood Pressure</div>
                  <div className="vital-value text-sky-700">{patient.systolic}/{patient.diastolic} <span className="text-xs text-slate-500 font-normal">mmHg</span></div>
                  <div className="vital-sub font-semibold">{ht.category || 'Normal'}</div>
                </div>
                <div className="vital-card">
                  <div className="vital-label">Blood Glucose (Sugar)</div>
                  <div className="vital-value text-amber-700">{patient.glucose} <span className="text-xs text-slate-500 font-normal">mg/dL</span></div>
                  <div className="vital-sub font-semibold">Type: {patient.glucoseType} • {db.category}</div>
                </div>
                <div className="vital-card">
                  <div className="vital-label">BMI (Body Weight)</div>
                  <div className="vital-value text-emerald-700">{patient.bmi} <span className="text-xs text-slate-500 font-normal">kg/m²</span></div>
                  <div className="vital-sub">{patient.weight} kg • {patient.height} cm</div>
                </div>
                <div className="vital-card">
                  <div className="vital-label">Heart Rate</div>
                  <div className="vital-value text-rose-700">{patient.heartRate || 76} <span className="text-xs text-slate-500 font-normal">BPM</span></div>
                  <div className="vital-sub">Normal Rhythm</div>
                </div>
              </div>

              {/* Patient Profile Details */}
              <div className="grid-2-col gap-4 mt-4">
                <div className="card-box bg-slate-50 border-slate-200">
                  <h4 className="text-xs font-bold text-sky-900 mb-2 flex items-center gap-1"><User size={16} /> Demographics & Contact</h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>Address: <strong className="text-slate-900">{patient.address}</strong></div>
                    <div>Phone Number: <strong className="text-slate-900">{patient.phone}</strong></div>
                    <div>Family Medical History: <strong className="text-slate-900">{patient.familyHistory ? 'Yes (Hypertension/Diabetes)' : 'No'}</strong></div>
                    <div>Assigned Health Worker: <strong className="text-slate-900">{patient.assignedCHW || 'Sunita Patil'}</strong></div>
                  </div>
                </div>

                <div className="card-box bg-slate-50 border-slate-200">
                  <h4 className="text-xs font-bold text-sky-900 mb-2 flex items-center gap-1"><Activity size={16} /> Lifestyle Habits & Symptoms</h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>Tobacco Smoker: <strong className="text-slate-900">{patient.smoking ? 'Yes' : 'No'}</strong></div>
                    <div>Alcohol Consumption: <strong className="text-slate-900">{patient.alcohol ? 'Yes' : 'No'}</strong></div>
                    <div>Physical Activity: <strong className="text-slate-900">{patient.activeLifestyle ? 'Active (150+ mins/wk)' : 'Sedentary'}</strong></div>
                    <div>
                      Presenting Symptoms: 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.symptoms && patient.symptoms.length > 0 ? (
                          patient.symptoms.map(s => <span key={s} className="tag-pill">{s.replace('_', ' ')}</span>)
                        ) : (
                          <span className="text-slate-400">None Reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="card-box bg-sky-50 border-sky-200 flex items-center gap-3">
                <BrainCircuit size={32} className="text-sky-600" />
                <div>
                  <h3 className="text-slate-900 font-bold">AI Clinical Risk Analysis</h3>
                  <p className="text-xs text-slate-600">Evaluated using Random Forest machine learning with explainable risk drivers.</p>
                </div>
              </div>

              <div className="grid-2-col gap-4">
                {/* Hypertension */}
                <div className="card-box bg-white border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-rose-700">❤️ Hypertension Risk</h4>
                    <span className={`badge ${getRiskClass(ht.riskLevel)}`}>{ht.riskLevel} ({ht.riskScore}%)</span>
                  </div>
                  <div className="text-xs text-slate-700 mb-3">Category: <strong>{ht.category}</strong></div>

                  <h5 className="text-xs font-bold text-sky-800 mb-2">Key Risk Factors:</h5>
                  <div className="shap-list">
                    {ht.explanations?.map((exp, idx) => (
                      <div key={idx} className="shap-row">
                        <div className="flex justify-between text-xs font-medium text-slate-800">
                          <span>{exp.feature}</span>
                          <span className="text-rose-700 font-bold">{exp.impact}</span>
                        </div>
                        <div className="shap-bar-bg">
                          <div className="shap-bar-fill bg-rose-500" style={{ width: exp.impact.replace('+', '') }}></div>
                        </div>
                        <span className="text-2xs text-slate-500">{exp.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diabetes */}
                <div className="card-box bg-white border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-amber-700">🩸 Diabetes Risk</h4>
                    <span className={`badge ${getRiskClass(db.riskLevel)}`}>{db.riskLevel} ({db.riskScore}%)</span>
                  </div>
                  <div className="text-xs text-slate-700 mb-3">Category: <strong>{db.category}</strong></div>

                  <h5 className="text-xs font-bold text-sky-800 mb-2">Key Risk Factors:</h5>
                  <div className="shap-list">
                    {db.explanations?.map((exp, idx) => (
                      <div key={idx} className="shap-row">
                        <div className="flex justify-between text-xs font-medium text-slate-800">
                          <span>{exp.feature}</span>
                          <span className="text-amber-700 font-bold">{exp.impact}</span>
                        </div>
                        <div className="shap-bar-bg">
                          <div className="shap-bar-fill bg-amber-500" style={{ width: exp.impact.replace('+', '') }}></div>
                        </div>
                        <span className="text-2xs text-slate-500">{exp.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meds' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-900">Active Prescriptions & Medicines</h4>
                <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => onOpenMedicationModal(patient)}>
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              {patient.medicines && patient.medicines.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Routine</th>
                      <th>Status</th>
                      <th>Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.medicines.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.dosage}</td>
                        <td>{m.frequency}</td>
                        <td><span className="badge badge-success">{m.status}</span></td>
                        <td>
                          {m.missedDoses > 0 ? (
                            <span className="badge badge-danger">{m.missedDoses} Missed Alert</span>
                          ) : (
                            <span className="badge badge-success">100% Compliant</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <Pill size={36} className="text-slate-400 mb-2" />
                  <p>No medicines currently prescribed.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'referral' && (
            <div>
              {patient.referral ? (
                <div className="card-box bg-sky-50 border-sky-300">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sky-900 font-bold flex items-center gap-2">
                      <Hospital size={20} /> Hospital Referral Info
                    </h3>
                    <span className={`badge ${patient.referral.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                      Status: {patient.referral.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-800">
                    <div>Hospital: <strong>{patient.referral.hospitalName}</strong></div>
                    <div>Doctor: <strong>{patient.referral.doctorName}</strong></div>
                    <div>Urgency: <strong className={patient.referral.urgency === 'Urgent' ? 'text-rose-700' : 'text-amber-700'}>{patient.referral.urgency}</strong></div>
                    <div>Reason: <strong>{patient.referral.reason}</strong></div>
                    <div>Doctor Clinical Notes: <strong>{patient.referral.notes || 'Awaiting doctor review.'}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Hospital size={36} className="text-slate-400 mb-2" />
                  <p>No active hospital referral generated.</p>
                  <button className="btn btn-primary mt-2 text-xs" onClick={() => onOpenReferral(patient)}>
                    Create Referral
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">Uploaded Medical Reports</h4>
                <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => setShowUploadForm(!showUploadForm)}>
                  <Upload size={14} /> Upload Lab Report
                </button>
              </div>

              {showUploadForm && (
                <form onSubmit={handleUploadReport} className="card-box bg-slate-50 border-slate-300 mb-3">
                  <h5 className="text-xs font-bold text-slate-900 mb-2">Upload Medical Lab File</h5>
                  <div className="form-group mb-2">
                    <label>Report Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fasting Glucose Lab Slip"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label>Report Findings</label>
                    <textarea 
                      placeholder="Enter findings..."
                      value={reportSummary}
                      onChange={(e) => setReportSummary(e.target.value)}
                      className="form-input text-xs"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowUploadForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary text-xs">Save Report</button>
                  </div>
                </form>
              )}

              {patient.reports && patient.reports.length > 0 ? (
                <div className="grid-2-col gap-3">
                  {patient.reports.map(r => (
                    <div key={r.id} className="card-box bg-white border-slate-200">
                      <FileText size={20} className="text-sky-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">{r.title}</div>
                      <div className="text-2xs text-slate-500">Date: {r.date}</div>
                      <p className="text-xs text-slate-700 mt-1">{r.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FileText size={36} className="text-slate-400 mb-2" />
                  <p>No lab reports uploaded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
