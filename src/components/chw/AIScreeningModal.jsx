import React, { useState } from 'react';
import { X, BrainCircuit, Activity, Heart, ShieldAlert, CheckCircle, Hospital } from 'lucide-react';
import { assessPatientRisk, ML_MODELS } from '../../utils/predictionEngine';

export default function AIScreeningModal({ patient, onClose, onOpenReferral }) {
  const [selectedModel, setSelectedModel] = useState(ML_MODELS.RANDOM_FOREST);
  
  if (!patient) return null;

  // Run assessment dynamically with chosen ML model algorithm
  const result = assessPatientRisk(patient, selectedModel);
  const overall = result.overallRiskLevel;
  const ht = result.hypertension;
  const db = result.diabetes;

  const getRiskClass = (level) => {
    switch (level) {
      case 'Critical': return 'badge-risk-critical';
      case 'High': return 'badge-risk-high';
      case 'Moderate': return 'badge-risk-moderate';
      default: return 'badge-risk-low';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-cyan-200" size={24} />
            <div>
              <h2>AI Disease Prediction & Health Assessment</h2>
              <p className="text-xs text-sky-100">Clinical Risk Support Engine for {patient.name} ({patient.id})</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Model Selector Bar */}
          <div className="card-box bg-sky-50 border-sky-200 mb-4">
            <span className="text-xs font-bold text-slate-700">Choose Machine Learning Model:</span>
            <div className="flex gap-2 mt-2">
              {Object.values(ML_MODELS).map((m) => (
                <button 
                  key={m}
                  className={`btn text-xs ${selectedModel === m ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedModel(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid-3-col mb-4 gap-3">
            <div className="metric-box border-l-4 border-sky-600">
              <span className="metric-label">Overall Patient Risk</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${getRiskClass(overall)}`}>{overall}</span>
                <span className="text-xs text-slate-600 font-semibold">({result.riskPercentage}% Score)</span>
              </div>
            </div>

            <div className="metric-box border-l-4 border-emerald-600">
              <span className="metric-label">AI Model Accuracy</span>
              <div className="metric-value text-emerald-700 mt-1">{result.confidenceScore}%</div>
              <span className="metric-sub">Calibrated Clinical Cross-Validation</span>
            </div>

            <div className="metric-box border-l-4 border-amber-600">
              <span className="metric-label">Suggested Follow-Up Visit</span>
              <div className="metric-value text-amber-700 mt-1">{result.followUpDays} Days</div>
              <span className="metric-sub">{result.requiresReferral ? 'Hospital Referral Recommended' : 'Standard Routine Monitoring'}</span>
            </div>
          </div>

          {/* Disease Risk Breakdown */}
          <div className="grid-2-col gap-4">
            {/* Hypertension */}
            <div className="card-box bg-white border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="flex items-center gap-1 text-rose-700 font-bold">
                  <Heart size={18} /> Hypertension (BP) Risk
                </h4>
                <span className={`badge ${getRiskClass(ht.riskLevel)}`}>{ht.riskLevel} ({ht.riskScore}%)</span>
              </div>
              <div className="text-xs text-slate-700 mb-3">Category: <strong className="text-slate-900">{ht.category}</strong></div>

              <h5 className="text-xs font-bold text-sky-800 mb-2">Key Risk Factors Identified (SHAP Analysis):</h5>
              <div className="shap-list">
                {ht.explanations && ht.explanations.map((exp, idx) => (
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
                <h4 className="flex items-center gap-1 text-amber-700 font-bold">
                  <Activity size={18} /> Diabetes (Sugar) Risk
                </h4>
                <span className={`badge ${getRiskClass(db.riskLevel)}`}>{db.riskLevel} ({db.riskScore}%)</span>
              </div>
              <div className="text-xs text-slate-700 mb-3">Category: <strong className="text-slate-900">{db.category}</strong></div>

              <h5 className="text-xs font-bold text-sky-800 mb-2">Key Risk Factors Identified (SHAP Analysis):</h5>
              <div className="shap-list">
                {db.explanations && db.explanations.map((exp, idx) => (
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

          {/* Action Recommendations */}
          <div className="card-box bg-sky-50 border-sky-300 mt-4">
            <h4 className="text-sky-900 font-bold mb-2">💡 Recommended Actions for Healthcare Worker:</h4>
            <ul className="text-xs text-slate-800 space-y-1.5 pl-4 list-disc font-medium">
              {result.suggestedActions.map((act, idx) => (
                <li key={idx}>{act}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-footer flex justify-between items-center">
          <span className="text-xs text-slate-500">ML Engine: {selectedModel}</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            {result.requiresReferral && (
              <button 
                className="btn btn-primary flex items-center gap-1"
                onClick={() => {
                  onClose();
                  onOpenReferral(patient);
                }}
              >
                <Hospital size={16} /> Create Hospital Referral
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
