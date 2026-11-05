/**
 * Maps raw backend/Supabase errors into human-friendly, localized clinical messages.
 */

const ERROR_MAP = {
  invalid_credentials: {
    en: 'Incorrect email or password. Please verify your credentials and try again.',
    kn: 'ತಪ್ಪಾದ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    hi: 'गलत ईमेल या पासवर्ड। कृपया अपनी साख सत्यापित करें और पुनः प्रयास करें।',
    mr: 'चुकीचा ईमेल किंवा पासवर्ड. कृपया माहिती तपासा आणि पुन्हा प्रयत्न करा.'
  },
  user_not_found: {
    en: 'No account was found for this email address. Check the address or register.',
    kn: 'ಈ ಇಮೇಲ್ ವಿಳಾಸಕ್ಕೆ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ. ವಿಳಾಸ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ನೋಂದಾಯಿಸಿ.',
    hi: 'इस ईमेल पते के लिए कोई खाता नहीं मिला। पता जाँचें या पंजीकरण करें।',
    mr: 'या ईमेल पत्त्यासाठी खाते सापडले नाही. पत्ता तपासा किंवा नोंदणी करा.'
  },
  profile_missing: {
    en: 'Your account profile is missing. Please contact your supervisor.',
    kn: 'ನಿಮ್ಮ ಖಾತೆಯ ಪ್ರೊಫೈಲ್ ಕಾಣೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮೇಲ್ವಿಚಾರಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    hi: 'आपकी खाता प्रोफ़ाइल नहीं मिली। कृपया अपने पर्यवेक्षक से संपर्क करें।',
    mr: 'तुमचे खाते प्रोफाइल सापडले नाही. कृपया पर्यवेक्षकाशी संपर्क साधा.'
  },
  profile_read_failed: {
    en: 'Could not load your account profile. Please try again or contact your supervisor.',
    kn: 'ನಿಮ್ಮ ಖಾತೆಯ ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಮೇಲ್ವಿಚಾರಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    hi: 'आपकी खाता प्रोफ़ाइल लोड नहीं हो सकी। फिर प्रयास करें या पर्यवेक्षक से संपर्क करें।',
    mr: 'तुमचे खाते प्रोफाइल लोड झाले नाही. पुन्हा प्रयत्न करा किंवा पर्यवेक्षकाशी संपर्क साधा.'
  },
  email_not_confirmed: {
    en: 'Your email address has not been confirmed yet. Please check your inbox for the activation link.',
    kn: 'ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಇನ್ನೂ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲನಾ ಲಿಂಕ್‌ಗಾಗಿ ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್ ನೋಡಿ.',
    hi: 'आपका ईमेल अभी तक सत्यापित नहीं हुआ है। कृपया अपने इनबॉक्स में सत्यापन लिंक देखें।',
    mr: 'आपला ईमेल अद्याप सत्यापित झालेला नाही. कृपया आपल्या इनबॉक्समधील लिंक तपासा.'
  },
  user_already_exists: {
    en: 'An account with this email address already exists. Please sign in or use password recovery.',
    kn: 'ಈ ಇಮೇಲ್ ವಿಳಾಸದ ಖಾತೆ ಈಗಾಗಲೇ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಮರುಪಡೆಯಿರಿ.',
    hi: 'इस ईमेल के साथ पहले से ही एक खाता मौजूद है। कृपया साइन इन करें या पासवर्ड रीसेट करें।',
    mr: 'या ईमेलवर आधीच एक खाते अस्तित्वात आहे. कृपया लॉग इन करा किंवा पासवर्ड रीसेट करा.'
  },
  rate_limit: {
    en: 'Too many authentication attempts. Please wait a few moments before trying again.',
    kn: 'ಹೆಚ್ಚಿನ ಪ್ರಯತ್ನಗಳು ನಡೆದಿವೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ.',
    hi: 'बहुत सारे प्रयास किए गए हैं। कृपया कुछ क्षण प्रतीक्षा करें।',
    mr: 'अनेक अयशस्वी प्रयत्न झाले आहेत. कृपया थोडा वेळ प्रतीक्षा करा.'
  },
  weak_password: {
    en: 'Password is too weak. Please use at least 8 characters including letters and numbers.',
    kn: 'ಪಾಸ್‌ವರ್ಡ್ ದುರ್ಬಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳನ್ನು ಬಳಸಿ.',
    hi: 'पासवर्ड कमजोर है। कृपया अक्षरों और अंकों सहित कम से कम 8 अक्षर रखें।',
    mr: 'पासवर्ड खूप सोपा आहे. कृपया किमान 8 अक्षरे आणि अंक वापरा.'
  },
  account_pending: {
    en: 'Your healthcare staff account is pending supervisor approval. You will receive access once approved.',
    kn: 'ನಿಮ್ಮ ಸಿಬ್ಬಂದಿ ಖಾತೆಯು ಮೇಲ್ವಿಚಾರಕರ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಪ್ರವೇಶ ದೊರೆಯುತ್ತದೆ.',
    hi: 'आपका स्टाफ खाता सुपरवाइजर की मंजूरी के लिए लंबित है। मंजूरी मिलने के बाद ही एक्सेस मिलेगा।',
    mr: 'आपले स्टाफ खाते पर्यवेक्षकांच्या मंजुरीसाठी प्रलंबित आहे. मंजुरीनंतरच प्रवेश मिळेल.'
  },
  account_rejected: {
    en: 'This registration has been declined by the healthcare program supervisor.',
    kn: 'ಈ ನೋಂದಣಿಯನ್ನು ಆರೋಗ್ಯ ಕಾರ್ಯಕ್ರಮದ ಮೇಲ್ವಿಚಾರಕರು ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ.',
    hi: 'यह पंजीकरण स्वास्थ्य कार्यक्रम पर्यवेक्षक द्वारा अस्वीकार कर दिया गया है।',
    mr: 'ही नोंदणी आरोग्य कार्यक्रम पर्यवेक्षकांनी नाकारली आहे.'
  },
  account_suspended: {
    en: 'This account has been temporarily suspended. Please contact your administrative supervisor.',
    kn: 'ಈ ಖಾತೆಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮೇಲ್ವಿಚಾರಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    hi: 'यह खाता अस्थायी रूप से निलंबित कर दिया गया है। कृपया अपने सुपरवाइजर से संपर्क करें।',
    mr: 'हे खाते तात्पुरते निलंबित केले गेले आहे. कृपया आपल्या पर्यवेक्षकांशी संपर्क साधा.'
  },
  network_error: {
    en: 'Network connection issue. Working in offline mode.',
    kn: 'ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕ ದೋಷ. ಆಫ್‌ಲೈನ್ ಮೋಡ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.',
    hi: 'नेटवर्क कनेक्शन की समस्या। ऑफलाइन मोड में कार्य कर रहे हैं।',
    mr: 'नेटवर्क जोडणी त्रुटी. ऑफलाइन मोडमध्ये कार्य चालू आहे.'
  }
};

export function mapSupabaseAuthError(rawError, lang = 'en') {
  if (!rawError) return '';
  const code = typeof rawError === 'object' ? String(rawError.code || '').toLowerCase() : '';
  if (code === 'account_pending') return ERROR_MAP.account_pending[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (code === 'account_rejected') return ERROR_MAP.account_rejected[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (code === 'account_suspended') return ERROR_MAP.account_suspended[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (code === 'email_not_confirmed') return ERROR_MAP.email_not_confirmed[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (['over_email_send_rate_limit', 'too_many_requests', 'rate_limit_exceeded'].includes(code)) return ERROR_MAP.rate_limit[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (code === 'invalid_credentials') return ERROR_MAP.invalid_credentials[['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  if (ERROR_MAP[code]) return ERROR_MAP[code][['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en'];
  const message = (typeof rawError === 'string' ? rawError : rawError.message || '').toLowerCase();
  const currentLang = ['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en';

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return ERROR_MAP.invalid_credentials[currentLang];
  }
  if (message.includes('user not found') || message.includes('no user')) return ERROR_MAP.user_not_found[currentLang];
  if (message.includes('email not confirmed') || message.includes('confirm your email')) {
    return ERROR_MAP.email_not_confirmed[currentLang];
  }
  if (message.includes('user already registered') || message.includes('already exists')) {
    return ERROR_MAP.user_already_exists[currentLang];
  }
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('over_email_send_rate_limit')) {
    return ERROR_MAP.rate_limit[currentLang];
  }
  if (message.includes('password') && (message.includes('least') || message.includes('weak') || message.includes('short'))) {
    return ERROR_MAP.weak_password[currentLang];
  }
  if (message.includes('pending') || message.includes('supervisor approval')) {
    return ERROR_MAP.account_pending[currentLang];
  }
  if (message.includes('rejected')) {
    return ERROR_MAP.account_rejected[currentLang];
  }
  if (message.includes('suspended')) {
    return ERROR_MAP.account_suspended[currentLang];
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
    return ERROR_MAP.network_error[currentLang];
  }

  // Return the original message if no specific mapping matched
  return typeof rawError === 'string' ? rawError : rawError.message;
}
