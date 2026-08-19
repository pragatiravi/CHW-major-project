import { useState } from 'react';
import { X, Pill, Plus, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SYSTEM_MEDICINES } from '../../data/initialData';
import { useToast } from '../shared/ToastContainer';

export default function MedicationTrackerModal({ patient, onClose, onUpdatePatientMedicines }) {
  const { toastSuccess, toastWarning, toastError } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [medName, setMedName] = useState(SYSTEM_MEDICINES[0].name);
  const [dosage, setDosage] = useState(SYSTEM_MEDICINES[0].defaultDosage);
  const [frequency, setFrequency] = useState('Once Daily (Morning)');
  const [durationDays, setDurationDays] = useState(90);
  const [isSaving, setIsSaving] = useState(false);

  if (!patient) return null;

  const handleSelectMedPreset = (e) => {
    const selected = SYSTEM_MEDICINES.find(m => m.name === e.target.value);
    if (selected) {
      setMedName(selected.name);
      setDosage(selected.defaultDosage);
    } else {
      setMedName(e.target.value);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + parseInt(durationDays));

    const newMed = {
      id: 'M-' + Math.floor(100 + Math.random() * 900),
      name: medName,
      dosage,
      frequency,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'Active',
      missedDoses: 0
    };

    const nextMeds = [...(patient.medicines || []), newMed];
    setIsSaving(true);
    try {
      await onUpdatePatientMedicines(patient.id, nextMeds);
      toastSuccess(`Prescribed ${medName} (${dosage}) for ${patient.name}`);
      setShowAddForm(false);
    } catch (error) {
      toastError(error.message || 'Unable to save the medication order.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogDose = async (medId, isMissed = false) => {
    const updated = (patient.medicines || []).map(m => {
      if (m.id === medId) {
        return {
          ...m,
          missedDoses: isMissed ? m.missedDoses + 1 : Math.max(0, m.missedDoses - 1)
        };
      }
      return m;
    });
    setIsSaving(true);
    try {
      await onUpdatePatientMedicines(patient.id, updated);
      if (isMissed) {
        toastWarning('Missed dose reported for patient medication.');
      } else {
        toastSuccess('Daily dose recorded as taken.');
      }
    } catch (error) {
      toastError(error.message || 'Unable to update medication adherence.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefillMedicine = async (medId) => {
    const today = new Date();
    const newEnd = new Date();
    newEnd.setDate(today.getDate() + 90);

    const updated = (patient.medicines || []).map(m => {
      if (m.id === medId) {
        return {
          ...m,
          endDate: newEnd.toISOString().split('T')[0],
          missedDoses: 0,
          status: 'Active'
        };
      }
      return m;
    });
    setIsSaving(true);
    try {
      await onUpdatePatientMedicines(patient.id, updated);
      toastSuccess('90-day prescription refill authorized.');
    } catch (error) {
      toastError(error.message || 'Unable to authorize the refill.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-box w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Pill size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Medication Module & Compliance Tracker</h2>
              <p className="text-2xs text-slate-500">Prescriptions & Reminders for {patient.name} ({patient.id})</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close medication tracker"><X size={16} /></button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Prescriptions</h4>
            <button 
              className="btn btn-primary text-xs flex items-center gap-1.5"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isSaving}
            >
              <Plus size={14} /> Prescribe Medicine
            </button>
          </div>

          {/* Prescribe Form */}
          {showAddForm && (
            <form onSubmit={handleAddMedicine} className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-3">
              <h4 className="text-xs font-bold text-amber-900">Prescribe New Medication</h4>
              
              <div className="grid-2-col gap-3">
                <div className="form-group">
                  <label className="form-label">Select Medicine</label>
                  <select value={medName} onChange={handleSelectMedPreset} className="form-input text-xs">
                    {SYSTEM_MEDICINES.map(m => (
                      <option key={m.name} value={m.name}>{m.name} ({m.category})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} className="form-input text-xs" required />
                </div>
              </div>

              <div className="grid-2-col gap-3">
                <div className="form-group">
                  <label className="form-label">Frequency Routine</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input text-xs">
                    <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                    <option value="Once Daily (Night)">Once Daily (Night)</option>
                    <option value="Twice Daily (Morning/Night)">Twice Daily (Morning/Night)</option>
                    <option value="Thrice Daily">Thrice Daily</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="form-input text-xs" min={7} max={365} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary text-xs font-bold" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>
            </form>
          )}

          {/* List of active prescriptions */}
          <div className="space-y-3">
            {patient.medicines && patient.medicines.length > 0 ? (
              patient.medicines.map((m) => (
                <div key={m.id || m.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900">{m.name}</strong>
                        <span className="badge badge-primary text-3xs font-mono">{m.dosage}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Routine: <strong>{m.frequency}</strong> • Valid until: {m.endDate || 'Ongoing'}
                      </p>
                    </div>

                    {m.missedDoses > 0 ? (
                      <span className="badge badge-risk-critical text-2xs flex items-center gap-1">
                        <AlertTriangle size={12} /> {m.missedDoses} Missed Alert!
                      </span>
                    ) : (
                      <span className="badge badge-risk-low text-2xs flex items-center gap-1">
                        <CheckCircle2 size={12} /> Compliant
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 flex-wrap gap-2">
                    <span className="text-2xs text-slate-500">Record Field Compliance:</span>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-secondary text-2xs flex items-center gap-1"
                        onClick={() => handleLogDose(m.id, false)}
                        disabled={isSaving}
                      >
                        <CheckCircle2 size={12} className="text-emerald-600" /> Log Dose Taken
                      </button>
                      <button 
                        className="btn btn-danger-outline text-2xs flex items-center gap-1"
                        onClick={() => handleLogDose(m.id, true)}
                        disabled={isSaving}
                      >
                        <AlertTriangle size={12} /> Report Missed
                      </button>
                      <button 
                        className="btn btn-secondary text-2xs flex items-center gap-1"
                        onClick={() => handleRefillMedicine(m.id)}
                        title="Authorize 90-day Refill"
                        disabled={isSaving}
                      >
                        <RefreshCw size={12} className="text-sky-600" /> Refill
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Pill size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No active medicines prescribed</p>
                <p className="text-2xs text-slate-400 mt-0.5">Click "Prescribe Medicine" above to record a new prescription.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button className="btn btn-secondary text-xs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
