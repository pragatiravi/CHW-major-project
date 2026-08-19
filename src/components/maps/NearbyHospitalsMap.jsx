import { useState } from 'react';
import { MapPin, Navigation, Hospital, CheckCircle2, Car, X } from 'lucide-react';
import { INITIAL_HOSPITALS } from '../../data/initialData';

export default function NearbyHospitalsMap({ patient, onSelectHospitalForReferral, onClose }) {
  const [selectedHospital, setSelectedHospital] = useState(INITIAL_HOSPITALS[0]);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-box w-full max-w-4xl max-h-[88vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Navigation size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nearby Hospitals & Emergency Navigator</h2>
              <p className="text-2xs text-slate-500">Route planning for {patient ? patient.name : 'Community Patient'}</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close hospital map"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-6 grid-3-7-col gap-5 flex-1 overflow-y-auto">
          {/* Hospitals List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            <span className="metric-label text-3xs text-slate-400 block mb-1">Available Facilities</span>
            {INITIAL_HOSPITALS.map((hosp) => (
              <div 
                key={hosp.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedHospital.id === hosp.id 
                    ? 'border-indigo-400 bg-indigo-50/70 shadow-xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                onClick={() => setSelectedHospital(hosp)}
              >
                <div className="flex justify-between items-start">
                  <strong className="text-xs text-slate-900 block">{hosp.name}</strong>
                  <span className="badge badge-primary text-3xs">{hosp.distanceKm} km</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">{hosp.type} • <strong>{hosp.bedsAvailable} Beds</strong></p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hosp.specialties.map(spec => (
                    <span key={spec} className="tag-pill text-3xs">{spec}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Map Preview Canvas */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative min-h-[260px] flex flex-col justify-between overflow-hidden">
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                Simulated GIS Navigation Route
              </div>

              <div className="flex justify-around items-center py-8">
                {/* Patient Origin */}
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1">
                    <MapPin size={22} />
                  </div>
                  <strong className="text-xs text-slate-900 block">{patient?.address || 'Patient Sector'}</strong>
                  <span className="text-3xs text-slate-500">Origin Point</span>
                </div>

                {/* Arrow */}
                <div className="text-center px-4">
                  <span className="text-xs font-bold text-indigo-600 font-mono block">
                    {selectedHospital.distanceKm} km ({Math.round(selectedHospital.distanceKm * 2.5)} mins)
                  </span>
                  <div className={`h-1 w-32 ${isNavigating ? 'bg-emerald-500' : 'bg-indigo-300'} rounded-full mx-auto my-1`} />
                  <span className="text-3xs text-slate-400">{selectedHospital.emergencyRoute}</span>
                </div>

                {/* Target Hospital */}
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-1">
                    <Hospital size={22} />
                  </div>
                  <strong className="text-xs text-slate-900 block">{selectedHospital.name}</strong>
                  <span className="text-3xs text-slate-500">Emergency Center</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  className={`btn text-xs ${isNavigating ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-secondary'}`}
                  onClick={() => setIsNavigating(!isNavigating)}
                >
                  <Car size={14} /> {isNavigating ? 'Emergency Route Active' : 'Simulate GPS Route'}
                </button>
              </div>
            </div>

            {/* Selected Hospital Info */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900">{selectedHospital.name}</strong>
                <span className="text-2xs text-slate-500 font-mono">{selectedHospital.phone}</span>
              </div>
              <p className="text-2xs text-slate-600"><strong>Attending Lead:</strong> {selectedHospital.leadDoctor}</p>
              <p className="text-2xs text-slate-500"><strong>Route Corridor:</strong> {selectedHospital.emergencyRoute}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-2xs text-slate-500">Selected: <strong>{selectedHospital.name}</strong></span>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-xs" onClick={onClose}>Close</button>
            {onSelectHospitalForReferral && (
              <button 
                className="btn btn-primary text-xs"
                onClick={() => {
                  onSelectHospitalForReferral(selectedHospital);
                  onClose();
                }}
              >
                <CheckCircle2 size={14} /> Confirm Facility for Referral
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
