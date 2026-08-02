import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Hospital, ShieldAlert, CheckCircle, Car } from 'lucide-react';
import { INITIAL_HOSPITALS } from '../../data/initialData';

export default function NearbyHospitalsMap({ patient, onSelectHospitalForReferral, onClose }) {
  const [selectedHospital, setSelectedHospital] = useState(INITIAL_HOSPITALS[0]);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header bg-gradient-to-r from-blue-900 to-slate-900">
          <div className="flex items-center gap-2">
            <Navigation className="text-blue-400" size={24} />
            <div>
              <h2>Nearby Hospitals & Emergency Referral Navigator</h2>
              <p className="text-xs text-gray-400">Google Maps Navigation Simulator for {patient ? patient.name : 'Emergency Referral'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body grid-4-6-col gap-4">
          {/* Hospitals List */}
          <div className="hospitals-sidebar space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">Available Health Facilities</h4>
            {INITIAL_HOSPITALS.map((hosp) => (
              <div 
                key={hosp.id}
                className={`hospital-card-item ${selectedHospital.id === hosp.id ? 'active' : ''}`}
                onClick={() => setSelectedHospital(hosp)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{hosp.name}</h4>
                  <span className="badge badge-primary text-2xs">{hosp.distanceKm} km</span>
                </div>
                <div className="text-2xs text-gray-400 mt-1">{hosp.type} • {hosp.bedsAvailable} Beds Available</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hosp.specialties.map(spec => (
                    <span key={spec} className="tag-pill text-2xs">{spec}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Map Display & Navigation Simulation */}
          <div className="map-view-container">
            {/* Visual Simulated Map Grid */}
            <div className="simulated-map-canvas">
              <div className="map-grid-pattern"></div>
              
              {/* Patient Pin */}
              <div className="map-pin patient-pin" style={{ top: '65%', left: '25%' }}>
                <div className="pin-pulse"></div>
                <MapPin size={24} className="text-rose-500" />
                <span className="pin-label">Patient Location</span>
              </div>

              {/* Hospital Pins */}
              {INITIAL_HOSPITALS.map((h, idx) => (
                <div 
                  key={h.id} 
                  className={`map-pin hospital-pin ${selectedHospital.id === h.id ? 'selected' : ''}`}
                  style={{ top: `${30 + idx * 18}%`, left: `${55 + idx * 10}%` }}
                  onClick={() => setSelectedHospital(h)}
                >
                  <Hospital size={24} className={selectedHospital.id === h.id ? 'text-indigo-400' : 'text-gray-400'} />
                  <span className="pin-label">{h.name}</span>
                </div>
              ))}

              {/* Simulated Navigation Route Line */}
              <svg className="route-svg-layer">
                <path 
                  d="M 180 260 Q 280 200 400 150" 
                  fill="none" 
                  stroke={isNavigating ? "#10b981" : "#6366f1"} 
                  strokeWidth="4" 
                  strokeDasharray={isNavigating ? "8,8" : "none"}
                  className={isNavigating ? "route-line-anim" : ""}
                />
              </svg>
            </div>

            {/* Selected Hospital Detail Panel */}
            <div className="hospital-detail-card mt-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{selectedHospital.name}</h3>
                  <p className="text-xs text-gray-400">{selectedHospital.address} • {selectedHospital.phone}</p>
                </div>
                <button 
                  className={`btn text-xs ${isNavigating ? 'btn-success' : 'btn-secondary'} flex items-center gap-1`}
                  onClick={() => setIsNavigating(!isNavigating)}
                >
                  <Car size={14} /> {isNavigating ? 'Route Active (Navigating)' : 'Simulate Emergency Route'}
                </button>
              </div>

              <div className="grid-2-col gap-2 mt-2 pt-2 border-t border-slate-800 text-xs">
                <div><span>Emergency Route:</span> <strong className="text-emerald-400">{selectedHospital.emergencyRoute}</strong></div>
                <div><span>Attending Lead:</span> <strong>{selectedHospital.leadDoctor}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer flex justify-between items-center">
          <span className="text-xs text-gray-400">Target: {selectedHospital.name}</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            {onSelectHospitalForReferral && (
              <button 
                className="btn btn-primary flex items-center gap-1"
                onClick={() => {
                  onSelectHospitalForReferral(selectedHospital);
                  onClose();
                }}
              >
                <CheckCircle size={16} /> Select Hospital for Referral
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
