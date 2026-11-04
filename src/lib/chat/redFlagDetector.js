/**
 * Deterministic Clinical Red-Flag Detector
 * Evaluates patient symptoms and chat queries across English, Kannada, Hindi, and Marathi.
 * Runs BEFORE any AI model or search retrieval to guarantee emergency triage safety.
 *
 * Categories:
 *  - PREGNANCY_DANGER: Pre-eclampsia / eclampsia danger signs (highest priority)
 *  - CARDIAC: Chest pain, heart attack
 *  - RESPIRATORY: Severe shortness of breath
 *  - STROKE: Facial drooping, arm weakness, speech problems
 *  - CONSCIOUSNESS: Seizures, unconsciousness
 *  - HEMORRHAGE: Severe bleeding
 *  - CRITICAL_VITALS: BP ≥180/120, glucose ≥400
 */

export const RED_FLAG_CATEGORIES = {
  PREGNANCY_DANGER: 'pregnancy_danger',
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

/** Pregnancy-specific emergency messages */
const PREGNANCY_EMERGENCY_MESSAGES = {
  en: {
    title: '🚨 PREGNANCY DANGER SIGN DETECTED — URGENT REFERRAL',
    warning: 'High blood pressure in pregnancy (BP ≥140/90 mmHg) with these symptoms may indicate Pre-eclampsia or Eclampsia — a life-threatening emergency for both mother and baby.',
    action: 'Take the patient to the nearest hospital or PHC IMMEDIATELY. If BP ≥160/110, fits/convulsions occur, or there is severe headache, blurred vision, face/hand swelling, upper abdominal pain, reduced fetal movement, or any bleeding — CALL 108 NOW.',
    callBtn: 'Call 108 Ambulance Now',
    reportBtn: 'Generate Emergency Referral Slip'
  },
  kn: {
    title: '🚨 ಗರ್ಭಾವಸ್ಥೆಯ ಅಪಾಯದ ಲಕ್ಷಣ — ತಕ್ಷಣ ರೆಫರ್',
    warning: 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಹೆಚ್ಚಿನ ರಕ್ತದೊತ್ತಡ ಪ್ರಿ-ಎಕ್ಲಾಂಪ್ಸಿಯಾ ಸಂಕೇತವಾಗಿರಬಹುದು. ಇದು ಅಮ್ಮ ಮತ್ತು ಮಗುವಿಗೆ ಅಪಾಯಕಾರಿ.',
    action: 'ತಕ್ಷಣ ಹತ್ತಿರದ PHC/ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯಿರಿ. ತೀವ್ರ ತಲೆನೋವು, ದೃಷ್ಟಿ ಮಸುಕು, ಮುಖ/ಕೈ ಊತ, ಏದುಸಿರು, ಮೂರ್ಛೆ ಅಥವಾ ರಕ್ತಸ್ರಾವ ಕಂಡರೆ — ಈಗಲೇ 108 ಕರೆ ಮಾಡಿ.',
    callBtn: 'ಈಗಲೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ',
    reportBtn: 'ತುರ್ತು ರೆಫರಲ್ ಚೀಟಿ ತಯಾರಿಸಿ'
  },
  hi: {
    title: '🚨 गर्भावस्था में खतरे का संकेत — तत्काल रेफरल',
    warning: 'गर्भावस्था में उच्च रक्तचाप प्री-एक्लेम्पसिया का संकेत हो सकता है — यह माँ और शिशु दोनों के लिए जानलेवा आपातकाल है।',
    action: 'तुरंत नजदीकी PHC/अस्पताल ले जाएं। तेज सिरदर्द, धुंधली दृष्टि, चेहरे/हाथों की सूजन, पेट के ऊपरी भाग में दर्द, झटके या खून बह रहा हो — अभी 108 पर कॉल करें।',
    callBtn: 'अभी 108 एम्बुलेंस को कॉल करें',
    reportBtn: 'आपातकालीन रेफरल पर्ची बनाएं'
  },
  mr: {
    title: '🚨 गरोदरपणातील धोक्याचे लक्षण — तात्काळ रेफरल',
    warning: 'गरोदरपणात उच्च रक्तदाब हे प्री-एक्लेम्पसियाचे लक्षण असू शकते — हे आई आणि बाळ दोघांसाठी जीवघेणे आहे.',
    action: 'त्वरित जवळच्या PHC/रुग्णालयात न्या. तीव्र डोकेदुखी, धूसर दृष्टी, चेहरा/हात सूज, वरच्या पोटात वेदना, झटके किंवा रक्तस्राव असल्यास — आत्ताच 108 वर फोन करा.',
    callBtn: 'आता 108 रुग्णवाहिकेला कॉल करा',
    reportBtn: 'आणीबाणी रेफरल स्लिप तयार करा'
  }
};

/**
 * Robust pair and keyword rules for clinical emergency detection.
 * PREGNANCY_DANGER is checked first (highest priority).
 */
const CLINICAL_RULES = [
  // 0. PREGNANCY DANGER SIGNS (PRE-ECLAMPSIA / ECLAMPSIA) — HIGHEST PRIORITY
  {
    category: RED_FLAG_CATEGORIES.PREGNANCY_DANGER,
    emergencyMessages: PREGNANCY_EMERGENCY_MESSAGES,
    test: (text) => {
      // English
      if (/(?:pregnant|pregnancy).{0,40}(?:bp|blood pressure|high bp|140|150|160|170|headache|vision|swelling|blurring|bleeding|fits|convul|epigastric|fetal movement)/i.test(text)) return 'pregnancy hypertension / pre-eclampsia';
      if (/(?:preeclampsia|pre-eclampsia|eclampsia)/i.test(text)) return 'pre-eclampsia / eclampsia';
      if (/(?:gestational hypertension|gestational diabetes with bp|high bp in pregnancy)/i.test(text)) return 'gestational hypertension';
      if (/(?:pregnant.{0,30}severe headache|severe headache.{0,30}pregnant)/i.test(text)) return 'pregnancy danger — severe headache';
      if (/(?:pregnant.{0,30}blurred vision|blurred vision.{0,30}pregnant)/i.test(text)) return 'pregnancy danger — blurred vision';
      if (/(?:pregnant.{0,30}swelling|face.{0,20}swelling.{0,30}pregnant)/i.test(text)) return 'pregnancy danger — oedema';
      if (/(?:reduced fetal movement|no fetal movement|baby not moving)/i.test(text)) return 'reduced fetal movement — urgent';
      // Kannada
      if (/(?:ಗರ್ಭಿಣಿ|ಗರ್ಭ).{0,30}(?:ರಕ್ತದೊತ್ತಡ|ಬಿಪಿ|ತಲೆನೋವು|ದೃಷ್ಟಿ ಮಸುಕು|ಊತ|ರಕ್ತಸ್ರಾವ|ಮೂರ್ಛೆ)/.test(text)) return 'ಗರ್ಭಾವಸ್ಥೆ ಅಪಾಯ';
      if (/ಪ್ರಿ-ಎಕ್ಲಾಂಪ್ಸಿಯಾ|ಎಕ್ಲಾಂಪ್ಸಿಯಾ/.test(text)) return 'ಪ್ರಿ-ಎಕ್ಲಾಂಪ್ಸಿಯಾ';
      // Hindi
      if (/(?:गर्भवती|गर्भावस्था).{0,30}(?:रक्तचाप|बीपी|सिरदर्द|दृष्टि|सूजन|खून|दौरे)/.test(text)) return 'गर्भावस्था में अपाय';
      if (/प्री-एक्लेम्पसिया|एक्लेम्पसिया/.test(text)) return 'प्री-एक्लेम्पसिया';
      // Marathi
      if (/(?:गरोदर|गरोदरपण).{0,30}(?:रक्तदाब|बीपी|डोकेदुखी|दृष्टी|सूज|रक्तस्राव|झटके)/.test(text)) return 'गरोदरपणातील धोका';
      if (/प्री-एक्लेम्पसिया|एक्लेम्पसिया/.test(text)) return 'प्री-एक्लेम्पसिया';
      return null;
    }
  },

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
      // Use rule-specific emergency messages if provided (e.g. pregnancy), else generic
      const msgSource = rule.emergencyMessages || EMERGENCY_MESSAGES;
      const emergencyInfo = msgSource[activeLang] || msgSource.en;
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
