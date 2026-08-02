import React, { useState } from 'react';
import { X, UserPlus, Save, Activity, Upload, AlertCircle } from 'lucide-react';
import { assessPatientRisk } from '../../utils/predictionEngine';

export default function PatientRegistrationModal({ onClose, onSavePatient, initialData = null }) {
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
    { id: 'polyuria', label: 'Polyuria (Frequent Urination)' },
    { id: 'polydipsia', label: 'Polydipsia (Excessive Thirst)' },
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
      alert('Please enter patient full name');
      return;
    }
    
    // Evaluate risk automatically using prediction engine
    const evaluation = assessPatientRisk(formData);
    const completeRecord = {
      ...formData,
      evaluation
    };

    onSavePatient(completeRecord);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <UserPlus className="text-indigo-400" size={22} />
            <h2>{initialData ? 'Update Patient Record' : 'Register New Patient'}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Demographics Section */}
          <div className="form-section">
            <h3 className="form-section-title">1. Patient Demographics</h3>
            <div className="grid-3-col">
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Age (Years) *</label>
                <input 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="form-input"
                  min={1}
                  max={120}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select 
                  value={formData.gender} 
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="form-input"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid-2-col mt-2">
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Residential Address / Sector</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House #, Village/Sector Name"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Clinical Vital Signs Section */}
          <div className="form-section mt-4">
            <h3 className="form-section-title">2. Vital Signs & Body Measurements</h3>
            <div className="grid-4-col">
              <div className="form-group">
                <label>Systolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={formData.systolic} 
                  onChange={(e) => setFormData({ ...formData, systolic: parseInt(e.target.value) || 120 })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Diastolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={formData.diastolic} 
                  onChange={(e) => setFormData({ ...formData, diastolic: parseInt(e.target.value) || 80 })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Blood Glucose (mg/dL)</label>
                <input 
                  type="number" 
                  value={formData.glucose} 
                  onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || 90 })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Glucose Measurement Type</label>
                <select 
                  value={formData.glucoseType} 
                  onChange={(e) => setFormData({ ...formData, glucoseType: e.target.value })}
                  className="form-input"
                >
                  <option value="random">Random Glucose</option>
                  <option value="fasting">Fasting Glucose</option>
                  <option value="postprandial">Post-Prandial (2hr)</option>
                </select>
              </div>
            </div>

            <div className="grid-4-col mt-2">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input 
                  type="number" 
                  value={formData.weight} 
                  onChange={(e) => handleWeightHeightChange(parseFloat(e.target.value) || 0, formData.height)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Height (cm)</label>
                <input 
                  type="number" 
                  value={formData.height} 
                  onChange={(e) => handleWeightHeightChange(formData.weight, parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Calculated BMI (kg/m²)</label>
                <input 
                  type="text" 
                  value={formData.bmi} 
                  disabled 
                  className="form-input bg-secondary font-bold text-indigo-400"
                />
              </div>

              <div className="form-group">
                <label>Heart Rate (BPM)</label>
                <input 
                  type="number" 
                  value={formData.heartRate} 
                  onChange={(e) => setFormData({ ...formData, heartRate: parseInt(e.target.value) || 75 })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div className="form-section mt-4">
            <h3 className="form-section-title">3. Presenting Symptoms & Risk Factors</h3>
            <div className="symptoms-checkbox-grid">
              {availableSymptoms.map((sym) => (
                <label key={sym.id} className={`checkbox-card ${formData.symptoms.includes(sym.id) ? 'checked' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={formData.symptoms.includes(sym.id)} 
                    onChange={() => handleSymptomToggle(sym.id)}
                  />
                  <span>{sym.label}</span>
                  {sym.critical && <span className="text-xs text-red-400 font-bold ml-1">(CRITICAL)</span>}
                </label>
              ))}
            </div>

            <div className="grid-4-col mt-3">
              <label className="toggle-switch-card">
                <span>Family History of HTN/Diabetes</span>
                <input 
                  type="checkbox" 
                  checked={formData.familyHistory} 
                  onChange={(e) => setFormData({ ...formData, familyHistory: e.target.checked })}
                />
              </label>

              <label className="toggle-switch-card">
                <span>Active Tobacco Smoker</span>
                <input 
                  type="checkbox" 
                  checked={formData.smoking} 
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.checked })}
                />
              </label>

              <label className="toggle-switch-card">
                <span>Alcohol Consumption</span>
                <input 
                  type="checkbox" 
                  checked={formData.alcohol} 
                  onChange={(e) => setFormData({ ...formData, alcohol: e.target.checked })}
                />
              </label>

              <label className="toggle-switch-card">
                <span>Physically Active Lifestyle</span>
                <input 
                  type="checkbox" 
                  checked={formData.activeLifestyle} 
                  onChange={(e) => setFormData({ ...formData, activeLifestyle: e.target.checked })}
                />
              </label>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="modal-footer mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex items-center gap-1">
              <Save size={16} /> Save Patient Record & Run AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
