import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  Pill, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  PhoneCall, 
  Bot, 
  Users, 
  Camera, 
  MapPin, 
  CheckCircle, 
  Volume2, 
  Languages, 
  Send, 
  Download, 
  Clock,
  Plus,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { exportPatientSummaryPDF } from '../../utils/pdfExport';

export default function PatientPortal({ patientRecord, patients = [], onSavePatient }) {
  // Default to first patient if patientRecord is not passed
  const activePatient = patientRecord || patients[0] || {
    id: 'P7204',
    name: 'Priya Sharma',
    age: 54,
    gender: 'FEMALE',
    village: 'Vimanapura Sector 3',
    phone: '+91 98450 12345',
    systolic: 142,
    diastolic: 92,
    glucose: 155,
    glucoseType: 'fasting',
    bmi: 27.4,
    medicines: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once Daily (Morning)', time: '08:00 AM', takenToday: true },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice Daily', time: '08:00 AM & 08:00 PM', takenToday: false }
    ],
    evaluation: {
      hypertension: { category: 'Stage 2 Hypertension', score: 68 },
      diabetes: { category: 'Diabetic Range', score: 62 },
      overallRisk: 'Moderate'
    }
  };

  const [activeTab, setActiveTab] = useState('overview'); // overview, medicines, ocr, chatbot, family, appointments, tips
  const [language, setLanguage] = useState('en'); // 'en' | 'kn' (Kannada)
  const [sosTriggered, setSosTriggered] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: language === 'kn' 
        ? 'ನಮಸ್ಕಾರ ಪ್ರಿಯಾ ಶರ್ಮಾ! ನಾನು ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಔಷಧಿಗಳ ಬಗ್ಗೆ ಏನೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಕೇಳಿ.' 
        : 'Hello Priya! I am your AI Health Assistant. Ask me any question about your Blood Pressure, Diabetes, or Medicines.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // OCR Scan State
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Family Members State
  const [familyMembers, setFamilyMembers] = useState([
    { id: 'FAM-1', name: 'Ramesh Sharma (Husband)', age: 58, risk: 'High Risk (BP 152/98)', status: 'Follow-up Due' },
    { id: 'FAM-2', name: 'Anita Sharma (Daughter)', age: 26, risk: 'Low Risk (Normal)', status: 'Healthy' }
  ]);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamName, setNewFamName] = useState('');
  const [newFamRelation, setNewFamRelation] = useState('');
  const [newFamAge, setNewFamAge] = useState('');

  // Medication Checklist State
  const [medicines, setMedicines] = useState(activePatient.medicines || []);

  // Handlers
  const toggleMedication = (index) => {
    const updated = [...medicines];
    updated[index].takenToday = !updated[index].takenToday;
    setMedicines(updated);
  };

  const handleSosClick = () => {
    setSosTriggered(true);
    alert('🚨 EMERGENCY SOS SENT!\n\nYour GPS Location (18.5204° N, 73.8567° E) and Emergency Alert has been dispatched to:\n1. CHW Agent Sunita Patil (+91 98765 43210)\n2. Primary Health Center Emergency Desk\n3. Emergency Ambulance Hotline (108)');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Simulated AI response logic
    setTimeout(() => {
      let botResponse = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('bp') || lower.includes('blood pressure')) {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ BP 142/92 mmHg (Stage 2). ಉಪ್ಪಿನ ಸೇವನೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಆಮ್ಲೋಡಿಪಿನ್ 5mg ಔಷಧಿಯನ್ನು ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಿ.'
          : 'Your latest BP is 142/92 mmHg (Stage 2). Please reduce salt intake, drink plenty of water, and take Amlodipine 5mg at 8:00 AM daily.';
      } else if (lower.includes('sugar') || lower.includes('glucose') || lower.includes('diabetes')) {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಉಪವಾಸದ ಗ್ಲೂಕೋಸ್ 155 mg/dL ಇದೆ. ಸಿಹಿ ಪದಾರ್ಥಗಳನ್ನು ತ್ಯಜಿಸಿ ಮತ್ತು ದಿನವೂ 30 ನಿಮಿಷ ನಡಿಗೆ ಮಾಡಿ.'
          : 'Your fasting sugar is 155 mg/dL. Avoid refined sugars, eat high-fiber meals, and do a 30-minute daily walk.';
      } else if (lower.includes('medicine') || lower.includes('tablet') || lower.includes('dose')) {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಆಮ್ಲೋಡಿಪಿನ್ 5mg ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಮೆಟ್‌ಫಾರ್ಮಿನ್ 500mg ರಾತ್ರಿ ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಬೇಕು.'
          : 'Your daily schedule: Amlodipine 5mg in the morning at 8:00 AM, and Metformin 500mg after dinner at 8:00 PM.';
      } else {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಯಮಿತವಾಗಿ CHW ಭೇಟಿ ನೀಡಿ.'
          : 'I have logged your health query. Based on your records, your health is stable under Moderate risk monitoring. Reach out to your CHW anytime.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 800);
  };

  const handleSimulateOcr = () => {
    setScanning(true);
    setOcrResult(null);
    setTimeout(() => {
      setScanning(false);
      setOcrResult({
        doctor: 'Dr. Ananya Roy (District Medical Officer)',
        scannedDate: '2026-07-28',
        extractedMedicines: [
          { name: 'Amlodipine Besylate', dosage: '5 mg', timing: 'Once daily' },
          { name: 'Metformin Hydrochloride', dosage: '500 mg', timing: 'Twice daily' },
          { name: 'Atorvastatin', dosage: '10 mg', timing: 'At bedtime' }
        ],
        notes: 'Patient advised 30-minute morning walk and low sodium diet.'
      });
    }, 1800);
  };

  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    if (!newFamName.trim()) return;
    const newMember = {
      id: `FAM-${Date.now()}`,
      name: `${newFamName} (${newFamRelation || 'Family Member'})`,
      age: parseInt(newFamAge) || 30,
      risk: 'Low Risk (Routine)',
      status: 'Registered'
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setNewFamName('');
    setNewFamRelation('');
    setNewFamAge('');
    setShowAddFamily(false);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = language === 'kn' ? 'kn-IN' : 'en-US';
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="portal-container space-y-4">
      {/* Patient Header Banner */}
      <div className="portal-header-banner bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="portal-badge-icon bg-sky-500/20 text-sky-400">
            <Heart size={28} className="animate-pulse text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="portal-title">{activePatient.name}</h1>
              <span className="badge badge-primary text-xs">{activePatient.id}</span>
            </div>
            <p className="portal-subtitle">
              {activePatient.age} Yrs • {activePatient.gender} • {activePatient.village}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            className="btn btn-secondary text-xs flex items-center gap-1 bg-slate-800 border-slate-700 text-sky-300"
            onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          >
            <Languages size={15} />
            <span>{language === 'en' ? 'English ➔ ಕನ್ನಡ' : 'ಕನ್ನಡ ➔ English'}</span>
          </button>

          {/* Download PDF Report */}
          <button 
            className="btn btn-secondary text-xs flex items-center gap-1"
            onClick={() => exportPatientSummaryPDF(activePatient)}
          >
            <Download size={15} /> Download Medical Passport
          </button>

          {/* Emergency SOS Button */}
          <button 
            className={`btn ${sosTriggered ? 'btn-error pulse' : 'bg-rose-600 hover:bg-rose-700 text-white'} text-xs font-bold flex items-center gap-1 shadow-lg`}
            onClick={handleSosClick}
          >
            <ShieldAlert size={16} /> 🚨 EMERGENCY SOS
          </button>
        </div>
      </div>

      {/* SOS Alert Banner */}
      {sosTriggered && (
        <div className="card-box bg-rose-950/80 border-rose-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PhoneCall className="animate-bounce text-rose-400" size={24} />
            <div>
              <strong className="text-sm">EMERGENCY ALERT BROADCASTED</strong>
              <p className="text-2xs text-rose-200">CHW Sunita Patil and District Ambulance Team notified with location coordinates.</p>
            </div>
          </div>
          <button className="btn btn-secondary text-xs" onClick={() => setSosTriggered(false)}>Dismiss</button>
        </div>
      )}

      {/* Tab Bar */}
      <div className="detail-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          🩺 {language === 'kn' ? 'ಆರೋಗ್ಯ ವಿವರ' : 'Health Overview'}
        </button>
        <button className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>
          💊 {language === 'kn' ? 'ಔಷಧಿಗಳು' : 'Medications & Pills'}
        </button>
        <button className={`tab-btn ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>
          🤖 {language === 'kn' ? 'AI ಆರೋಗ್ಯ ಚಾಟ್' : 'Ask AI Assistant'}
        </button>
        <button className={`tab-btn ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => setActiveTab('ocr')}>
          📷 {language === 'kn' ? 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನರ್' : 'Prescription OCR Scanner'}
        </button>
        <button className={`tab-btn ${activeTab === 'family' ? 'active' : ''}`} onClick={() => setActiveTab('family')}>
          👨‍👩‍👧‍👦 {language === 'kn' ? 'ಕುಟುಂಬ ಆರೋಗ್ಯ' : 'Household Members'}
        </button>
        <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
          📅 {language === 'kn' ? 'ಭೇಟಿ ವೇಳಾಪಟ್ಟಿ' : 'Appointments & PHCs'}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* 1. HEALTH OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid-3-col gap-3">
              <div className="card-box bg-slate-900 border-sky-800">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xs font-semibold uppercase text-slate-400">Blood Pressure</span>
                    <div className="text-2xl font-extrabold text-sky-400 mt-1">{activePatient.systolic}/{activePatient.diastolic} <span className="text-xs font-normal">mmHg</span></div>
                    <span className="badge badge-warning text-2xs mt-2">{activePatient.evaluation?.hypertension?.category || 'Stage 1 Hypertension'}</span>
                  </div>
                  <Activity size={24} className="text-sky-400" />
                </div>
              </div>

              <div className="card-box bg-slate-900 border-indigo-800">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xs font-semibold uppercase text-slate-400">Blood Glucose ({activePatient.glucoseType})</span>
                    <div className="text-2xl font-extrabold text-indigo-400 mt-1">{activePatient.glucose} <span className="text-xs font-normal">mg/dL</span></div>
                    <span className="badge badge-danger text-2xs mt-2">{activePatient.evaluation?.diabetes?.category || 'Pre-Diabetic Range'}</span>
                  </div>
                  <Heart size={24} className="text-indigo-400" />
                </div>
              </div>

              <div className="card-box bg-slate-900 border-emerald-800">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xs font-semibold uppercase text-slate-400">BMI & Risk Tier</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-1">{activePatient.bmi} <span className="text-xs font-normal">BMI</span></div>
                    <span className="badge badge-neutral text-2xs mt-2">Overall Risk: {activePatient.evaluation?.overallRisk || 'Moderate'}</span>
                  </div>
                  <Sparkles size={24} className="text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Personalized AI Clinical Guidance Card */}
            <div className="card-box bg-secondary border-indigo-900/60">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="text-sky-400" size={18} />
                  {language === 'kn' ? 'ನಿಮಗಾಗಿ AI ಆರೋಗ್ಯ ನೀಡುವ ಸಲಹೆಗಳು' : 'AI Personalized Health Advice'}
                </h3>
                <button className="btn btn-secondary text-2xs flex items-center gap-1" onClick={() => speakText(language === 'kn' ? 'ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ನಿಯಂತ್ರಣದಲ್ಲಿದೆ. ದಿನವೂ 30 ನಿಮಿಷ ನಡಿಗೆ ಮಾಡಿ.' : 'Your blood pressure requires moderate monitoring. Avoid high sodium foods.')}>
                  <Volume2 size={14} /> Listen Audio
                </button>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                <li>
                  {language === 'kn' 
                    ? 'ರಕ್ತದೊತ್ತಡ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಉಪ್ಪಿನ ಸೇವನೆಯನ್ನು ದಿನಕ್ಕೆ 5 ಗ್ರಾಂ ಗಿಂತ ಕಡಿಮೆಗೆ ಸೀಮಿತಗೊಳಿಸಿ.' 
                    : 'Limit daily salt intake to under 5g to maintain optimal blood pressure levels.'}
                </li>
                <li>
                  {language === 'kn' 
                    ? 'ಬೆಳಿಗ್ಗೆ 8:00 ಗಂಟೆಗೆ ತಪ್ಪದೇ ಆಮ್ಲೋಡಿಪಿನ್ 5mg ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ.' 
                    : 'Take Amlodipine 5mg promptly at 08:00 AM every morning with water.'}
                </li>
                <li>
                  {language === 'kn' 
                    ? 'ಮುಂದಿನ ಪರೀಕ್ಷೆಯು ಆಗಸ್ಟ್ 5, 2026 ಕ್ಕೆ ಸುನಿತಾ ಪಾಟೀಲ್ (CHW) ಅವರೊಂದಿಗೆ ನಿಗದಿಯಾಗಿದೆ.' 
                    : 'Next follow-up health screening scheduled for August 5, 2026 with CHW Sunita Patil.'}
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. MEDICATIONS & PILL REMINDERS */}
        {activeTab === 'medicines' && (
          <div className="card-box bg-secondary">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pill size={18} className="text-emerald-400" /> Daily Medication Adherence Tracker
                </h3>
                <p className="text-2xs text-slate-400">Mark pills as taken to keep your CHW & Doctor updated.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-bold">
                  {medicines.filter(m => m.takenToday).length} of {medicines.length} Taken Today
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={idx} className={`card-box bg-slate-900 border-slate-700 flex justify-between items-center ${med.takenToday ? 'border-emerald-600 bg-emerald-950/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <button className="text-emerald-400" onClick={() => toggleMedication(idx)}>
                      {med.takenToday ? <CheckCircle size={22} className="text-emerald-400" /> : <Clock size={22} className="text-slate-500" />}
                    </button>
                    <div>
                      <h4 className="text-sm font-bold text-white">{med.name} ({med.dosage})</h4>
                      <div className="text-2xs text-slate-400">{med.frequency} • Scheduled: {med.time}</div>
                    </div>
                  </div>
                  <button 
                    className={`btn text-xs ${med.takenToday ? 'btn-success-outline' : 'btn-primary'}`}
                    onClick={() => toggleMedication(idx)}
                  >
                    {med.takenToday ? '✓ Taken Today' : 'Mark Taken'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. AI HEALTH CHATBOT */}
        {activeTab === 'chatbot' && (
          <div className="card-box bg-secondary flex flex-col h-96">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
              <Bot className="text-sky-400" size={20} />
              <div>
                <h3 className="text-sm font-bold text-white">Ask Gemini Health Assistant</h3>
                <span className="text-2xs text-sky-400">Online • English & Kannada Support</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs text-xs ${msg.sender === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-700">
              <input 
                type="text" 
                placeholder={language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Ask about your symptoms, food, medicines...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="form-input text-xs flex-1"
              />
              <button type="submit" className="btn btn-primary text-xs flex items-center gap-1">
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        )}

        {/* 4. PRESCRIPTION OCR SCANNER */}
        {activeTab === 'ocr' && (
          <div className="card-box bg-secondary space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera size={18} className="text-indigo-400" /> Prescription & Lab Report OCR Scanner
              </h3>
              <p className="text-2xs text-slate-400">Scan paper prescriptions from local clinics to convert into digital records.</p>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-700 rounded-lg text-center bg-slate-900/50">
              <Camera size={36} className="mx-auto text-indigo-400 mb-2" />
              <p className="text-xs text-slate-300 mb-3">Upload or Capture Prescription Image</p>
              <button className="btn btn-primary text-xs flex items-center gap-2 mx-auto" onClick={handleSimulateOcr} disabled={scanning}>
                {scanning ? <RefreshCw size={14} className="spin-icon" /> : <Camera size={14} />}
                {scanning ? 'Scanning Image with AI OCR...' : 'Simulate Camera OCR Scan'}
              </button>
            </div>

            {ocrResult && (
              <div className="card-box bg-slate-900 border-indigo-500 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="badge badge-success text-2xs">✓ OCR Extraction Successful</span>
                  <span className="text-2xs text-slate-400">Date: {ocrResult.scannedDate}</span>
                </div>
                <strong className="text-xs text-white block">{ocrResult.doctor}</strong>
                <div className="text-2xs text-slate-300">
                  <span className="font-semibold text-indigo-400 block mb-1">Extracted Medications:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {ocrResult.extractedMedicines.map((m, idx) => (
                      <li key={idx}>{m.name} - {m.dosage} ({m.timing})</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. HOUSEHOLD FAMILY MEMBERS */}
        {activeTab === 'family' && (
          <div className="card-box bg-secondary">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-purple-400" /> Household Family Health Tracking
                </h3>
                <p className="text-2xs text-slate-400">Track health profiles of all family members under household ID #HH-409.</p>
              </div>
              <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => setShowAddFamily(!showAddFamily)}>
                <Plus size={14} /> Add Family Member
              </button>
            </div>

            {showAddFamily && (
              <form onSubmit={handleAddFamilyMember} className="card-box bg-slate-900 border-indigo-500 mb-3 space-y-2">
                <h4 className="text-xs font-bold text-indigo-400">Register Household Member</h4>
                <div className="grid-3-col gap-2">
                  <input type="text" placeholder="Full Name" value={newFamName} onChange={(e) => setNewFamName(e.target.value)} className="form-input text-xs" required />
                  <input type="text" placeholder="Relationship (e.g. Husband)" value={newFamRelation} onChange={(e) => setNewFamRelation(e.target.value)} className="form-input text-xs" required />
                  <input type="number" placeholder="Age" value={newFamAge} onChange={(e) => setNewFamAge(e.target.value)} className="form-input text-xs" required />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowAddFamily(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary text-xs">Save Member</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {familyMembers.map(fam => (
                <div key={fam.id} className="card-box bg-slate-900 border-slate-700 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">{fam.name}</h4>
                    <span className="text-2xs text-slate-400">Age {fam.age} • Status: {fam.status}</span>
                  </div>
                  <span className="badge badge-warning text-2xs">{fam.risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. APPOINTMENTS & PHCs */}
        {activeTab === 'appointments' && (
          <div className="card-box bg-secondary space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin size={18} className="text-rose-400" /> Nearest Primary Health Center (PHC) & Doctor Referral
              </h3>
            </div>

            <div className="grid-2-col gap-3">
              <div className="card-box bg-slate-900 border-slate-700">
                <span className="badge badge-success text-2xs mb-1">Approved Referral</span>
                <h4 className="text-sm font-bold text-white">Vimanapura Sub-District Hospital</h4>
                <p className="text-2xs text-slate-400 mt-1">Lead Doctor: Dr. Ananya Roy (M.D.)</p>
                <div className="text-xs text-sky-400 mt-2">📍 Distance: 3.2 km • Emergency Route Active</div>
              </div>

              <div className="card-box bg-slate-900 border-slate-700">
                <span className="badge badge-primary text-2xs mb-1">Scheduled CHW Visit</span>
                <h4 className="text-sm font-bold text-white">Home Screening Visit</h4>
                <p className="text-2xs text-slate-400 mt-1">CHW: Sunita Patil</p>
                <div className="text-xs text-emerald-400 mt-2">📅 Date: August 5, 2026 at 10:00 AM</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
