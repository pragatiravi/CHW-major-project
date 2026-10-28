/**
 * Web Speech API Text-to-Speech (TTS) Engine for Rural Healthcare
 * Supports Kannada (kn-IN), Hindi (hi-IN), Marathi (mr-IN), and English (en-IN).
 */

export const SUPPORTED_TTS_LANGUAGES = {
  kn: 'kn-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Check if the browser/OS has a native TTS voice installed for the requested language
 */
export function hasNativeVoiceForLanguage(langCode) {
  if (!isSpeechSynthesisSupported()) return false;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return false;
  const bcp47 = SUPPORTED_TTS_LANGUAGES[langCode] || langCode;
  const prefix = bcp47.split('-')[0].toLowerCase();
  return voices.some(v => v.lang && (v.lang.toLowerCase() === bcp47.toLowerCase() || v.lang.toLowerCase().startsWith(prefix)));
}

/**
 * Find the best matching voice for a given BCP 47 language code
 */
export function getBestVoiceForLanguage(langCode) {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const bcp47 = SUPPORTED_TTS_LANGUAGES[langCode] || langCode;
  const prefix = bcp47.split('-')[0].toLowerCase();

  // 1. Exact match (e.g. 'kn-IN')
  const exact = voices.find(v => v.lang && v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exact) return exact;

  // 2. Prefix match (e.g. 'kn')
  const prefixMatch = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // 3. Indian English fallback if Indian voice requested
  if (bcp47.endsWith('-IN')) {
    const indianVoice = voices.find(v => v.lang && v.lang.toLowerCase() === 'en-in');
    if (indianVoice) return indianVoice;
  }

  return voices[0] || null;
}

/**
 * Speak text aloud using SpeechSynthesis
 */
export function speakText(text, options = {}) {
  const {
    lang = 'en',
    rate = 0.95,
    pitch = 1.0,
    onStart = null,
    onEnd = null,
    onError = null,
    onVoiceUnavailable = null
  } = options;

  if (!isSpeechSynthesisSupported() || !text) {
    if (onError) onError(new Error('Speech synthesis not supported or text empty'));
    return false;
  }

  // Check if native regional voice is present
  const hasVoice = hasNativeVoiceForLanguage(lang);
  if (!hasVoice && lang !== 'en') {
    if (onVoiceUnavailable) {
      onVoiceUnavailable(lang);
    }
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterance

    const bcp47 = SUPPORTED_TTS_LANGUAGES[lang] || lang;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voice = getBestVoiceForLanguage(lang);
    if (voice) {
      utterance.voice = voice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = (e) => onError(e);

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis playback error:', err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Stop any active speech utterance
 */
export function stopSpeech() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      return true;
    } catch (e) {
      console.warn('Could not cancel speech synthesis:', e);
      return false;
    }
  }
  return false;
}
