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
