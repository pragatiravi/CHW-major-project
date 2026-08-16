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
  CheckCircle2, 
  Languages, 
  Send, 
  Clock, 
  Plus, 
  Sparkles, 
  Check,
  ShieldCheck
} from 'lucide-react';
import { exportPatientSummaryPDF } from '../../utils/pdfExport';
import { useToast } from '../shared/ToastContainer';

export default function PatientPortal({ patientRecord, patients = [], onSavePatient, activeSection = 'overview' }) {
  const { toastSuccess, toastInfo, toastWarning } = useToast();

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
      overallRiskLevel: 'Moderate'
    }
  };

  const [activeTab, setActiveTab] = useState(activeSection || 'overview');
  const [language, setLanguage] = useState('en'); // 'en' | 'kn'
  const [sosTriggered, setSosTriggered] = useState(false);
  const [medicines, setMedicines] = useState(activePatient.medicines || []);

  React.useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: language === 'kn' 
        ? 'ನಮಸ್ಕಾರ ಪ್ರಿಯಾ! ನಾನು ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಔಷಧಿಗಳ ಬಗ್ಗೆ ಏನೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಕೇಳಿ.' 
        : 'Hello Priya! I am your Health Assistant. Ask me any question about your Blood Pressure, Sugar levels, or Medicines.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // OCR Scanner State
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Household Members State
  const [familyMembers, setFamilyMembers] = useState([
    { id: 'FAM-1', name: 'Ramesh Sharma (Husband)', age: 58, risk: 'High Risk (BP 152/98)', status: 'Follow-up Due' },
    { id: 'FAM-2', name: 'Anita Sharma (Daughter)', age: 26, risk: 'Low Risk (Normal)', status: 'Healthy' }
  ]);

  const toggleMedication = (index) => {
    const updated = [...medicines];
    updated[index].takenToday = !updated[index].takenToday;
    setMedicines(updated);
    if (updated[index].takenToday) {
      toastSuccess(`Marked ${updated[index].name} as taken today!`);
    }
  };

  const handleSosClick = () => {
    setSosTriggered(true);
    toastWarning('Emergency SOS dispatched to CHW Sunita Patil and Emergency Ambulance (108)!');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let botResponse = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('bp') || lower.includes('blood pressure')) {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ BP 142/92 mmHg ಆಗಿದೆ. ಉಪ್ಪಿನ ಸೇವನೆ ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಆಮ್ಲೋಡಿಪಿನ್ 5mg ಔಷಧಿಯನ್ನು ಬೆಳಿಗ್ಗೆ ತೆಗೆದುಕೊಳ್ಳಿ.'
          : 'Your latest BP is 142/92 mmHg. Please limit dietary salt, stay hydrated, and take Amlodipine 5mg at 8:00 AM daily.';
      } else if (lower.includes('sugar') || lower.includes('glucose')) {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಗ್ಲೂಕೋಸ್ 155 mg/dL ಇದೆ. ಸಿಹಿ ಪದಾರ್ಥಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಪ್ರತಿದಿನ 30 ನಿಮಿಷ ನಡಿಗೆ ಮಾಡಿ.'
          : 'Your sugar level is 155 mg/dL. Avoid refined sugars and take a 30-minute daily walk.';
      } else {
        botResponse = language === 'kn'
          ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ಎಲ್ಲವೂ ನಿಯಂತ್ರಣದಲ್ಲಿದೆ. ಯಾವುದೇ ತುರ್ತು ಸ್ಥಿತಿಯಿದ್ದರೆ SOS ಬಟನ್ ಬಳಸಿ.'
          : 'Based on your care plan, everything is on track. Contact your CHW Sunita Patil or use SOS if you feel unwell.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setOcrResult({
        doctorName: 'Dr. Ananya Roy (M.D.)',
        date: '2026-06-10',
        medicines: [
          { name: 'Amlodipine Besylate', dosage: '5mg', frequency: '1-0-0 (Morning)', duration: '30 Days' },
          { name: 'Metformin HCl', dosage: '500mg', frequency: '1-0-1 (After Food)', duration: '30 Days' }
        ]
      });
      toastSuccess('Prescription scanned and digitized!');
    }, 1200);
  };

  const takenCount = medicines.filter(m => m.takenToday).length;
  const adherencePercent = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 100;

  return (
    <div className="portal-content-container space-y-6">
      {/* Warm Header Bar: Greeting + Language Toggle + Emergency SOS */}
      <div className="card-box bg-white p-5 flex justify-between items-center flex-wrap gap-4 border-slate-200">
        <div>
          <span className="text-2xs font-bold text-sky-700 uppercase tracking-wider block">
            {language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್' : 'Personal Health Hub'}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            {language === 'kn' ? `ನಮಸ್ಕಾರ, ${activePatient.name.split(' ')[0]}!` : `Hello, ${activePatient.name.split(' ')[0]}! 👋`}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'kn' 
              ? 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಮತ್ತು ಔಷಧಿಗಳ ವಿವರ ಇಲ್ಲಿದೆ.' 
              : 'Here is your health snapshot, daily medicines, and care schedule.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button 
            className="btn btn-secondary text-xs flex items-center gap-1.5 font-bold"
            onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          >
            <Languages size={15} /> {language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}
          </button>

          {/* Emergency SOS Button */}
          <button 
            className={`btn text-xs font-bold ${sosTriggered ? 'bg-emerald-600 text-white' : 'btn-danger-outline'}`}
            onClick={handleSosClick}
          >
            <PhoneCall size={15} /> {sosTriggered ? 'SOS Dispatched' : 'Emergency SOS (108)'}
          </button>
        </div>
      </div>

      {/* Primary Health Vitals Snapshot Card */}
      <div className="grid-4-col gap-4">
        <div className="card-box bg-sky-50/60 border-sky-200 p-4">
          <span className="text-2xs font-bold text-sky-800 uppercase tracking-wider block">Blood Pressure</span>
          <div className="text-2xl font-bold text-sky-950 mt-1">
            {activePatient.systolic}/{activePatient.diastolic} <span className="text-xs font-normal text-slate-500">mmHg</span>
          </div>
          <span className="text-2xs text-sky-700 block mt-1 font-medium">Stage 2 Hypertensive</span>
        </div>

        <div className="card-box bg-amber-50/60 border-amber-200 p-4">
          <span className="text-2xs font-bold text-amber-800 uppercase tracking-wider block">Blood Sugar</span>
          <div className="text-2xl font-bold text-amber-950 mt-1">
            {activePatient.glucose} <span className="text-xs font-normal text-slate-500">mg/dL</span>
          </div>
          <span className="text-2xs text-amber-700 block mt-1 font-medium">Fasting Reading</span>
        </div>

        <div className="card-box bg-emerald-50/60 border-emerald-200 p-4">
          <span className="text-2xs font-bold text-emerald-800 uppercase tracking-wider block">Medication Adherence</span>
          <div className="text-2xl font-bold text-emerald-950 mt-1">
            {adherencePercent}%
          </div>
          <span className="text-2xs text-emerald-700 block mt-1 font-medium">{takenCount} of {medicines.length} doses taken</span>
        </div>

        <div className="card-box bg-indigo-50/60 border-indigo-200 p-4">
          <span className="text-2xs font-bold text-indigo-800 uppercase tracking-wider block">Next CHW Visit</span>
          <div className="text-2xl font-bold text-indigo-950 mt-1">
            7 Days
          </div>
          <span className="text-2xs text-indigo-700 block mt-1 font-medium">Sunita Patil (CHW)</span>
        </div>
      </div>

      {/* Main Sections: Daily Medicines & Care Pathway */}
      <div className="grid-2-col gap-6">
        {/* Daily Medicines Checklist */}
        <div className="card-box space-y-4">
          <div className="card-box-header">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill size={18} className="text-sky-600" /> Today's Medicines Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Tap to mark doses as taken</p>
            </div>
            <span className="badge badge-primary">{takenCount}/{medicines.length} Completed</span>
          </div>

          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <div 
                key={idx}
                onClick={() => toggleMedication(idx)}
                className={`p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                  med.takenToday 
                    ? 'border-emerald-300 bg-emerald-50/70' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    med.takenToday ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {med.takenToday ? <Check size={16} /> : idx + 1}
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">{med.name} ({med.dosage})</strong>
                    <span className="text-xs text-slate-500">{med.frequency} • Scheduled: {med.time}</span>
                  </div>
                </div>

                <span className={`badge ${med.takenToday ? 'badge-risk-low' : 'badge-neutral'} text-xs`}>
                  {med.takenToday ? 'Taken' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Health Assistant (Bilingual) */}
        <div className="card-box flex flex-col justify-between space-y-4">
          <div className="card-box-header">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bot size={18} className="text-indigo-600" /> AI Health Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ask questions in English or Kannada</p>
            </div>
            <span className="badge badge-neutral font-mono">Bilingual</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 flex-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl max-w-[85%] text-xs ${
                  msg.sender === 'user' 
                    ? 'bg-sky-600 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
            <input 
              type="text" 
              placeholder={language === 'kn' ? 'ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Ask a question about your diet or BP...'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="form-input text-xs flex-1"
            />
            <button type="submit" className="btn btn-primary text-xs">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Prescription OCR Scanner */}
      <div className="card-box space-y-4">
        <div className="card-box-header">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera size={18} className="text-sky-600" /> Prescription Digitizer (OCR)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Scan paper prescriptions into your digital health passport</p>
          </div>
          <button 
            className="btn btn-primary text-xs"
            onClick={handleSimulateScan}
            disabled={scanning}
          >
            {scanning ? 'Digitizing...' : 'Scan Prescription'}
          </button>
        </div>

        {ocrResult ? (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex justify-between items-center">
              <strong className="text-xs text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" /> Digitized Prescription Record
              </strong>
              <span className="text-2xs text-slate-500">Doctor: {ocrResult.doctorName}</span>
            </div>

            <div className="grid-2-col gap-3 text-xs">
              {ocrResult.medicines.map((m, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block">{m.name} {m.dosage}</strong>
                  <span className="text-2xs text-slate-500">{m.frequency} • Duration: {m.duration}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            <Camera size={28} className="mx-auto mb-2 text-slate-400" />
            <p className="text-xs font-semibold">No prescription scanned yet</p>
            <p className="text-2xs text-slate-400 mt-0.5">Click "Scan Prescription" to test digitization.</p>
          </div>
        )}
      </div>
    </div>
  );
}
