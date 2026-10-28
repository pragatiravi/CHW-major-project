import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from './translations';
import { getLocalizedThinkLetsScripts } from '../data/counsellingScripts';

describe('Phase 4: Multilingual Translation Coverage', () => {
  const supportedLanguages = ['en', 'kn', 'hi', 'mr'];

  it('defines all 4 core Indian languages in TRANSLATIONS dictionary', () => {
    supportedLanguages.forEach(lang => {
      expect(TRANSLATIONS[lang]).toBeDefined();
      expect(typeof TRANSLATIONS[lang]).toBe('object');
    });
  });

  it('ensures 100% translation key parity across English, Kannada, Hindi, and Marathi', () => {
    const englishKeys = Object.keys(TRANSLATIONS.en);
    expect(englishKeys.length).toBeGreaterThan(50);

    ['kn', 'hi', 'mr'].forEach(targetLang => {
      const targetDict = TRANSLATIONS[targetLang];

      // Check missing keys
      const missingKeys = englishKeys.filter(k => !(k in targetDict));
      expect(missingKeys, `Language '${targetLang}' is missing keys: ${missingKeys.join(', ')}`).toEqual([]);

      // Check non-empty values
      englishKeys.forEach(k => {
        const val = targetDict[k];
        expect(val, `Key '${k}' in language '${targetLang}' should not be empty`).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('validates multilingual ThinkLets counselling scripts across all 4 languages', () => {
    supportedLanguages.forEach(lang => {
      const scripts = getLocalizedThinkLetsScripts(lang);
      expect(Array.isArray(scripts)).toBe(true);
      expect(scripts.length).toBeGreaterThanOrEqual(4);

      scripts.forEach(script => {
        expect(script.id).toBeDefined();
        expect(script.title).toBeDefined();
        expect(script.title.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(script.steps)).toBe(true);
        expect(script.steps.length).toBeGreaterThan(0);

        script.steps.forEach(step => {
          expect(step.id).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.script).toBeDefined();
          expect(step.actionItem).toBeDefined();
        });
      });
    });
  });

  it('provides distinct native translations for key clinical and emergency terms', () => {
    // Kannada check
    expect(TRANSLATIONS.kn.bloodPressure).toContain('ರಕ್ತದೊತ್ತಡ');
    expect(TRANSLATIONS.kn.sos).toContain('108');

    // Hindi check
    expect(TRANSLATIONS.hi.bloodPressure).toContain('रक्तचाप');
    expect(TRANSLATIONS.hi.greetingCHW).toBe('शुभ प्रभात');

    // Marathi check
    expect(TRANSLATIONS.mr.bloodPressure).toContain('रक्तदाब');
    expect(TRANSLATIONS.mr.signIn).toBe('लॉग इन करा');
  });
});
