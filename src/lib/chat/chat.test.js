import { describe, it, expect } from 'vitest';
import { detectClinicalRedFlag, RED_FLAG_CATEGORIES } from './redFlagDetector';
import { searchOfflineKnowledgeBase } from './offlineRetrieval';
import { logChatInteraction } from './chatLogger';
import { OFFLINE_FALLBACK_MESSAGES } from '../../data/ncdKnowledgeBase';

describe('Deterministic Clinical Red-Flag Detector', () => {
  it('detects emergency cardiac red flags in English', () => {
    const result = detectClinicalRedFlag('Patient has severe crushing chest pain and left arm numbness', 'en');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe(RED_FLAG_CATEGORIES.CARDIAC);
    expect(result.alert.callBtn).toContain('108');
  });

  it('detects emergency cardiac red flags in Kannada', () => {
    const result = detectClinicalRedFlag('ರೋಗಿಗೆ ತೀವ್ರ ಎದೆ ನೋವು ಮತ್ತು ಎದೆ ಭಾರ ಕಾಣಿಸಿಕೊಂಡಿದೆ', 'kn');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe(RED_FLAG_CATEGORIES.CARDIAC);
    expect(result.alert.title).toContain('ತುರ್ತು');
    expect(result.alert.callBtn).toContain('108');
  });

  it('detects emergency cardiac red flags in Hindi', () => {
    const result = detectClinicalRedFlag('मरीज को सीने में तेज दर्द हो रहा है और भारीपन लग रहा है', 'hi');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe(RED_FLAG_CATEGORIES.CARDIAC);
    expect(result.alert.title).toContain('आपातकालीन');
    expect(result.alert.callBtn).toContain('108');
  });

  it('detects emergency cardiac red flags in Marathi', () => {
    const result = detectClinicalRedFlag('रुग्णाच्या छातीत दुखणे आणि असह्य वेदना सुरू आहेत', 'mr');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe(RED_FLAG_CATEGORIES.CARDIAC);
    expect(result.alert.title).toContain('आणीबाणी');
    expect(result.alert.callBtn).toContain('108');
  });

  it('detects respiratory red flags in all languages', () => {
    expect(detectClinicalRedFlag('The patient cannot breathe and is gasping', 'en').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('ಉಸಿರಾಟದ ತೊಂದರೆ ತುಂಬಾ ಜಾಸ್ತಿಯಾಗಿದೆ', 'kn').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('सांस फूलना और दम घुट रहा है', 'hi').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('श्वास घेण्यास त्रास होत आहे', 'mr').isRedFlag).toBe(true);
  });

  it('detects stroke / paralysis red flags in English, Kannada, Hindi, and Marathi', () => {
    expect(detectClinicalRedFlag('Sudden face drooping and arm weakness', 'en').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('ಮುಖ ವಕ್ರವಾಗಿದೆ ಮತ್ತು ಮಾತು ತೊದಲುತ್ತಿದೆ', 'kn').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('अचानक लकवा मार गया और चेहरा टेढ़ा हो गया', 'hi').isRedFlag).toBe(true);
    expect(detectClinicalRedFlag('तोंड वाकडे झाले आणि अर्धांगवायूची लक्षणे आहेत', 'mr').isRedFlag).toBe(true);
  });

  it('detects numerical hypertensive crisis in vitals input', () => {
    const result = detectClinicalRedFlag('Blood pressure reading is 210/125 mmHg', 'en');
    expect(result.isRedFlag).toBe(true);
    expect(result.category).toBe(RED_FLAG_CATEGORIES.CRITICAL_VITALS);
  });

  it('does NOT trigger red flags on routine, non-emergency queries', () => {
    expect(detectClinicalRedFlag('What is the normal blood sugar level for an adult?', 'en').isRedFlag).toBe(false);
    expect(detectClinicalRedFlag('ಮಧುಮೇಹ ನಿಯಂತ್ರಣಕ್ಕೆ ಸಿರಿಧಾನ್ಯ ಊಟ ಹೇಗಿರಬೇಕು?', 'kn').isRedFlag).toBe(false);
    expect(detectClinicalRedFlag('हाई बीपी में नमक कितना खाना चाहिए?', 'hi').isRedFlag).toBe(false);
    expect(detectClinicalRedFlag('मधुमेहासाठी नाचणीची भाकरी कशी आहे?', 'mr').isRedFlag).toBe(false);
  });
});

describe('Offline Retrieval Engine (Fuse.js + Bundled NCD Knowledge Base)', () => {
  it('retrieves accurate verified answers for normal blood sugar query', () => {
    const enResult = searchOfflineKnowledgeBase('What is the normal fasting blood glucose range?', 'en');
    expect(enResult.isFallback).toBe(false);
    expect(enResult.answer).toContain('70–99 mg/dL');
    expect(enResult.confidence).toBeGreaterThan(50);
  });

  it('retrieves verified Kannada advice for diabetes diet', () => {
    const knResult = searchOfflineKnowledgeBase('ಮಧುಮೇಹ ಆಹಾರ ಸಿರಿಧಾನ್ಯ', 'kn');
    expect(knResult.isFallback).toBe(false);
    expect(knResult.answer).toContain('ಸಿರಿಧಾನ್ಯ');
  });

  it('retrieves verified Hindi advice for salt restriction', () => {
    const hiResult = searchOfflineKnowledgeBase('बीपी में नमक कितना खाएं', 'hi');
    expect(hiResult.isFallback).toBe(false);
    expect(hiResult.answer).toContain('5 ग्राम');
  });

  it('retrieves verified Marathi advice for hypoglycemia management', () => {
    const mrResult = searchOfflineKnowledgeBase('साखर कमी झाल्यावर काय करावे', 'mr');
    expect(mrResult.isFallback).toBe(false);
    expect(mrResult.answer).toContain('15 चा नियम');
  });

  it('returns polite "I don\'t know, consult doctor" fallback for unknown/unrelated queries', () => {
    const outOfDomainQueries = [
      { q: 'How to fix a puncture on my motorcycle tyre?', lang: 'en' },
      { q: 'ಬೆಳಗಾವಿಯಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಸಿನಿಮಾ ಯಾವುದು?', lang: 'kn' },
      { q: 'क्रिकेट का स्कोर क्या है?', lang: 'hi' },
      { q: 'मुंबईचे हवामान कसे आहे?', lang: 'mr' }
    ];

    for (const item of outOfDomainQueries) {
      const result = searchOfflineKnowledgeBase(item.q, item.lang);
      expect(result.isFallback).toBe(true);
      expect(result.confidence).toBe(0);
      expect(result.answer).toBe(OFFLINE_FALLBACK_MESSAGES[item.lang]);
    }
  });
});

describe('Chat Interaction Logging with Consent', () => {
  it('strictly withholds logging when consent is false', async () => {
    const result = await logChatInteraction({
      userId: 'test-user',
      language: 'en',
      mode: 'offline',
      userMessage: 'What is normal BP?',
      botResponse: 'Below 120/80 mmHg',
      consentGiven: false
    });

    expect(result.logged).toBe(false);
    expect(result.reason).toBe('consent_withheld');
  });

  it('attempts to log interaction when consent is true', async () => {
    const result = await logChatInteraction({
      userId: 'test-user',
      language: 'en',
      mode: 'offline',
      userMessage: 'What is normal BP?',
      botResponse: 'Below 120/80 mmHg',
      consentGiven: true
    });

    expect(result.logged).toBe(true);
  });
});

describe('Phase 3: 30-Item Clinical AI & Triage Evaluation Benchmark', () => {
  const EMERGENCY_BENCHMARK = [
    { id: 'E01', q: 'Severe crushing chest pain spreading to my left shoulder and arm', lang: 'en', cat: 'cardiac' },
    { id: 'E02', q: 'ನನ್ನ ತಂದೆಗೆ ಎದೆಯಲ್ಲಿ ತುಂಬಾ ನೋವು ಮತ್ತು ಉರಿ ಬರುತ್ತಿದೆ', lang: 'kn', cat: 'cardiac' },
    { id: 'E03', q: 'मरीज के सीने में तेज दर्द है और भारीपन लग रहा है', lang: 'hi', cat: 'cardiac' },
    { id: 'E04', q: 'माझ्या छातीत तीव्र वेदना आणि जडपणा जाणवत आहे', lang: 'mr', cat: 'cardiac' },
    { id: 'E05', q: 'The patient cannot breathe, gasping for air and choking', lang: 'en', cat: 'respiratory' },
    { id: 'E06', q: 'ರೋಗಿಗೆ ಉಸಿರಾಟದ ತೊಂದರೆ ತುಂಬಾ ಜಾಸ್ತಿಯಾಗಿದೆ ಉಸಿರು ಕಟ್ಟುವುದು', lang: 'kn', cat: 'respiratory' },
    { id: 'E07', q: 'अचानक चेहरा टेढ़ा हो गया और हाथ-पैर सुन्न होकर लकवा मार गया', lang: 'hi', cat: 'stroke' },
    { id: 'E08', q: 'रुग्णाचे तोंड वाकडे झाले आहे आणि अर्धांगवायूची लक्षणे दिसत आहेत', lang: 'mr', cat: 'stroke' },
    { id: 'E09', q: 'Patient blood pressure reading is 220/130 mmHg on digital cuff', lang: 'en', cat: 'critical_vitals' },
    { id: 'E10', q: 'रक्त में शुगर 480 mg/dL आ रहा है', lang: 'hi', cat: 'critical_vitals' }
  ];

  const CLINICAL_NCD_BENCHMARK = [
    { id: 'C01', q: 'What is the normal fasting blood glucose range?', lang: 'en', expectedTopic: 'diabetes_ranges' },
    { id: 'C02', q: 'salt intake hypertension', lang: 'en', expectedTopic: 'hypertension_lifestyle' },
    { id: 'C03', q: 'low sugar symptoms 15 rule', lang: 'en', expectedTopic: 'hypoglycemia' },
    { id: 'C04', q: 'millet for diabetes diet', lang: 'en', expectedTopic: 'diabetes_diet' },
    { id: 'C05', q: 'stop bp medicine when normal', lang: 'en', expectedTopic: 'medication_adherence' },
    { id: 'C06', q: 'ಸಾಮಾನ್ಯ ಶುಗರ್ ಲೆವೆಲ್', lang: 'kn', expectedTopic: 'diabetes_ranges' },
    { id: 'C07', q: 'ಮಧುಮೇಹ ಆಹಾರ ಸಿರಿಧಾನ್ಯ', lang: 'kn', expectedTopic: 'diabetes_diet' },
    { id: 'C08', q: 'शुगर कम होने पर क्या करें', lang: 'hi', expectedTopic: 'hypoglycemia' },
    { id: 'C09', q: 'बीपी में नमक कितना खाएं', lang: 'hi', expectedTopic: 'hypertension_lifestyle' },
    { id: 'C10', q: 'साखर कमी झाल्यावर काय करावे', lang: 'mr', expectedTopic: 'hypoglycemia' }
  ];

  const OUT_OF_DOMAIN_BENCHMARK = [
    { id: 'O01', q: 'How do I replace the spark plug on my Hero Honda motorcycle?', lang: 'en' },
    { id: 'O02', q: 'Who won the Best Actor Oscar award in 2024?', lang: 'en' },
    { id: 'O03', q: 'How far is planet Mars from Earth in kilometers?', lang: 'en' },
    { id: 'O04', q: 'ಬೆಳಗಾವಿ ಚಿತ್ರಮಂದಿರದಲ್ಲಿ ಇವತ್ತು ಯಾವ ಹೊಸ ಸಿನಿಮಾ ಬಿಡುಗಡೆ ಆಗಿದೆ?', lang: 'kn' },
    { id: 'O05', q: 'ಮೈಸೂರು ಪಾಕ್ ಸ್ವೀಟ್ ಮಾಡಲು ಎಷ್ಟು ತುಪ್ಪ ಮತ್ತು ಕಡಲೆ ಹಿಟ್ಟು ಬೇಕು?', lang: 'kn' },
    { id: 'O06', q: 'कल के भारत और ऑस्ट्रेलिया क्रिकेट मैच का स्कोर क्या रहा?', lang: 'hi' },
    { id: 'O07', q: 'मेरा स्मार्टफोन पानी में गिर गया, इसे कैसे सुखाएं?', lang: 'hi' },
    { id: 'O08', q: 'उद्या मुंबई आणि पुण्यामध्ये किती पाऊस पडणार आहे?', lang: 'mr' },
    { id: 'O09', q: 'शेअर बाजारात आज निफ्टी किती पॉईंट्स वाढला?', lang: 'mr' },
    { id: 'O10', q: 'Who is the current prime minister of the United Kingdom?', lang: 'en' }
  ];

  it('correctly triggers emergency triage red flags for all 10 emergency benchmark queries', () => {
    for (const testItem of EMERGENCY_BENCHMARK) {
      const result = detectClinicalRedFlag(testItem.q, testItem.lang);
      expect(result.isRedFlag, `Item ${testItem.id} (${testItem.lang}) must trigger red-flag`).toBe(true);
      expect(result.category, `Item ${testItem.id} category mismatch`).toBe(testItem.cat);
      expect(result.alert.action).toContain('108');
    }
  });

  it('retrieves accurate verified clinical guidelines for all 10 non-emergency NCD inquiries without false emergency alarms', () => {
    for (const testItem of CLINICAL_NCD_BENCHMARK) {
      // Must not trigger emergency red flags
      const redFlagCheck = detectClinicalRedFlag(testItem.q, testItem.lang);
      expect(redFlagCheck.isRedFlag, `Item ${testItem.id} must not be flagged as an emergency`).toBe(false);

      // Must retrieve accurate knowledge base advice
      const retrieval = searchOfflineKnowledgeBase(testItem.q, testItem.lang);
      expect(retrieval.isFallback, `Item ${testItem.id} should match verified knowledge base`).toBe(false);
      expect(retrieval.topic).toBe(testItem.expectedTopic);
      expect(retrieval.confidence).toBeGreaterThan(40);
    }
  });

  it('returns polite humble fallback without hallucinating on all 10 out-of-domain inquiries', () => {
    for (const testItem of OUT_OF_DOMAIN_BENCHMARK) {
      const redFlagCheck = detectClinicalRedFlag(testItem.q, testItem.lang);
      expect(redFlagCheck.isRedFlag, `Item ${testItem.id} must not trigger emergency`).toBe(false);

      const retrieval = searchOfflineKnowledgeBase(testItem.q, testItem.lang);
      expect(retrieval.isFallback, `Item ${testItem.id} must return honest fallback`).toBe(true);
      expect(retrieval.confidence).toBe(0);
      expect(retrieval.answer).toBe(OFFLINE_FALLBACK_MESSAGES[testItem.lang]);
    }
  });
});
