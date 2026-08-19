/**
 * Clinical Decision Support & Risk Stratification Engine
 * Implements guideline-informed clinical risk assessment algorithms
 * (American Heart Association / American Diabetes Association guidelines)
 * with transparent feature contributions and clinical decision rules.
 */

export const RISK_LEVELS = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const RISK_SCORING_MODELS = {
  GUIDELINE_ENSEMBLE: 'Guideline Ensemble Score (AHA/ADA)',
  LOGISTIC_FORMULA: 'Logistic Risk Formula',
  CLINICAL_DECISION_TREE: 'Hierarchical Clinical Decision Tree'
};

export const ALGORITHM_METADATA = {
  name: 'Community Health Decision Support Engine (CHW-CDSS v2.4)',
  version: '2.4.1-clinical',
  standards: ['AHA 2017 Hypertension Guidelines', 'ADA 2024 Standards of Care', 'WHO PEN Guidelines'],
  type: 'Deterministic Guideline-Informed Clinical Decision Support System',
  disclaimer: 'This algorithmic scoring tool provides decision support for trained community health personnel. It is not an autonomous diagnostic instrument and does not substitute for qualified clinical evaluation or laboratory diagnostics.'
};

/**
 * Main clinical risk assessment entry point
 * @param {Object} patient - Patient record
 * @param {string} selectedModel - Selected risk algorithm model
 * @returns {Object} Comprehensive Clinical Risk Assessment Report
 */
export function assessPatientRisk(patient = {}, selectedModel = RISK_SCORING_MODELS.GUIDELINE_ENSEMBLE) {
  const age = parseFloat(patient.age) || 0;
  const bmi = parseFloat(patient.bmi) || 22;
  const systolic = parseFloat(patient.systolic) || 120;
  const diastolic = parseFloat(patient.diastolic) || 80;
  const glucose = parseFloat(patient.glucose) || 90;
  const glucoseType = patient.glucoseType || 'random'; // 'fasting' | 'random' | 'postprandial'
  const symptoms = Array.isArray(patient.symptoms) ? patient.symptoms : [];
  const familyHistory = !!patient.familyHistory;
  const smoking = !!patient.smoking;
  const alcohol = !!patient.alcohol;
  const activeLifestyle = !!patient.activeLifestyle;

  const isFasting = glucoseType === 'fasting';
  const isPostprandial = glucoseType === 'postprandial';

  // -------------------------------------------------------------
  // 1. HYPERTENSION ASSESSMENT (AHA 2017 Guidelines)
  // -------------------------------------------------------------
  let htCategory;
  let htScore = 0;
  let htFeatureContributions = [];

  if (systolic >= 180 || diastolic >= 120) {
    htCategory = 'Hypertensive Crisis';
    htScore += 55;
    htFeatureContributions.push({
      feature: 'Crisis Blood Pressure',
      impact: '+55%',
      detail: `Systolic (${systolic} mmHg) or Diastolic (${diastolic} mmHg) exceeds emergency threshold (\u2265180/\u2265120).`
    });
  } else if (systolic >= 140 || diastolic >= 90) {
    htCategory = 'Stage 2 Hypertension';
    htScore += 38;
    htFeatureContributions.push({
      feature: 'Stage 2 Blood Pressure',
      impact: '+38%',
      detail: `Systolic ${systolic} / Diastolic ${diastolic} mmHg meets Stage 2 diagnostic criterion (\u2265140/\u226590).`
    });
  } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    htCategory = 'Stage 1 Hypertension';
    htScore += 22;
    htFeatureContributions.push({
      feature: 'Stage 1 Blood Pressure',
      impact: '+22%',
      detail: `Systolic ${systolic} / Diastolic ${diastolic} mmHg in Stage 1 borderline range (130-139 / 80-89).`
    });
  } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    htCategory = 'Elevated BP';
    htScore += 12;
    htFeatureContributions.push({
      feature: 'Elevated Systolic BP',
      impact: '+12%',
      detail: `Systolic ${systolic} mmHg is mildly elevated above baseline (120-129).`
    });
  } else {
    htCategory = 'Normal Blood Pressure';
    htScore += 2;
  }

  // Demographic & Co-factor Impacts
  if (age >= 60) {
    htScore += 18;
    htFeatureContributions.push({
      feature: 'Age Factor (60+ yrs)',
      impact: '+18%',
      detail: 'Arterial stiffness and reduced vascular compliance associated with advanced age.'
    });
  } else if (age >= 45) {
    htScore += 10;
    htFeatureContributions.push({
      feature: 'Age Factor (45-59 yrs)',
      impact: '+10%',
      detail: 'Mid-life cardiovascular risk demographic factor.'
    });
  }

  if (bmi >= 30) {
    htScore += 15;
    htFeatureContributions.push({
      feature: 'Obesity (BMI \u226530)',
      impact: '+15%',
      detail: `Significant systemic vascular load from measured BMI of ${bmi}.`
    });
  } else if (bmi >= 25) {
    htScore += 8;
    htFeatureContributions.push({
      feature: 'Overweight (BMI 25-29.9)',
      impact: '+8%',
      detail: `Mild elevated peripheral resistance from BMI of ${bmi}.`
    });
  }

  if (familyHistory) {
    htScore += 12;
    htFeatureContributions.push({
      feature: 'Hereditary Genetic History',
      impact: '+12%',
      detail: 'Documented first-degree family history of primary hypertension or cardiovascular events.'
    });
  }

  if (smoking) {
    htScore += 14;
    htFeatureContributions.push({
      feature: 'Active Tobacco Consumption',
      impact: '+14%',
      detail: 'Induces acute endothelial dysfunction and sustained peripheral vasoconstriction.'
    });
  }

  if (alcohol) {
    htScore += 6;
    htFeatureContributions.push({
      feature: 'Frequent Alcohol Intake',
      impact: '+6%',
      detail: 'Contributes to sympathetic nervous system activation and elevated blood pressure.'
    });
  }

  if (!activeLifestyle) {
    htScore += 8;
    htFeatureContributions.push({
      feature: 'Sedentary Lifestyle',
      impact: '+8%',
      detail: 'Lack of regular aerobic exertion (\u2264150 minutes/week) reduces cardiovascular conditioning.'
    });
  }

  if (symptoms.includes('chest_pain')) {
    htScore += 28;
    htFeatureContributions.push({
      feature: 'Chest Pain / Angina',
      impact: '+28%',
      detail: 'CRITICAL ALERT: Presenting chest tightness indicates potential acute myocardial ischemia.'
    });
  } else if (symptoms.includes('headache') || symptoms.includes('dizziness')) {
    htScore += 12;
    htFeatureContributions.push({
      feature: 'Vascular Symptoms (Headache/Dizziness)',
      impact: '+12%',
      detail: 'Symptomatic manifestation secondary to elevated systemic arterial pressures.'
    });
  }

  // Model-specific mathematical calculation
  let htProbability;
  let htConfidence;

  if (selectedModel === RISK_SCORING_MODELS.LOGISTIC_FORMULA) {
    const logit = -3.5 + (0.035 * systolic) + (0.04 * diastolic) + (0.03 * age) + (0.04 * bmi) + (smoking ? 0.8 : 0);
    htProbability = Math.round((1 / (1 + Math.exp(-logit))) * 100);
    htConfidence = 90;
  } else if (selectedModel === RISK_SCORING_MODELS.CLINICAL_DECISION_TREE) {
    if (systolic >= 180 || symptoms.includes('chest_pain')) {
      htProbability = 95;
    } else if (systolic >= 140 && age >= 45) {
      htProbability = 78;
    } else if (systolic >= 130 || bmi >= 28) {
      htProbability = 48;
    } else {
      htProbability = 12;
    }
    htConfidence = 88;
  } else {
    // Ensemble Risk Scoring
    const rawScore = htScore + Math.max(0, (systolic - 120) * 0.65);
    htProbability = Math.min(99, Math.max(5, Math.round(rawScore)));
    htConfidence = 96;
  }

  let htRiskLevel = RISK_LEVELS.LOW;
  if (systolic >= 180 || diastolic >= 120 || (symptoms.includes('chest_pain') && systolic >= 140)) {
    htRiskLevel = RISK_LEVELS.CRITICAL;
  } else if (systolic >= 140 || diastolic >= 90) {
    htRiskLevel = RISK_LEVELS.HIGH;
  } else if (systolic >= 130 || diastolic >= 80 || htProbability >= 35) {
    htRiskLevel = RISK_LEVELS.MODERATE;
  }

  // -------------------------------------------------------------
  // 2. DIABETES ASSESSMENT (ADA 2024 Guidelines)
  // -------------------------------------------------------------
  let dbCategory;
  let dbScore = 0;
  let dbFeatureContributions = [];

  if (glucose >= 300) {
    dbCategory = 'Severe Hyperglycemia';
    dbScore += 55;
    dbFeatureContributions.push({
      feature: 'Severe Hyperglycemia',
      impact: '+55%',
      detail: `Critical blood glucose concentration (${glucose} mg/dL, ${glucoseType}) exceeding safe thresholds.`
    });
  } else if ((isFasting && glucose >= 126) || (!isFasting && glucose >= 200)) {
    dbCategory = 'Diabetic Range';
    dbScore += 38;
    dbFeatureContributions.push({
      feature: 'Diabetic Diagnostic Cutoff',
      impact: '+38%',
      detail: `Blood glucose (${glucose} mg/dL, ${glucoseType}) meets diagnostic criteria (\u2265126 fasting / \u2265200 random).`
    });
  } else if ((isFasting && glucose >= 100 && glucose <= 125) || (isPostprandial && glucose >= 140 && glucose <= 199)) {
    dbCategory = 'Impaired Glucose / Prediabetes';
    dbScore += 20;
    dbFeatureContributions.push({
      feature: 'Prediabetic Range',
      impact: '+20%',
      detail: `Impaired glycemic clearance (${glucose} mg/dL, ${glucoseType}) in prediabetic spectrum.`
    });
  } else {
    dbCategory = 'Normal Blood Glucose';
    dbScore += 2;
  }

  if (bmi >= 30) {
    dbScore += 18;
    dbFeatureContributions.push({
      feature: 'Adiposity (BMI \u226530)',
      impact: '+18%',
      detail: `Excess visceral adipose tissue contributing to severe peripheral insulin resistance (BMI ${bmi}).`
    });
  } else if (bmi >= 25) {
    dbScore += 10;
    dbFeatureContributions.push({
      feature: 'Overweight (BMI 25-29.9)',
      impact: '+10%',
      detail: `Mild metabolic insulin resistance correlated with BMI of ${bmi}.`
    });
  }

  if (familyHistory) {
    dbScore += 15;
    dbFeatureContributions.push({
      feature: 'Family History of Diabetes',
      impact: '+15%',
      detail: 'First-degree biological relative diagnosed with Type 2 Diabetes.'
    });
  }

  if (age >= 45) {
    dbScore += 12;
    dbFeatureContributions.push({
      feature: 'Age Factor (\u226545 yrs)',
      impact: '+12%',
      detail: 'Age-dependent decline in pancreatic beta-cell sensitivity and secretory capacity.'
    });
  }

  let dbSymptomScore = 0;
  if (symptoms.includes('polyuria')) {
    dbSymptomScore += 12;
    dbFeatureContributions.push({
      feature: 'Polyuria (Frequent Urination)',
      impact: '+12%',
      detail: 'Osmotic diuresis resulting from renal tubular glucose threshold saturation.'
    });
  }
  if (symptoms.includes('polydipsia')) {
    dbSymptomScore += 12;
    dbFeatureContributions.push({
      feature: 'Polydipsia (Excessive Thirst)',
      impact: '+12%',
      detail: 'Hyperosmolar dehydration stimulating central osmoreceptors.'
    });
  }
  if (symptoms.includes('blurred_vision')) {
    dbSymptomScore += 10;
    dbFeatureContributions.push({
      feature: 'Blurred Vision',
      impact: '+10%',
      detail: 'Hyperglycemic osmotic swelling of the crystalline lens.'
    });
  }
  if (symptoms.includes('fatigue')) {
    dbSymptomScore += 6;
    dbFeatureContributions.push({
      feature: 'Chronic Fatigue',
      impact: '+6%',
      detail: 'Inefficient cellular glucose utilization and mitochondrial substrate deficit.'
    });
  }
  dbScore += dbSymptomScore;

  if (!activeLifestyle) {
    dbScore += 8;
    dbFeatureContributions.push({
      feature: 'Physical Inactivity',
      impact: '+8%',
      detail: 'Impaired skeletal muscle GLUT-4 transporter recruitment from lack of exertion.'
    });
  }

  let dbProbability;
  let dbConfidence;

  if (selectedModel === RISK_SCORING_MODELS.LOGISTIC_FORMULA) {
    const logit = -3.8 + (0.022 * glucose) + (0.05 * bmi) + (0.025 * age) + (familyHistory ? 0.9 : 0);
    dbProbability = Math.round((1 / (1 + Math.exp(-logit))) * 100);
    dbConfidence = 91;
  } else if (selectedModel === RISK_SCORING_MODELS.CLINICAL_DECISION_TREE) {
    if (glucose >= 200 || (isFasting && glucose >= 126)) {
      dbProbability = 92;
    } else if (glucose >= 140 && bmi >= 27) {
      dbProbability = 74;
    } else if (glucose >= 110 || familyHistory) {
      dbProbability = 42;
    } else {
      dbProbability = 10;
    }
    dbConfidence = 89;
  } else {
    // Ensemble Risk Scoring
    const scoringBaseline = isFasting ? 100 : (isPostprandial ? 140 : 200);
    const rawScore = dbScore + Math.max(0, (glucose - scoringBaseline) * 0.38);
    dbProbability = Math.min(99, Math.max(5, Math.round(rawScore)));
    dbConfidence = 97;
  }

  let dbRiskLevel = RISK_LEVELS.LOW;
  if (glucose >= 300 || (glucose >= 200 && (symptoms.includes('polyuria') || symptoms.includes('polydipsia')))) {
    dbRiskLevel = RISK_LEVELS.CRITICAL;
  } else if ((isFasting && glucose >= 126) || (!isFasting && glucose >= 200)) {
    dbRiskLevel = RISK_LEVELS.HIGH;
  } else if ((isFasting && glucose >= 100) || (isPostprandial && glucose >= 140) || dbProbability >= 35) {
    dbRiskLevel = RISK_LEVELS.MODERATE;
  }

  // -------------------------------------------------------------
  // 3. OVERALL EVALUATION & CLINICAL ACTION PLAN
  // -------------------------------------------------------------
  const maxProbability = Math.max(htProbability, dbProbability);
  let overallRiskLevel = RISK_LEVELS.LOW;

  if (htRiskLevel === RISK_LEVELS.CRITICAL || dbRiskLevel === RISK_LEVELS.CRITICAL) {
    overallRiskLevel = RISK_LEVELS.CRITICAL;
  } else if (htRiskLevel === RISK_LEVELS.HIGH || dbRiskLevel === RISK_LEVELS.HIGH) {
    overallRiskLevel = RISK_LEVELS.HIGH;
  } else if (htRiskLevel === RISK_LEVELS.MODERATE || dbRiskLevel === RISK_LEVELS.MODERATE) {
    overallRiskLevel = RISK_LEVELS.MODERATE;
  }

  const requiresReferral = overallRiskLevel === RISK_LEVELS.HIGH || overallRiskLevel === RISK_LEVELS.CRITICAL;
  const referralUrgency = overallRiskLevel === RISK_LEVELS.CRITICAL ? 'Immediate / Urgent (24-48h)' : (requiresReferral ? 'Routine Clinical (7 Days)' : 'None');
  const followUpDays = overallRiskLevel === RISK_LEVELS.CRITICAL ? 2 : (overallRiskLevel === RISK_LEVELS.HIGH ? 7 : (overallRiskLevel === RISK_LEVELS.MODERATE ? 14 : 30));

  // Synthesize Plain-English "Why this result?"
  const primaryDrivers = [];
  if (systolic >= 140 || diastolic >= 90) primaryDrivers.push(`elevated blood pressure (${systolic}/${diastolic} mmHg)`);
  if (glucose >= (isFasting ? 126 : 200)) primaryDrivers.push(`high blood glucose (${glucose} mg/dL, ${glucoseType})`);
  else if (glucose >= (isFasting ? 100 : 140)) primaryDrivers.push(`borderline blood glucose (${glucose} mg/dL)`);
  if (bmi >= 30) primaryDrivers.push(`obesity index (BMI ${bmi})`);
  if (symptoms.length > 0) primaryDrivers.push(`presenting symptoms (${symptoms.join(', ').replace(/_/g, ' ')})`);
  if (smoking) primaryDrivers.push('active tobacco use');
  if (familyHistory) primaryDrivers.push('family medical history');

  const whyThisResult = primaryDrivers.length > 0
    ? `Overall ${overallRiskLevel} risk is primarily driven by: ${primaryDrivers.join(', ')}.`
    : `Overall ${overallRiskLevel} risk reflects normal vital signs and absence of significant risk factors.`;

  let suggestedActions = [];
  if (overallRiskLevel === RISK_LEVELS.CRITICAL) {
    suggestedActions.push('Immediate clinical referral to the nearest district or secondary emergency hospital within 24–48 hours.');
    suggestedActions.push('⚠️ Alert attending Medical Officer and issue urgent transport coordination flag.');
    suggestedActions.push('Initiate immediate vital sign monitoring (morning and evening).');
  } else if (overallRiskLevel === RISK_LEVELS.HIGH) {
    suggestedActions.push('Schedule primary care consultation within 7 days for diagnostic laboratory confirmation (HbA1c / repeat BP series).');
    suggestedActions.push('💬 Initiate ThinkLets Counselling module for Dietary Sodium restriction and Medication Adherence.');
    suggestedActions.push('📅 Maintain a 7-day home Blood Pressure & Fasting Glucose log.');
  } else if (overallRiskLevel === RISK_LEVELS.MODERATE) {
    suggestedActions.push('Initiate ThinkLets lifestyle and dietary counselling (healthy plate method and carbohydrate moderation).');
    suggestedActions.push('Recommend a structured 150 minutes per week of moderate brisk walking.');
    suggestedActions.push('🗓️ Schedule CHW field follow-up re-screening in 14 days.');
  } else {
    suggestedActions.push('✅ Encourage continued routine healthy lifestyle maintenance and balanced nutrition.');
    suggestedActions.push('🗓️ Schedule standard annual health re-screening in 30-60 days.');
  }

  return {
    modelUsed: selectedModel,
    overallRiskLevel,
    riskPercentage: maxProbability,
    confidenceScore: Math.round((htConfidence + dbConfidence) / 2),
    requiresReferral,
    referralUrgency,
    followUpDays,
    whyThisResult,
    suggestedActions,
    hypertension: {
      category: htCategory,
      riskScore: htProbability,
      riskLevel: htRiskLevel,
      explanations: htFeatureContributions
    },
    diabetes: {
      category: dbCategory,
      riskScore: dbProbability,
      riskLevel: dbRiskLevel,
      explanations: dbFeatureContributions
    },
    // Compatibility alias for older components
    overall: {
      riskLevel: overallRiskLevel,
      score: maxProbability,
      followUpDays,
      requiresReferral,
      referralUrgency
    }
  };
}

/**
 * Standard Clinical Benchmark Test Suite
 * Used by the Admin Clinical Prediction Test Lab to verify model accuracy against ground truth profiles.
 */
export const CLINICAL_BENCHMARK_TEST_CASES = [
  {
    id: 'CASE-001',
    title: 'Healthy Adult Baseline',
    description: 'Young active adult with ideal hemodynamic parameters and no symptoms.',
    patient: {
      id: 'TEST-P01',
      name: 'Aarav Mehta (Baseline Test)',
      age: 28,
      gender: 'male',
      systolic: 118,
      diastolic: 76,
      glucose: 92,
      glucoseType: 'random',
      bmi: 22.1,
      symptoms: [],
      familyHistory: false,
      smoking: false,
      alcohol: false,
      activeLifestyle: true
    },
    expectedRisk: RISK_LEVELS.LOW,
    expectedHtCategory: 'Normal Blood Pressure',
    expectedDbCategory: 'Normal Blood Glucose'
  },
  {
    id: 'CASE-002',
    title: 'Stage 1 Hypertension & Overweight',
    description: 'Middle-aged individual with borderline elevated BP and family history.',
    patient: {
      id: 'TEST-P02',
      name: 'Priya Sharma (Stage 1 Test)',
      age: 54,
      gender: 'female',
      systolic: 136,
      diastolic: 86,
      glucose: 106,
      glucoseType: 'fasting',
      bmi: 27.2,
      symptoms: ['headache'],
      familyHistory: true,
      smoking: false,
      alcohol: false,
      activeLifestyle: false
    },
    expectedRisk: RISK_LEVELS.MODERATE,
    expectedHtCategory: 'Stage 1 Hypertension',
    expectedDbCategory: 'Impaired Glucose / Prediabetes'
  },
  {
    id: 'CASE-003',
    title: 'Stage 2 Hypertension with Tobacco Risk',
    description: 'Adult smoker with confirmed Stage 2 hypertension criteria.',
    patient: {
      id: 'TEST-P03',
      name: 'David Mwangi (Stage 2 Test)',
      age: 48,
      gender: 'male',
      systolic: 154,
      diastolic: 96,
      glucose: 142,
      glucoseType: 'random',
      bmi: 28.5,
      symptoms: ['dizziness'],
      familyHistory: true,
      smoking: true,
      alcohol: true,
      activeLifestyle: false
    },
    expectedRisk: RISK_LEVELS.HIGH,
    expectedHtCategory: 'Stage 2 Hypertension',
    expectedDbCategory: 'Normal Blood Glucose'
  },
  {
    id: 'CASE-004',
    title: 'Hypertensive Emergency with Angina',
    description: 'Elderly patient with severe BP escalation (\u2265180 mmHg) and chest pain flag.',
    patient: {
      id: 'TEST-P04',
      name: 'Fatima Begum (Crisis Test)',
      age: 68,
      gender: 'female',
      systolic: 188,
      diastolic: 114,
      glucose: 160,
      glucoseType: 'random',
      bmi: 31.0,
      symptoms: ['chest_pain', 'dizziness'],
      familyHistory: true,
      smoking: true,
      alcohol: false,
      activeLifestyle: false
    },
    expectedRisk: RISK_LEVELS.CRITICAL,
    expectedHtCategory: 'Hypertensive Crisis',
    expectedDbCategory: 'Normal Blood Glucose'
  },
  {
    id: 'CASE-005',
    title: 'Severe Hyperglycemia with Osmotic Triad',
    description: 'Diabetic emergency presentation with high blood glucose and polyuria/polydipsia.',
    patient: {
      id: 'TEST-P05',
      name: 'Ramesh Patel (Hyperglycemia Test)',
      age: 59,
      gender: 'male',
      systolic: 132,
      diastolic: 84,
      glucose: 320,
      glucoseType: 'random',
      bmi: 32.4,
      symptoms: ['polyuria', 'polydipsia', 'blurred_vision', 'fatigue'],
      familyHistory: true,
      smoking: false,
      alcohol: false,
      activeLifestyle: false
    },
    expectedRisk: RISK_LEVELS.CRITICAL,
    expectedHtCategory: 'Stage 1 Hypertension',
    expectedDbCategory: 'Severe Hyperglycemia'
  }
];

