import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractNumbersFromTranscript,
  parseSpokenBloodPressure,
  SUPPORTED_STT_LANGUAGES,
  isSpeechRecognitionSupported,
  stopVoiceRecognition
} from './speechRecognition';
import {
  SUPPORTED_TTS_LANGUAGES,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeech
} from './speechSynthesis';

describe('Phase 4: Web Speech Voice Engine (STT & TTS)', () => {
  describe('Vitals Transcript Parsing', () => {
    it('extracts numbers from English spoken vitals', () => {
      const numbers = extractNumbersFromTranscript('blood pressure is 135 over 88');
      expect(numbers).toEqual([135, 88]);
    });

    it('extracts decimal numbers from blood glucose or weight transcripts', () => {
      const numbers = extractNumbersFromTranscript('fasting glucose 142.5 mg/dL');
      expect(numbers).toEqual([142.5]);
    });

    it('parses spoken blood pressure into systolic and diastolic values', () => {
      const bp = parseSpokenBloodPressure('140 by 90');
      expect(bp).toEqual({
        systolic: 140,
        diastolic: 90
      });
    });

    it('corrects order if user speaks lower number first', () => {
      const bp = parseSpokenBloodPressure('85 and 130');
      expect(bp).toEqual({
        systolic: 130,
        diastolic: 85
      });
    });

    it('returns null if fewer than 2 numbers are spoken for BP', () => {
      const bp = parseSpokenBloodPressure('just 120');
      expect(bp).toBeNull();
    });
  });

  describe('Supported Language Dialects', () => {
    it('maps all 4 core Indian languages for Speech-to-Text', () => {
      expect(SUPPORTED_STT_LANGUAGES.kn).toBe('kn-IN');
      expect(SUPPORTED_STT_LANGUAGES.hi).toBe('hi-IN');
      expect(SUPPORTED_STT_LANGUAGES.mr).toBe('mr-IN');
      expect(SUPPORTED_STT_LANGUAGES.en).toBe('en-IN');
    });

    it('maps all 4 core Indian languages for Text-to-Speech', () => {
      expect(SUPPORTED_TTS_LANGUAGES.kn).toBe('kn-IN');
      expect(SUPPORTED_TTS_LANGUAGES.hi).toBe('hi-IN');
      expect(SUPPORTED_TTS_LANGUAGES.mr).toBe('mr-IN');
      expect(SUPPORTED_TTS_LANGUAGES.en).toBe('en-IN');
    });

    it('provides browser feature detection helpers', () => {
      expect(typeof isSpeechRecognitionSupported()).toBe('boolean');
      expect(typeof isSpeechSynthesisSupported()).toBe('boolean');
    });
  });

  describe('Speech Synthesis Controller', () => {
    beforeEach(() => {
      const mockSpeechSynthesis = {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([
          { lang: 'kn-IN', name: 'Google Kannada' },
          { lang: 'hi-IN', name: 'Google Hindi' },
          { lang: 'mr-IN', name: 'Google Marathi' },
          { lang: 'en-IN', name: 'Google English (India)' }
        ])
      };
      class MockSpeechSynthesisUtterance {
        constructor(text) {
          this.text = text;
          this.lang = '';
          this.rate = 1;
          this.pitch = 1;
          this.voice = null;
        }
      }

      globalThis.window = globalThis;
      globalThis.speechSynthesis = mockSpeechSynthesis;
      globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    });

    it('invokes window.speechSynthesis.speak with proper language code', () => {
      const result = speakText('ನಮಸ್ಕಾರ, ನಿಮ್ಮ ಬಿ.ಪಿ 120/80 ಇದೆ.', { lang: 'kn' });
      expect(result).toBe(true);
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('stops speech synthesis gracefully', () => {
      const stopped = stopSpeech();
      expect(stopped).toBe(true);
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    it('handles voice recognition stop without active instance gracefully', () => {
      const result = stopVoiceRecognition();
      expect(result).toBe(false);
    });
  });
});
