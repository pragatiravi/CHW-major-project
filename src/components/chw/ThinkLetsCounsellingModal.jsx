import { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  CheckSquare, 
  Square, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Languages
} from 'lucide-react';
import { getLocalizedThinkLetsScripts } from '../../data/counsellingScripts';
import { speakText, stopSpeech } from '../../lib/speech/speechSynthesis';
import { useLanguage } from '../shared/LanguageContext';
import { useToast } from '../shared/ToastContainer';

export default function ThinkLetsCounsellingModal({ patient, onClose, onSaveCounsellingSession }) {
  const { language: currentAppLang, languages } = useLanguage();
  const { toastSuccess, toastWarning } = useToast();

  const [activeLang, setActiveLang] = useState(currentAppLang || 'en');
  const [selectedScriptId, setSelectedScriptId] = useState('diabetes_management');
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Stop speech synthesis on modal unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!patient) return null;

  const localizedScripts = getLocalizedThinkLetsScripts(activeLang);
  const currentScript = localizedScripts.find(s => s.id === selectedScriptId) || localizedScripts[0];
  const activeStep = currentScript.steps[activeStepIndex] || currentScript.steps[0];

  const handleStepToggle = (stepId) => {
    setCompletedStepIds(prev => 
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  const handleStopAudio = () => {
    stopSpeech();
    setIsPlayingAudio(false);
  };

  const handlePlayAudio = (text) => {
    stopSpeech();
    setIsPlayingAudio(true);

    speakText(text, {
      lang: activeLang,
      rate: speechRate,
      onVoiceUnavailable: (lang) => {
        const langNames = { kn: 'Kannada (ಕನ್ನಡ)', mr: 'Marathi (मराठी)', hi: 'Hindi (हिन्दी)' };
        toastWarning(`Notice: No native ${langNames[lang] || lang} TTS voice installed on this device. Install regional speech in system settings for best audio.`);
      },
      onEnd: () => {
        setIsPlayingAudio(false);
      },
      onError: () => {
        setIsPlayingAudio(false);
      }
    });
  };

  const handleSaveSession = (e) => {
    e.preventDefault();
    const sessionRecord = {
      category: currentScript.category,
      scriptTitle: currentScript.title,
      language: activeLang,
      date: new Date().toLocaleDateString(),
      completedStepsCount: completedStepIds.length,
      totalSteps: currentScript.steps.length,
      notes: sessionNotes || 'ThinkLets counselling protocol completed successfully.'
    };
    onSaveCounsellingSession(patient.id, sessionRecord);
    toastSuccess(`Counselling session for ${patient.name} recorded!`);
    onClose();
  };

  const formattedActiveScript = (activeStep.script || '')
    .replace(/\[Patient Name\]/g, patient.name)
    .replace(/\[Glucose\]/g, patient.glucose || '140')
    .replace(/\[BP_Systolic\]/g, patient.systolic || '130')
    .replace(/\[BP_Diastolic\]/g, patient.diastolic || '85');

  const isStepDone = completedStepIds.includes(activeStep.id);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-box w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ThinkLets Multilingual Counselling Module</h2>
              <p className="text-2xs text-slate-500">Audio-enabled patient guidance protocols for {patient.name} ({patient.id})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-2xs">
              <Languages size={13} className="text-sky-600" />
              <select 
                value={activeLang} 
                onChange={(e) => {
                  stopSpeech();
                  setIsPlayingAudio(false);
                  setActiveLang(e.target.value);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                title="Select Patient Voice/Script Language"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.native} ({l.label})</option>
                ))}
              </select>
            </div>

            <button className="btn-icon-xs" onClick={onClose} aria-label="Close counselling session"><X size={16} /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid-3-7-col gap-0 flex-1 overflow-hidden">
          {/* Protocol Category Selector */}
          <div className="p-4 border-r border-slate-200 bg-slate-50 overflow-y-auto space-y-2">
            <span className="metric-label text-3xs text-slate-400 block mb-2">Protocol Category</span>
            {localizedScripts.map((script) => (
              <button
                key={script.id}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  selectedScriptId === script.id 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => {
                  stopSpeech();
                  setIsPlayingAudio(false);
                  setSelectedScriptId(script.id);
                  setCompletedStepIds([]);
                  setActiveStepIndex(0);
                }}
              >
                <span className="text-lg" aria-hidden="true">{script.icon || '📖'}</span>
                <div>
                  <strong className="text-xs block leading-tight">{script.category}</strong>
                  <span className="text-3xs text-slate-500">{script.steps.length} Steps</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Sequential Step Presentation */}
          <div className="p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <span className="badge badge-primary text-3xs">{currentScript.category}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{currentScript.title}</h3>
                </div>

                {/* Audio Read Controls */}
                <div className="flex items-center gap-2">
                  <select 
                    value={speechRate} 
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="form-input text-2xs py-1 px-2 w-28"
                    title="Audio playback speed"
                  >
                    <option value={0.8}>0.8x Slow</option>
                    <option value={0.95}>1.0x Normal</option>
                    <option value={1.2}>1.2x Fast</option>
                  </select>

                  {isPlayingAudio ? (
                    <button 
                      className="btn btn-danger-outline text-xs flex items-center gap-1.5 py-1 px-3"
                      onClick={handleStopAudio}
                    >
                      <VolumeX size={14} className="animate-pulse" /> Stop Audio
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary text-xs flex items-center gap-1.5 py-1 px-3 font-bold"
                      onClick={() => handlePlayAudio(formattedActiveScript)}
                      title={`Play audio in ${activeLang.toUpperCase()}`}
                    >
                      <Volume2 size={14} /> Read Aloud ({activeLang.toUpperCase()})
                    </button>
                  )}
                </div>
              </div>

              {/* Step Navigation Tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
                {currentScript.steps.map((step, idx) => (
                  <button
                    key={step.id}
                    className={`btn text-xs py-1 px-3 whitespace-nowrap ${
                      activeStepIndex === idx 
                        ? 'btn-primary font-bold' 
                        : (completedStepIds.includes(step.id) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-secondary text-slate-500')
                    }`}
                    onClick={() => {
                      stopSpeech();
                      setIsPlayingAudio(false);
                      setActiveStepIndex(idx);
                    }}
                  >
                    Step {idx + 1} {completedStepIds.includes(step.id) && '✓'}
                  </button>
                ))}
              </div>

              {/* Active Step Content */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <strong className="text-sm text-slate-900">
                    Step {activeStepIndex + 1}: {activeStep.title}
                  </strong>
                  <button 
                    className="btn btn-secondary text-xs flex items-center gap-1.5"
                    onClick={() => handleStepToggle(activeStep.id)}
                  >
                    {isStepDone ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} className="text-slate-400" />}
                    <span>{isStepDone ? 'Completed' : 'Mark Step Done'}</span>
                  </button>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {formattedActiveScript}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  💡 <strong>Action Item:</strong> {activeStep.actionItem}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label text-2xs flex items-center gap-1">
                  <MessageSquare size={12} /> Patient Feedback / Commitment Notes
                </label>
                <textarea 
                  placeholder="Enter patient dietary commitment, challenges, or follow-up notes..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="form-input text-xs"
                  rows={2}
                />
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button 
                className="btn btn-secondary text-xs"
                disabled={activeStepIndex === 0}
                onClick={() => {
                  stopSpeech();
                  setIsPlayingAudio(false);
                  setActiveStepIndex(Math.max(0, activeStepIndex - 1));
                }}
              >
                <ChevronLeft size={14} /> Previous Step
              </button>

              <div className="flex gap-2">
                {activeStepIndex < currentScript.steps.length - 1 ? (
                  <button 
                    className="btn btn-primary text-xs"
                    onClick={() => {
                      stopSpeech();
                      setIsPlayingAudio(false);
                      setActiveStepIndex(activeStepIndex + 1);
                    }}
                  >
                    Next Step <ChevronRight size={14} />
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary text-xs font-bold"
                    onClick={handleSaveSession}
                  >
                    <CheckCircle2 size={14} /> Complete & Record Protocol
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
