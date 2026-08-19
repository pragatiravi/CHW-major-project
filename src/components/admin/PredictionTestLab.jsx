import { useState } from 'react';
import { 
  FlaskConical, 
  Play,
  Sliders,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  assessPatientRisk, 
  ML_MODELS, 
  CLINICAL_BENCHMARK_TEST_CASES, 
  ALGORITHM_METADATA 
} from '../../utils/predictionEngine';

export default function PredictionTestLab() {
  const [selectedModel, setSelectedModel] = useState(ML_MODELS.RANDOM_FOREST);
  const [testResults, setTestResults] = useState(() => {
    return CLINICAL_BENCHMARK_TEST_CASES.map(tc => {
      const actual = assessPatientRisk(tc.patient, ML_MODELS.RANDOM_FOREST);
      const isRiskMatch = actual.overallRiskLevel === tc.expectedRisk;
      return {
        ...tc,
        actual,
        passed: isRiskMatch
      };
    });
  });

  const [customInput, setCustomInput] = useState({
    name: 'Custom Laboratory Case',
    age: 50,
    gender: 'female',
    systolic: 145,
    diastolic: 92,
    glucose: 165,
    glucoseType: 'fasting',
    bmi: 28.2,
    symptoms: ['headache'],
    familyHistory: true,
    smoking: false,
    alcohol: false,
    activeLifestyle: false
  });

  const handleRunAllTests = (model = selectedModel) => {
    const updated = CLINICAL_BENCHMARK_TEST_CASES.map(tc => {
      const actual = assessPatientRisk(tc.patient, model);
      const isRiskMatch = actual.overallRiskLevel === tc.expectedRisk;
      return {
        ...tc,
        actual,
        passed: isRiskMatch
      };
    });
    setTestResults(updated);
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    handleRunAllTests(model);
  };

  const customEvaluation = assessPatientRisk(customInput, selectedModel);
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;

  return (
    <div className="space-y-4">
      {/* Test Lab Header Banner */}
      <div className="card-box bg-slate-900 text-white border-indigo-900 p-5 rounded-xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="text-cyan-400" size={24} />
            <h2 className="text-base font-bold text-white">Clinical Prediction Engine Verification Lab</h2>
            <span className="badge badge-primary text-2xs">Admin CDSS Quality Assurance</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Automated regression and ground-truth validation suite against AHA/ADA clinical benchmark profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Benchmark Validation Status:</span>
            <strong className="text-emerald-400 text-sm font-mono">{passedCount} / {totalCount} Profiles Aligned</strong>
          </div>
          <button 
            className="btn btn-primary text-xs flex items-center gap-1.5 font-bold shadow-md bg-cyan-600 hover:bg-cyan-700"
            onClick={() => handleRunAllTests()}
          >
            <Play size={14} /> Execute Suite
          </button>
        </div>
      </div>

      {/* Model & Metadata Bar */}
      <div className="card-box bg-white border-slate-200 p-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Active Risk Algorithm:</span>
          <select 
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="form-input text-xs py-1 font-semibold"
          >
            {Object.values(ML_MODELS).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-2xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Standard: <strong>{ALGORITHM_METADATA.standards.join(' • ')}</strong></span>
        </div>
      </div>

      {/* Test Cases Grid */}
      <div className="space-y-3">
        {testResults.map((test) => {
          const act = test.actual;
          return (
            <div 
              key={test.id} 
              className={`card-box p-4 border rounded-xl bg-white ${test.passed ? 'border-slate-200' : 'border-amber-400 bg-amber-50/20'}`}
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{test.id}</span>
                    <h3 className="text-xs font-bold text-slate-900">{test.title}</h3>
                    <span className={`badge ${test.passed ? 'badge-success' : 'badge-warning'} text-3xs`}>
                      {test.passed ? '✓ Baseline Passed' : '⚠️ Deviated'}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">{test.description}</p>
                </div>

                <div className="text-right">
                  <span className="text-3xs text-slate-400 uppercase font-semibold block">Predicted Risk Level</span>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className={`badge badge-risk-${act.overallRiskLevel.toLowerCase()} text-xs`}>
                      {act.overallRiskLevel}
                    </span>
                    <span className="text-2xs font-mono text-slate-600">({act.riskPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Input Vector Preview */}
              <div className="grid-5-col gap-2 mt-3 pt-2.5 border-t border-slate-100 text-2xs bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-slate-400 block">Vitals BP:</span>
                  <strong className="text-slate-800">{test.patient.systolic}/{test.patient.diastolic} mmHg</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Glucose ({test.patient.glucoseType}):</span>
                  <strong className="text-slate-800">{test.patient.glucose} mg/dL</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Demographics:</span>
                  <strong className="text-slate-800">{test.patient.age}y • {test.patient.gender} • BMI {test.patient.bmi}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Symptoms:</span>
                  <strong className="text-slate-800">{test.patient.symptoms.length > 0 ? test.patient.symptoms.join(', ') : 'None'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Expected Tier:</span>
                  <strong className="text-sky-700">{test.expectedRisk}</strong>
                </div>
              </div>

              {/* Evaluation Drivers & Attribution */}
              <div className="mt-2.5 flex justify-between items-center text-2xs text-slate-600">
                <span>
                  <strong>Clinical Rationale:</strong> {act.whyThisResult}
                </span>
                <span className="text-slate-400 font-mono">
                  Confidence: {act.confidenceScore}% • Re-screen: {act.followUpDays}d
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom Case Simulation Sandbox */}
      <div className="card-box bg-slate-50 border-slate-200 p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={18} />
            <h3 className="text-xs font-bold text-slate-900">Interactive Clinical Sandbox (Live Parameter Testing)</h3>
          </div>
          <span className="text-2xs text-slate-500">Test edge case parameters in real time</span>
        </div>

        <div className="grid-4-col gap-3">
          <div className="form-group">
            <label className="text-2xs font-semibold text-slate-600">Systolic BP (mmHg)</label>
            <input 
              type="number" 
              value={customInput.systolic} 
              onChange={(e) => setCustomInput({ ...customInput, systolic: parseInt(e.target.value) || 120 })}
              className="form-input text-xs"
            />
          </div>
          <div className="form-group">
            <label className="text-2xs font-semibold text-slate-600">Diastolic BP (mmHg)</label>
            <input 
              type="number" 
              value={customInput.diastolic} 
              onChange={(e) => setCustomInput({ ...customInput, diastolic: parseInt(e.target.value) || 80 })}
              className="form-input text-xs"
            />
          </div>
          <div className="form-group">
            <label className="text-2xs font-semibold text-slate-600">Blood Glucose (mg/dL)</label>
            <input 
              type="number" 
              value={customInput.glucose} 
              onChange={(e) => setCustomInput({ ...customInput, glucose: parseInt(e.target.value) || 90 })}
              className="form-input text-xs"
            />
          </div>
          <div className="form-group">
            <label className="text-2xs font-semibold text-slate-600">Age & BMI</label>
            <div className="flex gap-1">
              <input 
                type="number" 
                placeholder="Age" 
                value={customInput.age} 
                onChange={(e) => setCustomInput({ ...customInput, age: parseInt(e.target.value) || 0 })}
                className="form-input text-xs w-1/2"
              />
              <input 
                type="number" 
                placeholder="BMI" 
                value={customInput.bmi} 
                onChange={(e) => setCustomInput({ ...customInput, bmi: parseFloat(e.target.value) || 22 })}
                className="form-input text-xs w-1/2"
              />
            </div>
          </div>
        </div>

        {/* Real-time Sandbox Output */}
        <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-3xs font-bold text-slate-400 uppercase">Live Output:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge badge-risk-${customEvaluation.overallRiskLevel.toLowerCase()} text-xs`}>
                {customEvaluation.overallRiskLevel} Risk
              </span>
              <span className="text-2xs text-slate-600 font-semibold">({customEvaluation.riskPercentage}% Score • {customEvaluation.confidenceScore}% Confidence)</span>
            </div>
            <p className="text-2xs text-slate-500 mt-1">{customEvaluation.whyThisResult}</p>
          </div>

          <div className="text-right text-2xs text-slate-500">
            <div>Referral Required: <strong>{customEvaluation.requiresReferral ? 'Yes (' + customEvaluation.referralUrgency + ')' : 'No'}</strong></div>
            <div>Suggested Re-screening: <strong>{customEvaluation.followUpDays} Days</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
