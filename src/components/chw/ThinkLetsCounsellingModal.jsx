import React, { useState, useEffect } from 'react';
import { X, BookOpen, Volume2, VolumeX, CheckSquare, Square, Save, MessageSquare } from 'lucide-react';
import { THINKLETS_SCRIPTS } from '../../data/counsellingScripts';

export default function ThinkLetsCounsellingModal({ patient, onClose, onSaveCounsellingSession }) {
  const [selectedScriptId, setSelectedScriptId] = useState(THINKLETS_SCRIPTS[0].id);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeakingStepId, setActiveSpeakingStepId] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Stop speech synthesis on modal unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!patient) return null;

  const currentScript = THINKLETS_SCRIPTS.find(s => s.id === selectedScriptId) || THINKLETS_SCRIPTS[0];

  const handleStepToggle = (stepId) => {
    setCompletedStepIds(prev => 
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setActiveSpeakingStepId(null);
  };

  const handlePlayAudio = (text, stepId = null) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      setActiveSpeakingStepId(stepId);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setActiveSpeakingStepId(null);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setActiveSpeakingStepId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  const handleSaveSession = (e) => {
    e.preventDefault();
    const sessionRecord = {
      category: currentScript.category,
      scriptTitle: currentScript.title,
      date: new Date().toLocaleDateString(),
      completedStepsCount: completedStepIds.length,
      totalSteps: currentScript.steps.length,
      notes: sessionNotes || 'Counselling completed successfully.'
    };
    onSaveCounsellingSession(patient.id, sessionRecord);
    alert(`Counselling session for ${patient.name} recorded successfully!`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header bg-gradient-to-r from-emerald-900 to-slate-900">
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-400" size={24} />
            <div>
              <h2>ThinkLets Interactive Counselling Module</h2>
              <p className="text-xs text-gray-400">Structured patient guidance protocols for {patient.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body grid-3-7-col gap-4">
          {/* Script Category Sidebar */}
          <div className="counselling-sidebar">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Select Script Protocol</h4>
            <div className="counselling-category-list">
              {THINKLETS_SCRIPTS.map((script) => (
                <button
                  key={script.id}
                  className={`category-item-btn ${selectedScriptId === script.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedScriptId(script.id);
                    setCompletedStepIds([]);
                  }}
                >
                  <span className="text-lg">{script.icon}</span>
                  <div>
                    <div className="category-item-title">{script.category}</div>
                    <div className="category-item-sub">{script.steps.length} Steps</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Script Content Area */}
          <div className="counselling-content">
            <div className="script-header-card">
              <div className="flex justify-between items-start">
                <div>
                  <span className="badge badge-success mb-1">{currentScript.category}</span>
                  <h3 className="text-lg font-bold text-white">{currentScript.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{currentScript.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={speechRate} 
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="form-input text-2xs py-1 px-2"
                    title="Speech Speed"
                  >
                    <option value={0.8}>0.8x Speed</option>
                    <option value={1.0}>1.0x Speed</option>
                    <option value={1.2}>1.2x Speed</option>
                  </select>
                  {isPlayingAudio ? (
                    <button 
                      className="btn btn-error text-xs flex items-center gap-1"
                      onClick={handleStopAudio}
                    >
                      <VolumeX size={16} /> Stop Audio
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary text-xs flex items-center gap-1"
                      onClick={() => handlePlayAudio(currentScript.steps.map(s => s.script.replace('[Patient Name]', patient.name)).join(' '))}
                    >
                      <Volume2 size={16} /> Read Full Audio
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="script-steps-container mt-3 space-y-3">
              {currentScript.steps.map((step, idx) => {
                const formattedScript = step.script
                  .replace('[Patient Name]', patient.name)
                  .replace('[Glucose]', patient.glucose)
                  .replace('[BP_Systolic]', patient.systolic)
                  .replace('[BP_Diastolic]', patient.diastolic);

                const isChecked = completedStepIds.includes(step.id);
                const isSpeakingThisStep = activeSpeakingStepId === step.id;

                return (
                  <div key={step.id} className={`step-card ${isChecked ? 'completed' : ''} ${isSpeakingThisStep ? 'border-emerald-500 bg-emerald-950/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button 
                        className="step-check-btn mt-1" 
                        onClick={() => handleStepToggle(step.id)}
                      >
                        {isChecked ? <CheckSquare size={20} className="text-emerald-400" /> : <Square size={20} className="text-gray-500" />}
                      </button>
                      <div className="flex-1">
                        <div className="step-title-line">
                          <span className="step-number">Step {idx + 1}: {step.title}</span>
                          <button 
                            className={`audio-step-btn text-xs ${isSpeakingThisStep ? 'text-emerald-400 font-bold' : 'text-indigo-400'} hover:underline flex items-center gap-1`}
                            onClick={() => isSpeakingThisStep ? handleStopAudio() : handlePlayAudio(formattedScript, step.id)}
                          >
                            {isSpeakingThisStep ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            {isSpeakingThisStep ? 'Stop Audio' : 'Play Audio'}
                          </button>
                        </div>
                        <div className="script-dialogue-box">
                          {formattedScript}
                        </div>
                        <div className="action-item-box">
                          💡 <strong>CHW Action Item:</strong> {step.actionItem}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes Recorder */}
            <div className="counselling-notes-box mt-4">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1 mb-1">
                <MessageSquare size={14} /> CHW Counselling Notes & Patient Feedback
              </label>
              <textarea 
                placeholder="Enter patient observations or commitment notes..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="form-input"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer flex justify-between items-center">
          <span className="text-xs text-gray-400">Completed: {completedStepIds.length} of {currentScript.steps.length} Steps</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary flex items-center gap-1" onClick={handleSaveSession}>
              <Save size={16} /> Mark Counselling Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
