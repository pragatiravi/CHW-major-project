/**
 * Deterministic Clinical Red-Flag Detector
 * Evaluates patient symptoms and chat queries across English, Kannada, Hindi, and Marathi.
 * Runs BEFORE any AI model or search retrieval to guarantee emergency triage safety.
 */

export const RED_FLAG_CATEGORIES = {
  CARDIAC: 'cardiac',
  RESPIRATORY: 'respiratory',
  STROKE: 'stroke',
  CONSCIOUSNESS: 'consciousness',
  HEMORRHAGE: 'hemorrhage',
  CRITICAL_VITALS: 'critical_vitals'
};

const EMERGENCY_MESSAGES = {
  en: {
    title: 'CRITICAL EMERGENCY WARNING DETECTED',
    warning: 'The reported symptoms indicate a potential life-threatening emergency. Do not wait for AI advice or routine clinic visits.',
    action: 'Immediately call 108 for an emergency ambulance or transport the patient to the nearest Hospital / Community Health Centre (CHC).',
    callBtn: 'Call 108 Ambulance Now',
    reportBtn: 'Generate Emergency Referral Slip'
  },
  kn: {
    title: 'ತುರ್ತು ಅಪಾಯದ ಎಚ್ಚರಿಕೆ ಪತ್ತೆಯಾಗಿದೆ',
    warning: 'ಈ ಲಕ್ಷಣಗಳು ಜೀವಕ್ಕೆ ಅಪಾಯಕಾರಿಯಾದ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯನ್ನು ಸೂಚಿಸುತ್ತವೆ. AI ಸಲಹೆಗಾಗಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಕ್ಲಿನಿಕ್‌ಗೆ ಕಾಯಬೇಡಿ.',
    action: 'ತಕ್ಷಣವೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ರೋಗಿಯನ್ನು ತಕ್ಷಣ ಹತ್ತಿರದ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ (CHC) ಕರೆದೊಯ್ಯಿರಿ.',
    callBtn: 'ಈಗಲೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ',
    reportBtn: 'ತುರ್ತು ರೆಫರಲ್ ಚೀಟಿ ತಯಾರಿಸಿ'
  },
  hi: {
    title: 'गंभीर आपातकालीन चेतावनी',
    warning: 'बताए गए लक्षण एक संभावित जानलेवा आपात स्थिति का संकेत देते हैं। AI सलाह या सामान्य ओपीडी का इंतजार न करें।',
    action: 'तुरंत 108 एम्बुलेंस को कॉल करें या मरीज को नजदीकी अस्पताल / सामुदायिक स्वास्थ्य केंद्र (CHC) ले जाएं।',
    callBtn: 'अभी 108 एम्बुलेंस को कॉल करें',
    reportBtn: 'आपातकालीन रेफरल पर्ची बनाएं'
  },
  mr: {
    title: 'तात्काळ आणीबाणी इशारा आढळला',
    warning: 'सांगितलेली लक्षणे संभाव्य जीवघेण्या आणीबाणीचे संकेत देतात. AI सल्ल्याची किंवा सामान्य तपासणीची वाट पाहू नका.',
    action: 'त्वरित 108 रुग्णवाहिकेला कॉल करा किंवा रुग्णाला जवळच्या ग्रामीण रुग्णालय / प्राथमिक आरोग्य केंद्रात न्या.',
    callBtn: 'आता 108 रुग्णवाहिकेला कॉल करा',
    reportBtn: 'आणीबाणी रेफरल स्लिप तयार करा'
  }
};

/**
 * Robust pair and keyword rules for clinical emergency detection
 */
const CLINICAL_RULES = [
  // 1. CARDIAC
  {
    category: RED_FLAG_CATEGORIES.CARDIAC,
    test: (text) => {
      // Direct phrases
      if (/(?:chest pain|heart attack|angina|left arm pain|crushing chest)/i.test(text)) return 'chest pain / heart attack';
      if (/(?:ಎದೆ ನೋವು|ಗುಂಡಿಗೆ ನೋವು|ಹೃದಯಾಘಾತ|ಎದೆ ಭಾರ|ಎದೆ ಉರಿ)/.test(text)) return 'ಎದೆ ನೋವು / ಹೃದಯಾಘಾತ';
      if (/(?:सीने में दर्द|छाती में दर्द|दिल का दौरा|हार्ट अटैक|सीने में भारीपन)/.test(text)) return 'सीने में दर्द / हार्ट अटैक';
      if (/(?:छातीत दुखणे|छातीत वेदना|हार्ट अटॅक|हृदयविकाराचा झटका|छातीत जडपणा)/.test(text)) return 'छातीत वेदना / हार्ट अटॅक';

      // Pair co-occurrences (e.g. "सीने में तेज दर्द", "ಎದೆಯಲ್ಲಿ ತುಂಬಾ ನೋವು", "pain in chest")
      const hasChest = /(?:chest|heart|coronary|ಎದೆ|ಗುಂಡಿಗೆ|ಹೃದಯ|सीने|छाती|दिल|छातीत)/i.test(text);
      const hasPain = /(?:pain|pressure|crushing|tightness|angina|attack|ನೋವು|ಭಾರ|ಉರಿ|ಆಘಾತ|ಬಿಗಿತ|दर्द|भारीपन|जकड़न|दौरा|अटैक|दुखणे|वेदना|जडपणा|झटका)/i.test(text);
      if (hasChest && hasPain) return 'cardiac symptom correlation';

      return null;
    }
  },

  // 2. RESPIRATORY
  {
    category: RED_FLAG_CATEGORIES.RESPIRATORY,
    test: (text) => {
      if (/(?:shortness of breath|difficulty breathing|cannot breathe|can't breathe|gasping|choking)/i.test(text)) return 'severe dyspnea / shortness of breath';
      if (/(?:ಉಸಿರಾಟದ ತೊಂದರೆ|ಉಸಿರು ಕಟ್ಟುವುದು|ಉಸಿರಾಡಲು ಕಷ್ಟ|ಉಸಿರು ಸಿಗುತ್ತಿಲ್ಲ)/.test(text)) return 'ಉಸಿರಾಟದ ತೊಂದರೆ';
      if (/(?:सांस फूलना|सांस लेने में तकलीफ|सांस नहीं आ रही|दम घुटना)/.test(text)) return 'सांस लेने में गंभीर तकलीफ';
      if (/(?:श्वास घेण्यास त्रास|धाप लागणे|श्वास गुदमरणे|दम लागणे)/.test(text)) return 'श्वास घेण्यास गंभीर त्रास';
      return null;
    }
  },

  // 3. STROKE / FAST
  {
    category: RED_FLAG_CATEGORIES.STROKE,
    test: (text) => {
      if (/(?:stroke|paralysis|facial droop|face drooping|arm weakness|slurred speech)/i.test(text)) return 'acute stroke sign (FAST)';
      if (/(?:ಪಾರ್ಶ್ವವಾಯು|ಮುಖ ವಕ್ರ|ಲಕ್ವ|ಸ್ವಾಧೀನ ತಪ್ಪಿದೆ|ತೊದಲುತ್ತಿದೆ)/.test(text)) return 'ಪಾರ್ಶ್ವವಾಯು / ಲಕ್ವ';
      if (/(?:लकवा|चेहरा टेढ़ा|स्ट्रोक|फालिज|हाथ-पैर सुन्न|लड़खड़ाहट)/.test(text)) return 'लकवा / स्ट्रोक';
      if (/(?:अर्धांगवायू|तोंड वाकडे|पक्षाघात|स्ट्रोक|हातपाय लुळे)/.test(text)) return 'अर्धांगवायू / स्ट्रोक';
      return null;
    }
  },

  // 4. CONSCIOUSNESS / SYNCOPE
  {
    category: RED_FLAG_CATEGORIES.CONSCIOUSNESS,
    test: (text) => {
      if (/(?:unconscious|passed out|fainted|unresponsive|seizure|convulsion|collapsed)/i.test(text)) return 'altered consciousness / seizure';
      if (/(?:ಪ್ರಜ್ಞೆ ತಪ್ಪಿದೆ|ತಲೆತಿರುಗಿ ಬಿದ್ದಿದ್ದಾರೆ|ಮೂರ್ಛೆ|ಫಿಟ್ಸ್)/.test(text)) return 'ಪ್ರಜ್ಞಾಹೀನತೆ';
      if (/(?:बेहोश|बेहोशी|चक्कर खाकर गिरना|दौरा पड़ना|फिट्स)/.test(text)) return 'बेहोशी / दौरा';
      if (/(?:बेशुद्ध|चक्कर येऊन पडणे|शुद्ध हरपणे|फिट येणे)/.test(text)) return 'बेशुद्धावस्था / चक्कर';
      return null;
    }
  },

  // 5. HEMORRHAGE
  {
    category: RED_FLAG_CATEGORIES.HEMORRHAGE,
    test: (text) => {
      if (/(?:vomiting blood|coughing blood|blood in vomit|blood in stool|severe bleeding)/i.test(text)) return 'acute hemorrhage / gastrointestinal bleed';
      if (/(?:ರಕ್ತ ವಾಂತಿ|ಕೆಮ್ಮಿನಲ್ಲಿ ರಕ್ತ|ತೀವ್ರ ರಕ್ತಸ್ರಾವ)/.test(text)) return 'ರಕ್ತ ವಾಂತಿ / ರಕ್ತಸ್ರಾವ';
      if (/(?:खून की उल्टी|खांसी में खून|अत्यधिक रक्तस्राव)/.test(text)) return 'खून की उल्टी / रक्तस्राव';
      if (/(?:रक्ताची उलटी|खोकल्यातून रक्त|तीव्र रक्तस्त्राव)/.test(text)) return 'रक्ताची उलटी';
      return null;
    }
  },

  // 6. NUMERICAL VITALS CRISIS
  {
    category: RED_FLAG_CATEGORIES.CRITICAL_VITALS,
    test: (text) => {
      // Check BP (e.g. 210/120, 200/100, 190/110)
      const bpMatch = text.match(/(?:bp|blood pressure|ರಕ್ತದೊತ್ತಡ|रक्तचाप|रक्तदाब)?[^\d]*([12]\d{2})\s*(?:\/|\s+over\s+)\s*(\d{2,3})/i);
      if (bpMatch) {
        const sys = parseInt(bpMatch[1], 10);
        const dia = parseInt(bpMatch[2], 10);
        if (sys >= 180 || dia >= 120) {
          return `Critical BP: ${sys}/${dia} mmHg (Hypertensive Crisis)`;
        }
      }

      // Check Sugar crisis (e.g. sugar 450, sugar 500)
      const sugarMatch = text.match(/(?:sugar|glucose|ಶುಗರ್|ಸಕ್ಕರೆ|शुगर|साखर)[^\d]*([4-9]\d{2})/i);
      if (sugarMatch) {
        return `Critical Glucose: ${sugarMatch[1]} mg/dL (Severe Hyperglycemia / DKA Risk)`;
      }

      if (/(?:ketoacidosis|ಕೀಟೋಆಸಿಡೋಸಿಸ್|कीटोएसिडोसिस|कीटोअ‍ॅसिडोसिस)/i.test(text)) {
        return 'Diabetic Ketoacidosis (DKA)';
      }

      return null;
    }
  }
];

/**
 * Scan input text across all 4 languages for deterministic clinical red flags.
 *
 * @param {string} text - User input query or clinical notes
 * @param {string} lang - Preferred UI language (en, kn, hi, mr)
 * @returns {object} { isRedFlag: boolean, category: string|null, matchedKeyword: string|null, alert: object|null }
 */
export function detectClinicalRedFlag(text, lang = 'en') {
  if (!text || typeof text !== 'string') {
    return { isRedFlag: false, category: null, matchedKeyword: null, alert: null };
  }

  const normalized = text.toLowerCase().trim();
  const activeLang = ['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en';

  for (const rule of CLINICAL_RULES) {
    const matched = rule.test(normalized);
    if (matched) {
      const emergencyInfo = EMERGENCY_MESSAGES[activeLang] || EMERGENCY_MESSAGES.en;
      return {
        isRedFlag: true,
        category: rule.category,
        matchedKeyword: matched,
        alert: {
          ...emergencyInfo,
          category: rule.category
        }
      };
    }
  }

  return { isRedFlag: false, category: null, matchedKeyword: null, alert: null };
}
