/**
 * Web Speech Recognition (Speech-to-Text) Engine for Frontline Field Healthcare
 * Supports Kannada (kn-IN), Hindi (hi-IN), Marathi (mr-IN), and English (en-IN).
 */

export const SUPPORTED_STT_LANGUAGES = {
  kn: 'kn-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

let activeRecognitionInstance = null;

/**
 * Start listening for voice input
 */
export function startVoiceRecognition({
  lang = 'en',
  continuous = false,
  onResult,
  onError,
  onEnd
}) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error('Speech recognition is not supported in this browser environment.'));
    return null;
  }

  try {
    stopVoiceRecognition(); // Terminate existing instance if active

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = SUPPORTED_STT_LANGUAGES[lang] || 'en-IN';
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      if (onResult) {
        onResult({
          transcript: transcript.trim(),
          confidence,
          parsedNumbers: extractNumbersFromTranscript(transcript)
        });
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition notice:', event.error);
      if (onError) onError(event);
    };

    recognition.onend = () => {
      activeRecognitionInstance = null;
      if (onEnd) onEnd();
    };

    recognition.start();
    activeRecognitionInstance = recognition;
    return recognition;
  } catch (err) {
    console.error('Failed to initialize speech recognition:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Stop active speech recognition
 */
export function stopVoiceRecognition() {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.stop();
    } catch {
      // Ignore
    }
    activeRecognitionInstance = null;
    return true;
  }
  return false;
}

/**
 * Extract numerical vitals from spoken speech
 * Supports phrases like "130 by 85", "140", "sugar 160", etc.
 */
export function extractNumbersFromTranscript(text) {
  if (!text) return [];
  // Match standard numbers and Indian numerals if transcribed as digits
  const matches = text.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Parse Blood Pressure from spoken transcript (e.g. "130 by 85", "130/85")
 */
export function parseSpokenBloodPressure(text) {
  if (!text) return null;
  const numbers = extractNumbersFromTranscript(text);
  if (numbers.length >= 2) {
    const [first, second] = numbers;
    return {
      systolic: Math.max(first, second),
      diastolic: Math.min(first, second)
    };
  }
  return null;
}
