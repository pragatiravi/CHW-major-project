import { Fragment, useState } from 'react';
import { 
  X, 
  BrainCircuit, 
  Heart, 
  Activity,
  CheckCircle2, 
  Hospital, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  Save,
  Sparkles
} from 'lucide-react';
import { assessPatientRisk, ML_MODELS } from '../../utils/predictionEngine';

export default function GuidedScreeningWizard({
  patients = [],
  onSavePatient,
  onOpenCounselling,
  onOpenReferral,
  onClose
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedModel] = useState(ML_MODELS.ENSEMBLE_CLINICAL);

  // Form State
  const [formData, setFormData] = useState(() => ({
    id: 'P' + Math.floor(1000 + Math.random() * 9000),
    name: '',
    age: 48,
    gender: 'female',
    address: 'Sector 4, Central Health Zone',
    phone: '+91 98450 00000',
    systolic: 138,
    diastolic: 88,
    glucose: 145,
    glucoseType: 'random',
    bmi: 26.5,
    weight: 70,
    height: 162,
    heartRate: 78,
    symptoms: [],
    familyHistory: true,
    smoking: false,
    alcohol: false,
    activeLifestyle: false,
    assignedCHW: 'Sunita Patil',
    dateRegistered: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    syncStatus: 'synced',
    medicines: [],
    referral: null,
    reports: [],
    counsellingHistory: []
  }));

  const availableSymptoms = [
    { id: 'chest_pain', label: 'Chest Pain / Angina', critical: true, desc: 'Potential myocardial strain' },
    { id: 'headache', label: 'Severe Headache', desc: 'Hypertensive vascular symptom' },
    { id: 'dizziness', label: 'Dizziness / Vertigo', desc: 'Cerebral perfusion variance' },
    { id: 'polyuria', label: 'Frequent Urination (Polyuria)', desc: 'Osmotic diuresis indicator' },
    { id: 'polydipsia', label: 'Excessive Thirst (Polydipsia)', desc: 'Hyperglycemic cellular thirst' },
    { id: 'blurred_vision', label: 'Blurred Vision', desc: 'Osmotic lens swelling' },
    { id: 'fatigue', label: 'Chronic Fatigue', desc: 'Impaired glucose cellular uptake' }
  ];

  const steps = [
    { num: 1, title: 'Patient' },
    { num: 2, title: 'Vitals' },
    { num: 3, title: 'Symptoms' },
    { num: 4, title: 'History' },
    { num: 5, title: 'Lifestyle' },
    { num: 6, title: 'Assessment' },
    { num: 7, title: 'Action' }
  ];

  const handleSelectExistingPatient = (e) => {
    const pId = e.target.value;
    setSelectedPatientId(pId);
    if (!pId) return;

    const matched = patients.find(p => p.id === pId);
    if (matched) {
      setFormData({
        ...matched,
        systolic: matched.systolic || 130,
        diastolic: matched.diastolic || 85,
        glucose: matched.glucose || 130
      });
    }
  };

  const handleSymptomToggle = (symptomId) => {
    setFormData(prev => {
      const exists = prev.symptoms.includes(symptomId);
      const nextSymptoms = exists 
        ? prev.symptoms.filter(s => s !== symptomId)
        : [...prev.symptoms, symptomId];
      return { ...prev, symptoms: nextSymptoms };
    });
  };

  const calculateBMI = (w, h) => {
    if (!w || !h || h <= 0) return 22;
    const heightInMeters = h / 100;
    return parseFloat((w / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const handleWeightHeightChange = (w, h) => {
    const computedBMI = calculateBMI(w, h);
    setFormData(prev => ({ ...prev, weight: w, height: h, bmi: computedBMI }));
  };

  // Run assessment on current form state
  const evaluation = assessPatientRisk(formData, selectedModel);
  const overallRisk = evaluation.overallRiskLevel;
  const isHighRisk = overallRisk === 'High' || overallRisk === 'Critical' || formData.systolic >= 180;

  const handleCompleteScreening = () => {
    const finalRecord = {
      ...formData,
      evaluation,
      name: formData.name.trim() || `Patient ${formData.id}`
    };
    onSavePatient(finalRecord);
    onClose();
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300' };
      case 'High': return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' };
      case 'Moderate': return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' };
      default: return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' };
    }
  };

  const riskTheme = getRiskColor(overallRisk);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="wizard-fullpage-container w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Guided Clinical Screening Wizard</h2>
              <p className="text-2xs text-slate-500">7-Step Frontline Decision Support Protocol</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close screening wizard"><X size={16} /></button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="wizard-stepper-bar">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;
            return (
              <Fragment key={s.num}>
                <div className={`wizard-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="wizard-step-circle">
                    {isCompleted ? <CheckCircle2 size={16} /> : s.num}
                  </div>
                  <span className="wizard-step-title">{s.title}</span>
                </div>
                {idx < steps.length - 1 && <div className="wizard-step-divider" />}
              </Fragment>
            );
          })}
        </div>

        {/* Wizard Body Content */}
        <div className="wizard-body overflow-y-auto flex-1 p-6">
          {/* STEP 1: PATIENT SELECTION / DEMOGRAPHICS */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Step 1: Patient Information</h3>
                <p className="text-xs text-slate-500">Select an existing registered community patient or enter new details.</p>
              </div>

              {patients.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Registered Patient (Optional)</label>
                  <select 
                    value={selectedPatientId} 
                    onChange={handleSelectExistingPatient}
                    className="form-input text-xs"
                  >
                    <option value="">-- Create or Enter New Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) • Age {p.age} • {p.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid-2-col gap-3">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient ID</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    readOnly
                    className="form-input text-xs bg-slate-100 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid-3-col gap-3">
                <div className="form-group">
                  <label className="form-label">Age (Years) *</label>
                  <input 
                    type="number" 
                    value={formData.age} 
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 30 })}
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    value={formData.gender} 
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="form-input text-xs"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Village / Community Sector</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: VITALS & BIOMETRICS */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Step 2: Collect Vitals & Biometrics</h3>
                <p className="text-xs text-slate-500">Record blood pressure, blood glucose, and body mass measurements.</p>
              </div>

              <div className="grid-2-col gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-sky-50/50 space-y-2">
                  <span className="text-xs font-bold text-sky-900 block flex items-center gap-1.5">
                    <Heart size={16} className="text-sky-600" /> Blood Pressure (mmHg)
                  </span>
                  <div className="grid-2-col gap-2">
                    <div className="form-group">
                      <label className="form-label text-2xs">Systolic</label>
                      <input 
                        type="number" 
                        value={formData.systolic} 
                        onChange={(e) => setFormData({ ...formData, systolic: parseFloat(e.target.value) || 120 })}
                        className="form-input text-sm font-bold text-sky-950"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-2xs">Diastolic</label>
                      <input 
                        type="number" 
                        value={formData.diastolic} 
                        onChange={(e) => setFormData({ ...formData, diastolic: parseFloat(e.target.value) || 80 })}
                        className="form-input text-sm font-bold text-sky-950"
                      />
                    </div>
                  </div>
                  <span className="text-2xs text-slate-500 block">
                    Category: <strong>{formData.systolic >= 140 ? 'Hypertensive Range' : (formData.systolic >= 120 ? 'Elevated' : 'Normal')}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/50 space-y-2">
                  <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                    <Activity size={16} className="text-amber-600" /> Blood Glucose (mg/dL)
                  </span>
                  <div className="grid-2-col gap-2">
                    <div className="form-group">
                      <label className="form-label text-2xs">Glucose Value</label>
                      <input 
                        type="number" 
                        value={formData.glucose} 
                        onChange={(e) => setFormData({ ...formData, glucose: parseFloat(e.target.value) || 100 })}
                        className="form-input text-sm font-bold text-amber-950"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-2xs">Reading Type</label>
                      <select 
                        value={formData.glucoseType} 
                        onChange={(e) => setFormData({ ...formData, glucoseType: e.target.value })}
                        className="form-input text-xs"
                      >
                        <option value="random">Random</option>
                        <option value="fasting">Fasting</option>
                        <option value="post_meal">Post Meal</option>
                      </select>
                    </div>
                  </div>
                  <span className="text-2xs text-slate-500 block">
                    Category: <strong>{formData.glucose >= 200 ? 'Diabetic Range' : (formData.glucose >= 140 ? 'Prediabetic' : 'Normal')}</strong>
                  </span>
                </div>
              </div>

              <div className="grid-3-col gap-3 pt-2">
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={formData.weight} 
                    onChange={(e) => handleWeightHeightChange(parseFloat(e.target.value) || 60, formData.height)}
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input 
                    type="number" 
                    value={formData.height} 
                    onChange={(e) => handleWeightHeightChange(formData.weight, parseFloat(e.target.value) || 160)}
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Calculated BMI</label>
                  <input 
                    type="text" 
                    value={`${formData.bmi} kg/m²`} 
                    readOnly
                    className="form-input text-xs bg-slate-100 font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SYMPTOMS CHECKLIST */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Step 3: Presenting Symptoms</h3>
                <p className="text-xs text-slate-500">Check any symptoms the patient currently reports.</p>
              </div>

              <div className="space-y-2">
                {availableSymptoms.map(sym => {
                  const isChecked = formData.symptoms.includes(sym.id);
                  return (
                    <div 
                      key={sym.id}
                      onClick={() => handleSymptomToggle(sym.id)}
                      className={`p-3 rounded-lg border transition-colors flex justify-between items-center cursor-pointer ${
                        isChecked 
                          ? (sym.critical ? 'border-rose-300 bg-rose-50' : 'border-sky-300 bg-sky-50') 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <strong className="text-xs text-slate-900 block">{sym.label}</strong>
                        <span className="text-2xs text-slate-500">{sym.desc}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} 
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: MEDICAL HISTORY */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Step 4: Medical History</h3>
                <p className="text-xs text-slate-500">Assess chronic disease pre-disposition and family history.</p>
              </div>

              <div className="space-y-3">
                <div 
                  onClick={() => setFormData({ ...formData, familyHistory: !formData.familyHistory })}
                  className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${formData.familyHistory ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                >
                  <div>
                    <strong className="text-xs text-slate-900 block">Family History of Diabetes / Hypertension</strong>
                    <span className="text-2xs text-slate-500">Parents or siblings diagnosed with chronic cardiovascular disease</span>
                  </div>
                  <input type="checkbox" checked={formData.familyHistory} onChange={() => {}} className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LIFESTYLE FACTORS */}
          {currentStep === 5 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Step 5: Lifestyle Assessment</h3>
                <p className="text-xs text-slate-500">Physical activity and behavioral risk habits.</p>
              </div>

              <div className="space-y-3">
                <div 
                  onClick={() => setFormData({ ...formData, smoking: !formData.smoking })}
                  className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer ${formData.smoking ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
                >
                  <div>
                    <strong className="text-xs text-slate-900 block">Tobacco / Beedi / Cigarette Usage</strong>
                    <span className="text-2xs text-slate-500">Active or regular tobacco smoking or chewing</span>
                  </div>
                  <input type="checkbox" checked={formData.smoking} onChange={() => {}} className="w-4 h-4" />
                </div>

                <div 
                  onClick={() => setFormData({ ...formData, activeLifestyle: !formData.activeLifestyle })}
                  className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer ${formData.activeLifestyle ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                >
                  <div>
                    <strong className="text-xs text-slate-900 block">Regular Daily Physical Activity</strong>
                    <span className="text-2xs text-slate-500">At least 30 minutes of walking, farming, or active exercise</span>
                  </div>
                  <input type="checkbox" checked={formData.activeLifestyle} onChange={() => {}} className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CRYSTAL-CLEAR AI ASSESSMENT RESULT */}
          {currentStep === 6 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <span className="text-2xs font-bold text-sky-700 uppercase tracking-wider block">Decision Support Result</span>
                <h3 className="text-xl font-bold text-slate-900">Clinical Risk Stratification</h3>
                <p className="text-xs text-slate-500">AHA & ADA Guideline-Aligned Risk Evaluation</p>
              </div>

              {/* Overall Risk Card */}
              <div className={`p-5 rounded-2xl border ${riskTheme.border} ${riskTheme.bg} flex justify-between items-center`}>
                <div>
                  <span className="text-2xs uppercase font-bold text-slate-600 block">Stratified Risk Tier</span>
                  <div className={`text-2xl font-extrabold ${riskTheme.text} mt-0.5`}>
                    {overallRisk} Risk
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    {evaluation.whyThisResult}
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge badge-neutral text-2xs font-mono">Confidence: {evaluation.confidenceScore}%</span>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    Follow-up: <strong>{evaluation.followUpDays} Days</strong>
                  </div>
                </div>
              </div>

              {/* Hypertension vs Diabetes Cards */}
              <div className="grid-2-col gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                      <Heart size={16} className="text-sky-600" /> Hypertension Risk
                    </strong>
                    <span className="text-xs font-bold text-sky-700">{evaluation.hypertension?.riskScore}%</span>
                  </div>
                  <p className="text-2xs text-slate-600 font-semibold">{evaluation.hypertension?.category}</p>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-sky-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(evaluation.hypertension?.riskScore || 0, 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                      <Activity size={16} className="text-amber-600" /> Diabetes Risk
                    </strong>
                    <span className="text-xs font-bold text-amber-700">{evaluation.diabetes?.riskScore}%</span>
                  </div>
                  <p className="text-2xs text-slate-600 font-semibold">{evaluation.diabetes?.category}</p>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(evaluation.diabetes?.riskScore || 0, 100)}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Key Contributing Factors */}
              <div className="card-box p-4 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-sky-600" /> Key Contributing Clinical Factors
                </h4>

                <div className="space-y-2">
                  {[...(evaluation.hypertension?.explanations || []), ...(evaluation.diabetes?.explanations || [])].slice(0, 4).map((exp, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-white p-2.5 rounded border border-slate-200">
                      <div>
                        <strong className="text-slate-900">{exp.feature}</strong>
                        <span className="text-2xs text-slate-500 block">{exp.detail}</span>
                      </div>
                      <span className={`badge ${exp.impact === 'High Impact' ? 'badge-risk-high' : 'badge-risk-moderate'} text-3xs`}>
                        {exp.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: CLINICAL ACTION & DISPATCH */}
          {currentStep === 7 && (
            <div className="space-y-5 max-w-xl mx-auto text-center">
              <div>
                <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-slate-900">Step 7: Recommended Clinical Actions</h3>
                <p className="text-xs text-slate-500 mt-1">Select appropriate community follow-up for {formData.name || 'this patient'}.</p>
              </div>

              <div className="space-y-3 text-left">
                {isHighRisk && (
                  <button 
                    className="w-full p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors flex justify-between items-center text-left"
                    onClick={() => {
                      const finalRecord = { ...formData, evaluation, name: formData.name.trim() || `Patient ${formData.id}` };
                      onSavePatient(finalRecord);
                      onOpenReferral(finalRecord);
                    }}
                  >
                    <div>
                      <strong className="text-xs text-rose-900 block flex items-center gap-1">
                        <Hospital size={16} /> Generate Urgent Hospital Referral
                      </strong>
                      <span className="text-2xs text-rose-700">Routes patient record to District Hospital Doctor triage queue</span>
                    </div>
                    <ArrowRight size={16} className="text-rose-600" />
                  </button>
                )}

                <button 
                  className="w-full p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors flex justify-between items-center text-left"
                  onClick={() => {
                    const finalRecord = { ...formData, evaluation, name: formData.name.trim() || `Patient ${formData.id}` };
                    onSavePatient(finalRecord);
                    onOpenCounselling(finalRecord);
                  }}
                >
                  <div>
                    <strong className="text-xs text-emerald-900 block flex items-center gap-1">
                      <BookOpen size={16} /> Conduct ThinkLets Counselling Session
                    </strong>
                    <span className="text-2xs text-emerald-700">Deliver structured lifestyle modification guidance</span>
                  </div>
                  <ArrowRight size={16} className="text-emerald-600" />
                </button>

                <button 
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center text-left"
                  onClick={handleCompleteScreening}
                >
                  <div>
                    <strong className="text-xs text-slate-900 block flex items-center gap-1">
                      <Save size={16} /> Save Record & Return to Dashboard
                    </strong>
                    <span className="text-2xs text-slate-500">Record will be saved to local EMR registry</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="wizard-footer px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button 
            className="btn btn-secondary text-xs" 
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else onClose();
            }}
          >
            <ArrowLeft size={14} /> {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-2">
            {currentStep < 7 ? (
              <button 
                className="btn btn-primary text-xs font-bold" 
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                className="btn btn-primary text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCompleteScreening}
              >
                Complete Screening
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
