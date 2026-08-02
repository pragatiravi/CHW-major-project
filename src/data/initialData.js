/**
 * Initial Comprehensive Seed Data for CHW Healthcare Platform
 */

import { assessPatientRisk } from '../utils/predictionEngine';

export const INITIAL_HOSPITALS = [
  {
    id: 'HOSP-101',
    name: 'District Memorial Community Hospital',
    type: 'District Hospital',
    address: 'Sector 4, Primary Health Zone, Central Sub-District',
    phone: '+91 98765 43210',
    distanceKm: 3.2,
    emergencyRoute: 'Route A1 via Central Bypass (12 mins)',
    bedsAvailable: 14,
    specialties: ['Cardiology', 'Endocrinology', 'Emergency Trauma', 'General Medicine'],
    leadDoctor: 'Dr. Ananya Roy (M.D. Internal Med)',
    latitude: 18.5204,
    longitude: 73.8567
  },
  {
    id: 'HOSP-102',
    name: 'Rural Apex General & Health Center',
    type: 'Sub-District Health Center',
    address: 'Village Chowk, East Sector',
    phone: '+91 98765 11223',
    distanceKm: 7.8,
    emergencyRoute: 'Route B2 via East Link Road (22 mins)',
    bedsAvailable: 6,
    specialties: ['Primary Care', 'Diabetes Clinic', 'Maternal Care'],
    leadDoctor: 'Dr. Rajesh Verma (M.B.B.S)',
    latitude: 18.5312,
    longitude: 73.8745
  },
  {
    id: 'HOSP-103',
    name: 'St. Jude Heart & Cardiac Institute',
    type: 'Tertiary Specialty Hospital',
    address: 'Highway Circle, Sector 12',
    phone: '+91 98765 99887',
    distanceKm: 14.5,
    emergencyRoute: 'Highway Corridor Express (28 mins)',
    bedsAvailable: 22,
    specialties: ['Interventional Cardiology', 'Cardiothoracic Care', 'ICU'],
    leadDoctor: 'Dr. Sunita Deshmukh (M.D., D.M. Cardiology)',
    latitude: 18.5089,
    longitude: 73.8210
  }
];

export const INITIAL_DOCTORS = [
  { id: 'DOC-1', name: 'Dr. Ananya Roy', specialty: 'Internal Medicine & Diabetes', hospital: 'District Memorial Community Hospital', phone: '+91 98111 22334', email: 'ananya.roy@health.org' },
  { id: 'DOC-2', name: 'Dr. Rajesh Verma', specialty: 'General Practitioner', hospital: 'Rural Apex General & Health Center', phone: '+91 98222 33445', email: 'rajesh.verma@health.org' },
  { id: 'DOC-3', name: 'Dr. Sunita Deshmukh', specialty: 'Cardiology Specialist', hospital: 'St. Jude Heart & Cardiac Institute', phone: '+91 98333 44556', email: 'sunita.deshmukh@health.org' }
];

export const INITIAL_CHWS = [
  { id: 'CHW-101', name: 'Sunita Patil', zone: 'Sector A - North Village', totalPatients: 42, screeningsDone: 128, pendingSync: 0, phone: '+91 97000 11111' },
  { id: 'CHW-102', name: 'Ramesh Kumar', zone: 'Sector B - East Settlement', totalPatients: 38, screeningsDone: 114, pendingSync: 2, phone: '+91 97000 22222' },
  { id: 'CHW-103', name: 'Kavita Devi', zone: 'Sector C - West Cluster', totalPatients: 29, screeningsDone: 89, pendingSync: 0, phone: '+91 97000 33333' }
];

export const INITIAL_PATIENTS = [
  {
    id: 'P7204',
    name: 'Priya Sharma',
    age: 54,
    gender: 'female',
    address: 'House #42, North Village, Sector A',
    phone: '+91 98450 12345',
    systolic: 142,
    diastolic: 92,
    glucose: 155,
    glucoseType: 'fasting',
    bmi: 28.4,
    weight: 72,
    height: 159,
    heartRate: 84,
    symptoms: ['headache', 'fatigue'],
    familyHistory: true,
    smoking: false,
    alcohol: false,
    activeLifestyle: false,
    dateRegistered: 'Jun 05, 2026',
    assignedCHW: 'Sunita Patil',
    syncStatus: 'synced',
    medicines: [
      { id: 'M-1', name: 'Amlodipine', dosage: '5mg', frequency: 'Once Daily (Morning)', startDate: '2026-06-06', endDate: '2026-12-06', status: 'Active', missedDoses: 1 }
    ],
    referral: {
      status: 'Approved',
      hospitalId: 'HOSP-101',
      hospitalName: 'District Memorial Community Hospital',
      doctorName: 'Dr. Ananya Roy',
      urgency: 'Normal',
      reason: 'Stage 2 Hypertension & Prediabetes risk.',
      notes: 'Doctor approved treatment plan. Prescribed Amlodipine 5mg.',
      dateGenerated: 'Jun 06, 2026'
    },
    reports: [
      { id: 'REP-101', title: 'Fasting Blood Glucose Lab Slip', date: '2026-06-05', fileType: 'pdf', summary: 'Fasting glucose 155 mg/dL. HbA1c 6.8%.' }
    ],
    counsellingHistory: [
      { category: 'Hypertension', date: 'Jun 06, 2026', notes: 'Advised sodium limit under 5g daily.' }
    ]
  },
  {
    id: 'P4389',
    name: 'Fatima Begum',
    age: 68,
    gender: 'female',
    address: 'Plot 18, East Settlement, Sector B',
    phone: '+91 98450 67890',
    systolic: 185,
    diastolic: 112,
    glucose: 310,
    glucoseType: 'random',
    bmi: 30.5,
    weight: 78,
    height: 160,
    heartRate: 98,
    symptoms: ['polyuria', 'polydipsia', 'blurred_vision', 'chest_pain', 'dizziness'],
    familyHistory: true,
    smoking: true,
    alcohol: false,
    activeLifestyle: false,
    dateRegistered: 'Jun 10, 2026',
    assignedCHW: 'Ramesh Kumar',
    syncStatus: 'synced',
    medicines: [
      { id: 'M-2', name: 'Metformin', dosage: '500mg', frequency: 'Twice Daily', startDate: '2026-06-11', endDate: '2026-12-11', status: 'Active', missedDoses: 3 },
      { id: 'M-3', name: 'Telmisartan', dosage: '40mg', frequency: 'Once Daily', startDate: '2026-06-11', endDate: '2026-12-11', status: 'Active', missedDoses: 0 }
    ],
    referral: {
      status: 'Pending',
      hospitalId: 'HOSP-103',
      hospitalName: 'St. Jude Heart & Cardiac Institute',
      doctorName: 'Dr. Sunita Deshmukh',
      urgency: 'Urgent',
      reason: 'CRITICAL ALERT: Hypertensive Crisis (185/112 mmHg) & Severe Hyperglycemia (310 mg/dL) with Chest Pain.',
      notes: 'Emergency ambulance routing requested by CHW.',
      dateGenerated: 'Jun 10, 2026'
    },
    reports: [
      { id: 'REP-102', title: 'ECG Screening & Glucose Test', date: '2026-06-10', fileType: 'png', summary: 'ST-T changes noted. Immediate cardiac consult required.' }
    ],
    counsellingHistory: []
  },
  {
    id: 'P9102',
    name: 'Aarav Mehta',
    age: 28,
    gender: 'male',
    address: 'Lane 3, North Village, Sector A',
    phone: '+91 98450 99887',
    systolic: 118,
    diastolic: 76,
    glucose: 92,
    glucoseType: 'random',
    bmi: 22.1,
    weight: 65,
    height: 171,
    heartRate: 72,
    symptoms: [],
    familyHistory: false,
    smoking: false,
    alcohol: false,
    activeLifestyle: true,
    dateRegistered: 'Jun 08, 2026',
    assignedCHW: 'Sunita Patil',
    syncStatus: 'synced',
    medicines: [],
    referral: null,
    reports: [],
    counsellingHistory: [
      { category: 'Exercise', date: 'Jun 08, 2026', notes: 'Encouraged continued 150 min walking.' }
    ]
  },
  {
    id: 'P1123',
    name: 'David Mwangi',
    age: 43,
    gender: 'male',
    address: 'Cluster 5, West Cluster, Sector C',
    phone: '+91 98450 33445',
    systolic: 135,
    diastolic: 84,
    glucose: 215,
    glucoseType: 'random',
    bmi: 26.2,
    weight: 76,
    height: 170,
    heartRate: 80,
    symptoms: ['fatigue', 'polyuria'],
    familyHistory: false,
    smoking: true,
    alcohol: true,
    activeLifestyle: false,
    dateRegistered: 'Jun 11, 2026',
    assignedCHW: 'Kavita Devi',
    syncStatus: 'synced',
    medicines: [
      { id: 'M-4', name: 'Metformin', dosage: '850mg', frequency: 'Twice Daily', startDate: '2026-06-12', endDate: '2026-12-12', status: 'Active', missedDoses: 0 }
    ],
    referral: {
      status: 'Pending',
      hospitalId: 'HOSP-102',
      hospitalName: 'Rural Apex General & Health Center',
      doctorName: 'Dr. Rajesh Verma',
      urgency: 'Normal',
      reason: 'Diabetic Range Glucose (215 mg/dL) & Smoking risk.',
      notes: 'Referred for diagnostic HbA1c testing.',
      dateGenerated: 'Jun 11, 2026'
    },
    reports: [],
    counsellingHistory: []
  },
  {
    id: 'P5012',
    name: 'Maria Chen',
    age: 61,
    gender: 'female',
    address: 'House #9, West Cluster, Sector C',
    phone: '+91 98450 55667',
    systolic: 128,
    diastolic: 78,
    glucose: 108,
    glucoseType: 'fasting',
    bmi: 24.1,
    weight: 58,
    height: 155,
    heartRate: 74,
    symptoms: [],
    familyHistory: true,
    smoking: false,
    alcohol: false,
    activeLifestyle: true,
    dateRegistered: 'Jun 12, 2026',
    assignedCHW: 'Kavita Devi',
    syncStatus: 'synced',
    medicines: [],
    referral: null,
    reports: [],
    counsellingHistory: [
      { category: 'Diet', date: 'Jun 12, 2026', notes: 'Reviewed healthy plate method.' }
    ]
  }
].map(p => ({
  ...p,
  evaluation: assessPatientRisk(p)
}));

export const SYSTEM_MEDICINES = [
  { name: 'Metformin', category: 'Diabetes', defaultDosage: '500mg', form: 'Tablet', description: 'Biguanide antidiabetic agent for glucose regulation.' },
  { name: 'Amlodipine', category: 'Hypertension', defaultDosage: '5mg', form: 'Tablet', description: 'Calcium channel blocker for lowering blood pressure.' },
  { name: 'Telmisartan', category: 'Hypertension', defaultDosage: '40mg', form: 'Tablet', description: 'Angiotensin II receptor blocker (ARB).' },
  { name: 'Glimepiride', category: 'Diabetes', defaultDosage: '2mg', form: 'Tablet', description: 'Sulfonylurea insulin secretagogue.' },
  { name: 'Atorvastatin', category: 'Lipid Control', defaultDosage: '10mg', form: 'Tablet', description: 'Statin for reducing cholesterol and vascular plaque.' },
  { name: 'Lisinopril', category: 'Hypertension', defaultDosage: '10mg', form: 'Tablet', description: 'ACE inhibitor for BP control and renal protection.' }
];

export const INITIAL_AUDIT_LOGS = [
  { id: 'LOG-501', timestamp: '2026-06-12 10:14 AM', user: 'Sunita Patil (CHW)', role: 'CHW', action: 'PATIENT_SCREENING', details: 'Completed AI Screening for P5012 (Maria Chen). Risk: Moderate.' },
  { id: 'LOG-502', timestamp: '2026-06-11 03:45 PM', user: 'Dr. Ananya Roy', role: 'Doctor', action: 'REFERRAL_APPROVED', details: 'Approved Referral for P7204 (Priya Sharma). Prescribed Amlodipine 5mg.' },
  { id: 'LOG-503', timestamp: '2026-06-10 04:20 PM', user: 'Ramesh Kumar (CHW)', role: 'CHW', action: 'EMERGENCY_REFERRAL', details: 'Generated Urgent Referral for P4389 (Fatima Begum) - Critical Crisis.' },
  { id: 'LOG-504', timestamp: '2026-06-08 11:30 AM', user: 'System Sync Engine', role: 'System', action: 'OFFLINE_BATCH_SYNC', details: 'Synchronized 3 offline records from Handheld Tablet #2.' }
];
