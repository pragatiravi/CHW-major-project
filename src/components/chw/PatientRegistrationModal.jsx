import React, { useState } from 'react';
import { X, UserPlus, Save, Activity, AlertCircle } from 'lucide-react';
import { assessPatientRisk } from '../../utils/predictionEngine';
import { useToast } from '../shared/ToastContainer';

export default function PatientRegistrationModal({ onClose, onSavePatient, initialData = null }) {
  const { toastError, toastSuccess } = useToast();
  const [formData, setFormData] = useState({
    id: initialData?.id || 'P' + Math.floor(1000 + Math.random() * 9000),
    name: initialData?.name || '',
    age: initialData?.age || 45,
    gender: initialData?.gender || 'female',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    systolic: initialData?.systolic || 130,
    diastolic: initialData?.diastolic || 85,
    glucose: initialData?.glucose || 140,
    glucoseType: initialData?.glucoseType || 'random',
    bmi: initialData?.bmi || 25.5,
    weight: initialData?.weight || 68,
    height: initialData?.height || 163,
    heartRate: initialData?.heartRate || 78,
    symptoms: initialData?.symptoms || [],
    familyHistory: initialData?.familyHistory ?? true,
    smoking: initialData?.smoking ?? false,
    alcohol: initialData?.alcohol ?? false,
    activeLifestyle: initialData?.activeLifestyle ?? true,
    assignedCHW: initialData?.assignedCHW || 'Sunita Patil',
    dateRegistered: initialData?.dateRegistered || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    syncStatus: 'synced',
    medicines: initialData?.medicines || [],
    referral: initialData?.referral || null,
    reports: initialData?.reports || [],
    counsellingHistory: initialData?.counsellingHistory || []
  });

  const availableSymptoms = [
    { id: 'chest_pain', label: 'Chest Pain / Angina', critical: true },
    { id: 'headache', label: 'Severe Headache' },
    { id: 'dizziness', label: 'Dizziness / Vertigo' },
    { id: 'polyuria', label: 'Frequent Urination (Polyuria)' },
    { id: 'polydipsia', label: 'Excessive Thirst (Polydipsia)' },
    { id: 'blurred_vision', label: 'Blurred Vision' },
    { id: 'fatigue', label: 'Chronic Fatigue' }
  ];

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Please enter patient full name');
      return;
    }
    
    // Evaluate risk automatically using prediction engine
    const evaluation = assessPatientRisk(formData);
    const completeRecord = {
      ...formData,
      name: formData.name.trim(),
      evaluation
    };

    onSavePatient(completeRecord);
    onClose();
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
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{initialData ? 'Update Patient Record' : 'Register New Patient'}</h2>
              <p className="text-2xs text-slate-500">Record community member demographic and baseline health profile</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Demographics Section */}
          <div className="space-y-3">
            <span className="metric-label text-2xs uppercase block">1. Patient Demographics</span>
            <div className="grid-3-col gap-3">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age (Years) *</label>
                <input 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="form-input text-xs"
                  min={1}
                  max={120}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
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
            </div>

            <div className="grid-2-col gap-3">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Village / Community Sector</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House #, Village/Sector Name"
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Vitals Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="metric-label text-2xs uppercase block">2. Baseline Vitals & Measurements</span>
            <div className="grid-4-col gap-3">
              <div className="form-group">
                <label className="form-label">Systolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={formData.systolic} 
                  onChange={(e) => setFormData({ ...formData, systolic: parseInt(e.target.value) || 120 })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diastolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={formData.diastolic} 
                  onChange={(e) => setFormData({ ...formData, diastolic: parseInt(e.target.value) || 80 })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Glucose (mg/dL)</label>
                <input 
                  type="number" 
                  value={formData.glucose} 
                  onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || 90 })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Measurement Type</label>
                <select 
                  value={formData.glucoseType} 
                  onChange={(e) => setFormData({ ...formData, glucoseType: e.target.value })}
                  className="form-input text-xs"
                >
                  <option value="random">Random Glucose</option>
                  <option value="fasting">Fasting Glucose</option>
                  <option value="postprandial">Post-Prandial</option>
                </select>
              </div>
            </div>

            <div className="grid-3-col gap-3">
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input 
                  type="number" 
                  value={formData.weight} 
                  onChange={(e) => handleWeightHeightChange(parseFloat(e.target.value) || 0, formData.height)}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input 
                  type="number" 
                  value={formData.height} 
                  onChange={(e) => handleWeightHeightChange(formData.weight, parseFloat(e.target.value) || 0)}
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

          {/* Symptoms Checklist */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="metric-label text-2xs uppercase block">3. Presenting Symptoms</span>
            <div className="grid-2-col gap-2">
              {availableSymptoms.map((sym) => (
                <label 
                  key={sym.id} 
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                    formData.symptoms.includes(sym.id) 
                      ? 'border-sky-300 bg-sky-50 font-bold text-sky-950' 
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span>{sym.label} {sym.critical && <span className="text-rose-600 font-bold text-3xs">(CRITICAL)</span>}</span>
                  <input 
                    type="checkbox" 
                    checked={formData.symptoms.includes(sym.id)} 
                    onChange={() => handleSymptomToggle(sym.id)}
                    className="w-4 h-4 text-sky-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs font-bold flex items-center gap-1">
              <Save size={14} /> Save Patient Record & Run CDSS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
