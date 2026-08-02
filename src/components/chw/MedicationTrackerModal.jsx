import React, { useState } from 'react';
import { X, Pill, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { SYSTEM_MEDICINES } from '../../data/initialData';

export default function MedicationTrackerModal({ patient, onClose, onUpdatePatientMedicines }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [medName, setMedName] = useState(SYSTEM_MEDICINES[0].name);
  const [dosage, setDosage] = useState(SYSTEM_MEDICINES[0].defaultDosage);
  const [frequency, setFrequency] = useState('Once Daily (Morning)');
  const [durationDays, setDurationDays] = useState(90);

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

  const handleAddMedicine = (e) => {
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
    onUpdatePatientMedicines(patient.id, nextMeds);
    setShowAddForm(false);
  };

  const handleLogDose = (medId, isMissed = false) => {
    const updated = (patient.medicines || []).map(m => {
      if (m.id === medId) {
        return {
          ...m,
          missedDoses: isMissed ? m.missedDoses + 1 : Math.max(0, m.missedDoses - 1)
        };
      }
      return m;
    });
    onUpdatePatientMedicines(patient.id, updated);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header bg-gradient-to-r from-amber-900 to-slate-900">
          <div className="flex items-center gap-2">
            <Pill className="text-amber-400" size={22} />
            <div>
              <h2>Medication Module & Compliance Tracker</h2>
              <p className="text-xs text-gray-400">Prescriptions & Reminders for {patient.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-semibold text-gray-300">Active Prescriptions</h4>
            <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={14} /> Prescribe Medicine
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddMedicine} className="card-box bg-secondary mb-4 border-amber-500/30">
              <h4 className="text-xs font-bold text-amber-400 mb-2">Prescribe New Medication</h4>
              <div className="grid-2-col gap-2">
                <div className="form-group">
                  <label>Select Medicine Preset</label>
                  <select value={medName} onChange={handleSelectMedPreset} className="form-input">
                    {SYSTEM_MEDICINES.map(m => (
                      <option key={m.name} value={m.name}>{m.name} ({m.category})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} className="form-input" required />
                </div>
              </div>
              <div className="grid-2-col gap-2 mt-2">
                <div className="form-group">
                  <label>Frequency Routine</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input">
                    <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                    <option value="Once Daily (Night)">Once Daily (Night)</option>
                    <option value="Twice Daily (Morning/Night)">Twice Daily (Morning/Night)</option>
                    <option value="Thrice Daily">Thrice Daily</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="form-input" min={7} max={365} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary text-xs">Save Prescription</button>
              </div>
            </form>
          )}

          {/* List of active prescriptions */}
          <div className="space-y-3">
            {patient.medicines && patient.medicines.length > 0 ? (
              patient.medicines.map((m) => (
                <div key={m.id} className="med-item-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{m.name}</strong>
                        <span className="badge badge-primary">{m.dosage}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Routine: <strong>{m.frequency}</strong> • {m.startDate} to {m.endDate}
                      </div>
                    </div>
                    {m.missedDoses > 0 ? (
                      <span className="badge badge-danger flex items-center gap-1">
                        <AlertTriangle size={12} /> {m.missedDoses} Missed Alert!
                      </span>
                    ) : (
                      <span className="badge badge-success flex items-center gap-1">
                        <CheckCircle size={12} /> Compliant
                      </span>
                    )}
                  </div>

                  <div className="med-action-row mt-3 flex justify-between items-center border-t border-slate-800 pt-2">
                    <span className="text-xs text-gray-400">Log Daily Dose:</span>
                    <div className="flex gap-2">
                      <button className="btn btn-success-outline text-xs flex items-center gap-1" onClick={() => handleLogDose(m.id, false)}>
                        <CheckCircle size={12} /> Log Dose Taken
                      </button>
                      <button className="btn btn-danger-outline text-xs flex items-center gap-1" onClick={() => handleLogDose(m.id, true)}>
                        <AlertTriangle size={12} /> Report Missed Dose
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Pill size={32} className="text-gray-500 mb-2" />
                <p>No active medicines prescribed.</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
