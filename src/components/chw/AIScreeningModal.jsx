import { useState } from 'react';
import { X, BrainCircuit, Activity, Heart, Hospital, Sparkles } from 'lucide-react';
import { assessPatientRisk, ML_MODELS } from '../../utils/predictionEngine';

export default function AIScreeningModal({ patient, onClose, onOpenReferral }) {
  const [selectedModel, setSelectedModel] = useState(ML_MODELS.ENSEMBLE_CLINICAL);
  
  if (!patient) return null;

  // Run assessment dynamically with chosen clinical model
  const result = assessPatientRisk(patient, selectedModel);
  const overall = result.overallRiskLevel;
  const ht = result.hypertension;
  const db = result.diabetes;

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return <span className="badge badge-risk-critical">Critical Risk</span>;
      case 'High': return <span className="badge badge-risk-high">High Risk</span>;
      case 'Moderate': return <span className="badge badge-risk-moderate">Moderate</span>;
      default: return <span className="badge badge-risk-low">Low Risk</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-box w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical Risk Stratification & Assessment</h2>
              <p className="text-2xs text-slate-500">Decision Support Engine for {patient.name} ({patient.id})</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close screening assessment"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Model Selector Bar */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-sky-950">Clinical Scoring Model:</span>
            <div className="flex gap-1.5 flex-wrap">
              {Object.values(ML_MODELS).map((m) => (
                <button 
                  key={m}
                  className={`btn text-2xs py-1 px-2.5 ${selectedModel === m ? 'btn-primary font-bold' : 'btn-secondary bg-white'}`}
                  onClick={() => setSelectedModel(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid-3-col gap-3">
            <div className="metric-box border-l-4 border-l-sky-600">
              <span className="metric-label">Overall Risk Tier</span>
              <div className="flex items-center gap-2 mt-1">
                {getRiskBadge(overall)}
                <span className="text-xs text-slate-600 font-mono font-bold">({result.riskPercentage}%)</span>
              </div>
            </div>

            <div className="metric-box border-l-4 border-l-emerald-600">
              <span className="metric-label">Engine Confidence</span>
              <div className="text-xl font-extrabold text-emerald-800 mt-1">{result.confidenceScore}%</div>
              <span className="metric-sub">Guideline Cross-Validation</span>
            </div>

            <div className="metric-box border-l-4 border-l-amber-600">
              <span className="metric-label">Suggested Recall</span>
              <div className="text-xl font-extrabold text-amber-800 mt-1">{result.followUpDays} Days</div>
              <span className="metric-sub">{result.requiresReferral ? 'Hospital Referral Advised' : 'Community Monitoring'}</span>
            </div>
          </div>

          {/* Disease Risk Breakdown */}
          <div className="grid-2-col gap-4">
            {/* Hypertension */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                  <Heart size={16} className="text-sky-600" /> Hypertension Risk
                </strong>
                <span className="badge badge-risk-high">{ht.riskScore}%</span>
              </div>
              <p className="text-2xs text-slate-600">Category: <strong>{ht.category}</strong></p>

              <div>
                <strong className="text-2xs text-slate-700 block mb-1">Key Contributing Factors:</strong>
                <div className="space-y-1">
                  {ht.explanations?.map((exp, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-2xs flex justify-between items-center">
                      <span className="text-slate-900">{exp.feature}: {exp.detail}</span>
                      <span className="badge badge-risk-moderate text-3xs">{exp.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Diabetes */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                  <Activity size={16} className="text-amber-600" /> Diabetes Risk
                </strong>
                <span className="badge badge-risk-moderate">{db.riskScore}%</span>
              </div>
              <p className="text-2xs text-slate-600">Category: <strong>{db.category}</strong></p>

              <div>
                <strong className="text-2xs text-slate-700 block mb-1">Key Contributing Factors:</strong>
                <div className="space-y-1">
                  {db.explanations?.map((exp, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-2xs flex justify-between items-center">
                      <span className="text-slate-900">{exp.feature}: {exp.detail}</span>
                      <span className="badge badge-risk-moderate text-3xs">{exp.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Plain Language Clinical Recommendation */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
            <strong className="text-xs text-slate-900 block flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-600" /> Clinical Assessment Summary:
            </strong>
            <p className="text-xs text-slate-700 leading-relaxed">
              {result.whyThisResult}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button className="btn btn-secondary text-xs" onClick={onClose}>Close</button>
          {result.requiresReferral && onOpenReferral && (
            <button 
              className="btn btn-primary text-xs flex items-center gap-1.5 font-bold"
              onClick={() => {
                onClose();
                onOpenReferral(patient);
              }}
            >
              <Hospital size={14} /> Dispatch Hospital Referral
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
