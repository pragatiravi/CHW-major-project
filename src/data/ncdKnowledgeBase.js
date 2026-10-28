/**
 * Bundled NCD Clinical Knowledge Base for Offline Field Operations
 * Curated from WHO-PEN, Indian ICMR-INDIAB, and National Programme for Prevention
 * & Control of Non-Communicable Diseases (NP-NCD).
 *
 * Localized across English (en), Kannada (kn), Hindi (hi), and Marathi (mr).
 */

export const NCD_KNOWLEDGE_BASE = [
  // 1. DIABETES NORMAL RANGES
  {
    id: 'kb-dm-ranges',
    topic: 'diabetes_ranges',
    keywords: {
      en: ['sugar normal range', 'blood glucose levels', 'fasting sugar', 'postprandial glucose', 'target sugar'],
      kn: ['ಸಕ್ಕರೆ ಪ್ರಮಾಣ', 'ಸಾಮಾನ್ಯ ಶುಗರ್ ಲೆವೆಲ್', 'ಖಾಲಿ ಹೊಟ್ಟೆಯ ಸಕ್ಕರೆ', 'ಊಟದ ನಂತರದ ಸಕ್ಕರೆ'],
      hi: ['शुगर का सामान्य स्तर', 'ब्लड ग्लूकोज लेवल', 'खाली पेट शुगर', 'खाने के बाद शुगर'],
      mr: ['साखरेची सामान्य पातळी', 'रक्तातील साखर', 'उपाशी पोटी साखर', 'जेवणानंतरची साखर']
    },
    question: {
      en: 'What are the normal blood glucose (sugar) ranges for adults?',
      kn: 'ವಯಸ್ಕರಲ್ಲಿ ರಕ್ತದ ಸಕ್ಕರೆಯ (ಶುಗರ್) ಸಾಮಾನ್ಯ ಪ್ರಮಾಣ ಎಷ್ಟು?',
      hi: 'वयस्कों में सामान्य ब्लड शुगर का स्तर क्या होना चाहिए?',
      mr: 'प्रौढांमध्ये रक्तातील साखरेची सामान्य पातळी काय असावी?'
    },
    answer: {
      en: 'According to clinical guidelines: Fasting blood sugar should ideally be 70–99 mg/dL (normal) and 100–125 mg/dL (prediabetes). Postprandial (2 hours after meal) or Random Blood Glucose (RBG) should be below 140 mg/dL for non-diabetic adults. In diagnosed diabetics, target post-meal is under 180 mg/dL.',
      kn: 'ವೈದ್ಯಕೀಯ ಮಾರ್ಗಸೂಚಿಗಳ ಪ್ರಕಾರ: ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸಕ್ಕರೆ ಮಟ್ಟ 70–99 mg/dL ಇರಬೇಕು. ಊಟದ 2 ಗಂಟೆಗಳ ನಂತರ ಅಥವಾ ರಾಂಡಮ್ ಶುಗರ್ (RBG) 140 mg/dL ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು. ಮಧುಮೇಹ ಹೊಂದಿರುವವರಿಗೆ ಊಟದ ನಂತರ 180 mg/dL ಗಿಂತ ಕಡಿಮೆ ಇರಿಸಿಕೊಳ್ಳುವುದು ಗುರಿಯಾಗಿದೆ.',
      hi: 'चिकित्सा दिशानिर्देशों के अनुसार: खाली पेट (फास्टिंग) शुगर 70–99 mg/dL सामान्य है। भोजन के 2 घंटे बाद या रैंडम ब्लड शुगर 140 mg/dL से कम होना चाहिए। मधुमेह रोगियों के लिए भोजन के बाद 180 mg/dL से कम रखने का लक्ष्य होता है।',
      mr: 'वैद्यकीय मार्गदर्शक तत्त्वांनुसार: उपाशी पोटी रक्तातील साखर 70–99 mg/dL सामान्य मानली जाते. जेवणानंतर किंवा रँडम ब्लड शुगर 140 mg/dL पेक्षा कमी असावी. मधुमेह असलेल्या रुग्णांसाठी जेवणानंतर 180 mg/dL च्या आत ठेवण्याचे उद्दिष्ट असावे.'
    }
  },

  // 2. HYPERTENSION NORMAL RANGES
  {
    id: 'kb-htn-ranges',
    topic: 'hypertension_ranges',
    keywords: {
      en: ['normal blood pressure', 'bp reading', 'systolic diastolic normal', 'high bp cutoff'],
      kn: ['ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡ', 'ಬಿಪಿ ರೀಡಿಂಗ್', 'ಹೈ ಬಿಪಿ ಯಾವಾಗ', 'ಸಾಮಾನ್ಯ ಬಿಪಿ ಎಷ್ಟು'],
      hi: ['सामान्य रक्तचाप', 'बीपी कितना होना चाहिए', 'हाई बीपी कब होता है', 'सिस्टोलिक डायस्टोलिक'],
      mr: ['सामान्य रक्तदाब', 'बीपी पातळी', 'उच्च रक्तदाब मर्यादा', 'सिस्टोलिक डायस्टोलिक']
    },
    question: {
      en: 'What is a normal blood pressure reading and when is it high?',
      kn: 'ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡದ ಮಟ್ಟ ಎಷ್ಟು ಮತ್ತು ಯಾವಾಗ ಅಧಿಕವೆಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ?',
      hi: 'सामान्य ब्लड प्रेशर कितना होता है और कब इसे हाई माना जाता है?',
      mr: 'सामान्य रक्तदाब किती असावा आणि तो कधी उच्च मानला जातो?'
    },
    answer: {
      en: 'Normal blood pressure is Systolic below 120 mmHg and Diastolic below 80 mmHg (<120/80). Elevated BP is 120–129/<80. Stage 1 Hypertension is 130–139 / 80–89. Stage 2 Hypertension is 140/90 mmHg or higher. Any reading ≥180/120 mmHg is a Hypertensive Crisis requiring immediate 108 emergency care.',
      kn: 'ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡ 120/80 mmHg ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು. 120-129 ಸಿಸ್ಟೊಲಿಕ್ ಹೆಚ್ಚಳವೆಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ. 130–139/80–89 ಹಂತ-1 ಅಧಿಕ ರಕ್ತದೊತ್ತಡ. 140/90 mmHg ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿದ್ದರೆ ಹಂತ-2 ಅಧಿಕ ರಕ್ತದೊತ್ತಡ. 180/120 mmHg ಮೀರಿದರೆ ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಬೇಕು.',
      hi: 'सामान्य रक्तचाप 120/80 mmHg से कम होना चाहिए। 120-129/<80 बढ़ा हुआ माना जाता है। 130–139/80–89 स्टेज 1 हाइपरटेंशन है। 140/90 mmHg या अधिक स्टेज 2 हाइपरटेंशन है। 180/120 mmHg या उससे अधिक होने पर तुरंत 108 आपातकालीन सेवा बुलाएं।',
      mr: 'सामान्य रक्तदाब 120/80 mmHg पेक्षा कमी असावा. 120-129/<80 वाढलेला मानला जातो. 130-139/80-89 हा स्टेज 1 उच्च रक्तदाब आहे. 140/90 mmHg किंवा जास्त असल्यास स्टेज 2 उच्च रक्तदाब मानला जातो. 180/120 mmHg पेक्षा जास्त असल्यास त्वरित 108 आपत्कालीन वैद्यकीय मदत घ्या.'
    }
  },

  // 3. HYPOGLYCEMIA MANAGEMENT (LOW SUGAR / 15-15 RULE)
  {
    id: 'kb-dm-hypo',
    topic: 'hypoglycemia',
    keywords: {
      en: ['low sugar', 'low sugar symptoms', 'hypoglycemia', 'shivering sweating sugar', '15 15 rule', 'sugar drop'],
      kn: ['ಸಕ್ಕರೆ ಕಡಿಮೆ', 'ಕಡಿಮೆ ಸಕ್ಕರೆ', 'ಕಡಿಮೆ ಸಕ್ಕರೆ ಲಕ್ಷಣ', 'ನಡುಕ ಬೆವರು ಶುಗರ್', 'ಲೋ ಶುಗರ್ ಪರಿಹಾರ', 'ಸಕ್ಕರೆ ಕಡಿಮೆಯಾದಾಗ'],
      hi: ['शुगर कम', 'लो शुगर', 'लो शुगर के लक्षण', 'कंपकंपी पसीना शुगर', 'शुगर कम होने पर क्या करें', 'हाइपोग्लाइसीमिया'],
      mr: ['साखर कमी', 'कमी साखर', 'साखर कमी होण्याची लक्षणे', 'घाम येणे थरथरणे', 'लो शुगर उपाय', 'हायपोग्लायसेमिया']
    },
    question: {
      en: 'What should a patient do if their blood sugar drops suddenly (Hypoglycemia)?',
      kn: 'ರಕ್ತದಲ್ಲಿ ಸಕ್ಕರೆ ಮಟ್ಟ ಹಠಾತ್ತನೆ ಕಡಿಮೆಯಾದರೆ (ಲೋ ಶುಗರ್) ರೋಗಿಯು ಏನು ಮಾಡಬೇಕು?',
      hi: 'यदि किसी मरीज का ब्लड शुगर अचानक कम हो जाए तो क्या करना चाहिए?',
      mr: 'जर रुग्णाची साखर अचानक कमी झाली तर काय करावे?'
    },
    answer: {
      en: 'If glucose is <70 mg/dL or the patient feels shaky, sweaty, dizzy, or weak, apply the "Rule of 15": immediately consume 15 grams of fast-acting sugar (e.g. 3 teaspoons of sugar in water, half a cup of fruit juice, or 3-4 candies). Wait 15 minutes and re-check blood glucose. If still low, repeat once. If patient becomes unconscious, never force liquids into their mouth; call 108 immediately.',
      kn: 'ಶುಗರ್ 70 mg/dL ಗಿಂತ ಕಡಿಮೆಯಾದರೆ ಅಥವಾ ಕೈಕಾಲು ನಡುಕ, ತೀವ್ರ ಬೆವರು, ತಲೆತಿರುಗುವಿಕೆ ಕಂಡುಬಂದರೆ "15 ರ ನಿಯಮ" ಪಾಲಿಸಿ: ತಕ್ಷಣ 3 ಚಮಚ ಸಕ್ಕರೆ ನೀರು, ಹಣ್ಣಿನ ರಸ ಅಥವಾ ಬೆಲ್ಲ ಸೇವಿಸಿ. 15 ನಿಮಿಷ ಕಾದ ನಂತರ ಶುಗರ್ ತಪಾಸಣೆ ಮಾಡಿ. ರೋಗಿ ಪ್ರಜ್ಞೆ ತಪ್ಪಿದ್ದರೆ ಬಾಯಿಗೆ ಯಾವುದೇ ದ್ರವ ಹಾಕಬೇಡಿ; ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ.',
      hi: 'यदि शुगर 70 mg/dL से कम हो या कंपकंपी, पसीना, चक्कर आए तो "15 का नियम" अपनाएं: तुरंत 3 चम्मच चीनी पानी में घोलकर पिएं या गुड़/फलों का रस लें। 15 मिनट बाद दोबारा चेक करें। यदि मरीज बेहोश हो तो मुंह में कुछ न डालें और सीधे 108 पर कॉल करें।',
      mr: 'जर साखर 70 mg/dL पेक्षा कमी झाली किंवा थरथरणे, घाम येणे, चक्कर येणे जाणवल्यास "15 चा नियम" वापरा: ताबडतोब 3 चमचे साखर पाण्यातून द्या किंवा गूळ/फळांचा रस द्या. 15 मिनिटांनी पुन्हा तपासा. रुग्ण बेशुद्ध असल्यास तोंडाने काहीही देऊ नका आणि थेट 108 वर संपर्क साधा.'
    }
  },

  // 4. DIABETIC DIET & MILLET GUIDANCE
  {
    id: 'kb-dm-diet',
    topic: 'diabetes_diet',
    keywords: {
      en: ['diabetes diet', 'what to eat in sugar', 'millet for diabetes', 'avoid white rice', 'diet plan'],
      kn: ['ಮಧುಮೇಹ ಆಹಾರ ಪದ್ಧತಿ', 'ಸಿರಿಧಾನ್ಯ ಊಟ', 'ಬಿಳಿ ಅನ್ನ ಬಿಡುವುದು', 'ರಾಗಿ ಜೋಳ ಊಟ'],
      hi: ['शुगर में क्या खाएं', 'मधुमेह का खानपान', 'मिलेट्स मोटे अनाज', 'सफेद चावल कम करें'],
      mr: ['मधुमेहातील आहार', 'मिलेट्स भरड धान्य', 'पांढरा भात टाळा', 'मधुमेहाचा डाएट']
    },
    question: {
      en: 'What diet and traditional grains are recommended for diabetes control?',
      kn: 'ಮಧುಮೇಹ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಯಾವ ಆಹಾರ ಮತ್ತು ಸಿರಿಧಾನ್ಯಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗುತ್ತದೆ?',
      hi: 'शुगर नियंत्रण के लिए कौन सा आहार और मोटे अनाज (मिलेट्स) उपयोगी हैं?',
      mr: 'मधुमेह नियंत्रणासाठी कोणता आहार आणि भरड धान्ये (मिलेट्स) उपयुक्त आहेत?'
    },
    answer: {
      en: 'Replace polished white rice and refined flour (maida) with high-fiber whole grains: Ragi (Finger Millet), Jowar (Sorghum), Bajra, and Foxtail Millet (Navane). Fill half your plate with non-starchy green leafy vegetables. Eat whole pulses/dal. Strictly avoid sugary tea, biscuits, packaged sweets, and fried snacks. Drink plenty of water.',
      kn: 'ಬಿಳಿ ಅನ್ನ ಮತ್ತು ಮೈದಾ ಬದಲಿಗೆ ನಾರಿನಂಶವಿರುವ ಸಿರಿಧಾನ್ಯಗಳನ್ನು ಬಳಸಿ: ರಾಗಿ ಮುದ್ದೆ, ಜೋಳದ ರೊಟ್ಟಿ, ನವಣೆ, ಸಾಮೆ. ಊಟದ ತಟ್ಟೆಯಲ್ಲಿ ಅರ್ಧದಷ್ಟು ಹಸಿರು ತರಕಾರಿ ಮತ್ತು ಸೊಪ್ಪು ಇರಲಿ. ಕಾಳು ಮತ್ತು ಬೇಳೆ ಸೇವಿಸಿ. ಸಕ್ಕರೆ ಬೆರೆಸಿದ ಚಹಾ, ಬಿಸ್ಕತ್ತು, ಸಿಹಿ ತಿಂಡಿಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತ್ಯಜಿಸಿ.',
      hi: 'सफेद पॉलिश चावल और मैदा की जगह फाइबर युक्त मोटे अनाज खाएं: रागी, ज्वार, बाजरा और कोदो। अपनी थाली का आधा हिस्सा हरी पत्तेदार सब्जियों से भरें। साबुत दालें खाएं। मीठी चाय, बिस्कुट, कोल्ड ड्रिंक्स और तली हुई चीजों से पूरी तरह परहेज करें।',
      mr: 'पॉलिश केलेला पांढरा भात आणि मैदा ऐवजी फायबरयुक्त भरड धान्ये खा: नाचणी, ज्वारी, बाजरी आणि भगर. ताटाचा अर्धा भाग हिरव्या पालेभाज्यांनी भरा. गोड चहा, बिस्किटे, बेकरी उत्पादने आणि तळलेले पदार्थ पूर्णपणे टाळा.'
    }
  },

  // 5. HYPERTENSION SALT & LIFESTYLE CONTROL
  {
    id: 'kb-htn-lifestyle',
    topic: 'hypertension_lifestyle',
    keywords: {
      en: ['reduce high bp naturally', 'salt intake hypertension', 'exercise for bp', 'walking for blood pressure'],
      kn: ['ರಕ್ತದೊತ್ತಡ ಕಡಿಮೆ ಮಾಡುವ ವಿಧಾನ', 'ಉಪ್ಪು ಕಡಿಮೆ ಮಾಡುವುದು', 'ಬಿಪಿ ನಡಿಗೆ ವ್ಯಾಯಾಮ', 'ಅಧಿಕ ಬಿಪಿ ನಿಯಂತ್ರಣ'],
      hi: ['हाई बीपी कैसे कम करें', 'नमक कम करना', 'बीपी में व्यायाम', 'रक्तचाप कंट्रोल'],
      mr: ['उच्च रक्तदाब कसा कमी करावा', 'मीठ कमी करणे', 'बीपीसाठी व्यायाम', 'रक्तदाब नियंत्रण']
    },
    question: {
      en: 'How can high blood pressure be controlled through diet and daily habits?',
      kn: 'ಆಹಾರ ಮತ್ತು ದಿನನಿತ್ಯದ ಅಭ್ಯಾಸಗಳ ಮೂಲಕ ಅಧಿಕ ರಕ್ತದೊತ್ತಡವನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸಬಹುದು?',
      hi: 'खानपान और दैनिक आदतों से हाई ब्लड प्रेशर को कैसे नियंत्रित किया जा सकता है?',
      mr: 'आहार आणि जीवनशैलीतील बदलांद्वारे उच्च रक्तदाब कसा नियंत्रित करता येईल?'
    },
    answer: {
      en: 'Strictly restrict salt to less than 5 grams (1 teaspoon) per day across all meals. Avoid pickles (uppinakayi/achar), papad, salted fish, and packaged chips. Engage in 30 minutes of brisk walking 5 days a week. Completely quit tobacco, gutkha, and smoking. Practice deep breathing/pranayama to manage stress.',
      kn: 'ದಿನಕ್ಕೆ 1 ಚಮಚಕ್ಕಿಂತ (5 ಗ್ರಾಂ) ಕಡಿಮೆ ಉಪ್ಪನ್ನು ಎಲ್ಲಾ ಊಟಗಳಲ್ಲಿ ಸೇವಿಸಿ. ಉಪ್ಪಿನಕಾಯಿ, ಹಪ್ಪಳ, ಉಪ್ಪು ಮೀನು ಮತ್ತು ಪ್ಯಾಕೆಟ್ ಚಿಪ್ಸ್‌ಗಳನ್ನು ಸಂಪೂರ್ಣ ತ್ಯಜಿಸಿ. ವಾರಕ್ಕೆ 5 ದಿನ ಕನಿಷ್ಠ 30 ನಿಮಿಷಗಳ ಕಾಲ ಚುರುಕಾಗಿ ನಡೆಯಿರಿ. ತಂಬಾಕು, ಗುಟ್ಕಾ, ಬೀಡಿ ಸಂಪೂರ್ಣ ನಿಲ್ಲಿಸಿ.',
      hi: 'दिनभर में 1 चम्मच (5 ग्राम) से कम नमक का सेवन करें। अचार, पापड़, नमकीन और पैकेटबंद स्नैक्स बंद करें। हफ्ते में 5 दिन कम से कम 30 मिनट तेज टहलें। बीड़ी, तंबाकू और गुटखा पूरी तरह छोड़ें। तनाव कम करने के लिए प्राणायाम करें।',
      mr: 'दिवसाला १ चमच्यापेक्षा (५ ग्रॅम) कमी मीठ वापरा. लोणचे, पापड, खारवलेले पदार्थ आणि फरसाण पूर्णपणे टाळा. आठवड्यातून ५ दिवस किमान ३० मिनिटे वेगाने चाला. तंबाखू, गुटखा आणि सिगारेटचे व्यसन त्वरित थांबवा.'
    }
  },

  // 6. MEDICATION ADHERENCE
  {
    id: 'kb-med-adherence',
    topic: 'medication_adherence',
    keywords: {
      en: ['stop bp medicine when normal', 'skip diabetes medicine', 'lifelong medicine', 'side effects'],
      kn: ['ಬಿಪಿ ಸರಿಯಾದಾಗ ಮಾತ್ರೆ ನಿಲ್ಲಿಸಬಹುದೇ', 'ಮಾತ್ರೆ ಬಿಡುವುದು', 'ಮಧುಮೇಹ ಮಾತ್ರೆ ನಿಲ್ಲಿಸುವುದು'],
      hi: ['क्या बीपी ठीक होने पर दवा बंद कर सकते हैं', 'दवा छोड़ना', 'शुगर की दवा कब तक लेनी है'],
      mr: ['बीपी सामान्य झाल्यावर औषध थांबवू शकतो का', 'औषध चुकवणे', 'मधुमेहाची गोळी बंद करणे']
    },
    question: {
      en: 'Can a patient stop taking blood pressure or diabetes medicine once their readings become normal?',
      kn: 'ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಸಕ್ಕರೆ ಮಟ್ಟ ಸಹಜ ಸ್ಥಿತಿಗೆ ಬಂದ ನಂತರ ಮಾತ್ರೆಗಳನ್ನು ನಿಲ್ಲಿಸಬಹುದೇ?',
      hi: 'क्या बीपी या शुगर नॉर्मल आने पर दवाइयां बंद की जा सकती हैं?',
      mr: 'रक्तदाब किंवा साखर सामान्य आल्यावर गोळ्या बंद करू शकतो का?'
    },
    answer: {
      en: 'NO. Never stop or reduce your medication without your doctor\'s explicit advice. Blood pressure and glucose readings are normal precisely because the medicines are working. Stopping them causes dangerous rebound spikes leading to strokes, heart attacks, or kidney failure. Take medicines consistently every day.',
      kn: 'ಖಂಡಿತವಾಗಿಯೂ ಇಲ್ಲ. ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಎಂದಿಗೂ ಔಷಧಿಯನ್ನು ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಕಡಿಮೆ ಮಾಡಬೇಡಿ. ಮಾತ್ರೆಗಳು ಕೆಲಸ ಮಾಡುತ್ತಿರುವುದರಿಂದಲೇ ನಿಮ್ಮ ರೀಡಿಂಗ್ ಸಾಮಾನ್ಯವಾಗಿದೆ. ಮಾತ್ರೆ ನಿಲ್ಲಿಸಿದರೆ ಪಾರ್ಶ್ವವಾಯು (ಲಕ್ವ), ಹೃದಯಾಘಾತ ಅಥವಾ ಮೂತ್ರಪಿಂಡ ವೈಫಲ್ಯದ ಅಪಾಯ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
      hi: 'बिल्कुल नहीं। डॉक्टर की सलाह के बिना कभी भी दवा बंद या कम न करें। आपके स्तर सामान्य इसलिए हैं क्योंकि दवा काम कर रही है। दवा बंद करने से अचानक बीपी या शुगर बढ़कर स्ट्रोक, हार्ट अटैक या किडनी फेलियर का गंभीर खतरा हो सकता है।',
      mr: 'मुळीच नाही. डॉक्टरांच्या सल्ल्याशिवाय कधीही औषध बंद करू नका. तुमचे प्रमाण सामान्य आहे कारण औषधे नियमित सुरू आहेत. गोळ्या अचानक बंद केल्यास अर्धांगवायू (लकवा), हृदयविकाराचा झटका किंवा मूत्रपिंड निकामी होण्याचा मोठा धोका असतो.'
    }
  },

  // 7. DIABETIC FOOT CARE
  {
    id: 'kb-dm-footcare',
    topic: 'diabetic_foot_care',
    keywords: {
      en: ['diabetic foot', 'foot ulcer', 'numbness in feet', 'wound not healing', 'foot care'],
      kn: ['ಪಾದದ ಆರೈಕೆ ಮಧುಮೇಹ', 'ಕಾಲಿನಲ್ಲಿ ಗಾಯ', 'ಕಾಲು ಮರಗಟ್ಟುವಿಕೆ', 'ಪಾದ ತೊಳೆಯುವುದು'],
      hi: ['डायबिटिक फुट केयर', 'पैरों में घाव', 'पैरों का सुन्न होना', 'पैर की देखभाल'],
      mr: ['डायबिटीक फूट केअर', 'पायावरील जखम', 'पाय सुन्न होणे', 'पायांची काळजी']
    },
    question: {
      en: 'How should a diabetic patient care for their feet to prevent ulcers and amputation?',
      kn: 'ಮಧುಮೇಹ ರೋಗಿಯು ಗಾಯಗಳು ಮತ್ತು ಗಂಭೀರ ತೊಂದರೆ ತಡೆಯಲು ಪಾದಗಳನ್ನು ಹೇಗೆ ಕಾಳಜಿ ವಹಿಸಬೇಕು?',
      hi: 'मधुमेह के मरीज को पैरों में अल्सर और संक्रमण से बचने के लिए क्या देखभाल करनी चाहिए?',
      mr: 'मधुमेहाच्या रुग्णाने पायात जखमा आणि संसर्ग टाळण्यासाठी कशी काळजी घ्यावी?'
    },
    answer: {
      en: 'Inspect feet daily for cuts, blisters, redness, or swelling. Wash feet daily with mild soap and warm water; dry thoroughly, especially between toes. Never walk barefoot—even indoors. Wear comfortable, well-fitting footwear. Cut toenails straight across. If any non-healing blister or black spot appears, consult a doctor immediately.',
      kn: 'ಪ್ರತಿದಿನ ಪಾದಗಳಲ್ಲಿ ಗಾಯ, ಗುಳ್ಳೆ ಅಥವಾ ಕೆಂಪಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ. ಪ್ರತಿದಿನ ಉಗುರುಬೆಚ್ಚಗಿನ ನೀರಿನಲ್ಲಿ ಪಾದ ತೊಳೆದು ಬೆರಳುಗಳ ನಡುವೆ ಚೆನ್ನಾಗಿ ಒರೆಸಿ. ಮನೆಯೊಳಗೂ ಬರಿಗಾಲಿನಲ್ಲಿ ನಡೆಯಬೇಡಿ; ಮೆತ್ತನೆಯ ಚಪ್ಪಲಿ ಧರಿಸಿ. ಯಾವುದೇ ಗಾಯ ವಾಸಿಯಾಗದಿದ್ದರೆ ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.',
      hi: 'रोजाना पैरों की जांच करें कि कोई कट, छाला या सूजन तो नहीं है। पैरों को गुनगुने पानी से धोकर उंगलियों के बीच अच्छी तरह सुखाएं। घर के अंदर भी कभी नंगे पैर न चलें। आरामदायक चप्पल पहनें। कोई भी घाव जल्दी न भरे तो तुरंत डॉक्टर को दिखाएं।',
      mr: 'दररोज पायांवर कट, फोड किंवा सूज आहे का ते तपासा. पाय कोमट पाण्याने स्वच्छ धुवून बोटांच्या मधील जागा नीट सुकवा. घरातही अनवाणी फिरू नका; मऊ चप्पल वापरा. कोणतीही जखम बरी होत नसल्यास त्वरित डॉक्टरांशी संपर्क साधा.'
    }
  },

  // 8. CHW FIELD REFERRAL CRITERIA
  {
    id: 'kb-chw-referral',
    topic: 'chw_referral_criteria',
    keywords: {
      en: ['when to refer patient to phc', 'chw referral criteria', 'high risk referral', 'doctor visit'],
      kn: ['ಯಾವಾಗ ಪಿಎಚ್‌ಸಿಗೆ ರೆಫರ್ ಮಾಡಬೇಕು', 'ವೈದ್ಯರ ಬಳಿಗೆ ಕಳುಹಿಸುವುದು', 'ರೆಫರಲ್ ನಿಯಮ'],
      hi: ['पीएचसी कब रेफर करें', 'मरीज को डॉक्टर के पास कब भेजें', 'रेफरल नियम'],
      mr: ['पीएचसीला कधी पाठवावे', 'रुग्णाला डॉक्टरांकडे कधी पाठवावे', 'रेफरल निकष']
    },
    question: {
      en: 'When should a Community Health Worker refer a screened patient to the PHC Medical Officer?',
      kn: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯು ತಪಾಸಣೆ ಮಾಡಿದ ರೋಗಿಯನ್ನು ಯಾವಾಗ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ವೈದ್ಯರಿಗೆ ರೆಫರ್ ಮಾಡಬೇಕು?',
      hi: 'आशा कार्यकर्ता को मरीज को प्राथमिक स्वास्थ्य केंद्र (PHC) डॉक्टर के पास कब रेफर करना चाहिए?',
      mr: 'आशा सेविकेने तपासणी केलेल्या रुग्णाला प्राथमिक आरोग्य केंद्रातील (PHC) डॉक्टरांकडे कधी पाठवावे?'
    },
    answer: {
      en: 'Refer immediately to PHC/Doctor if: (1) Systolic BP ≥ 140 or Diastolic BP ≥ 90 on two readings; (2) Random Blood Glucose ≥ 140 mg/dL or Fasting ≥ 126 mg/dL; (3) Non-healing foot wounds or vision blurring; (4) Pregnant women with elevated BP or glycosuria; (5) Patient has missed medications for over a week. For chest pain or stroke signs, bypass routine referral and call 108.',
      kn: 'ಈ ಸಂದರ್ಭಗಳಲ್ಲಿ ತಕ್ಷಣ PHC ವೈದ್ಯರಿಗೆ ರೆಫರ್ ಮಾಡಿ: (1) ರಕ್ತದೊತ್ತಡ 140/90 mmHg ಗಿಂತ ಹೆಚ್ಚಿದ್ದರೆ; (2) ರಾಂಡಮ್ ಶುಗರ್ 140 mg/dL ಮೀರಿದ್ದರೆ; (3) ವಾಸಿಯಾಗದ ಪಾದದ ಗಾಯ ಅಥವಾ ಕಣ್ಣು ಮಸುಕಾಗಿದ್ದರೆ; (4) ಗರ್ಭಿಣಿಯರಲ್ಲಿ ಬಿಪಿ ಅಥವಾ ಸಕ್ಕರೆ ಹೆಚ್ಚಾಗಿದ್ದರೆ; (5) ಸತತ ಒಂದು ವಾರ ಔಷಧಿ ತಪ್ಪಿಸಿದ್ದರೆ. ಎದೆನೋವು ಕಂಡುಬಂದರೆ ನೇರವಾಗಿ 108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ.',
      hi: 'इन स्थितियों में मरीज को तुरंत PHC डॉक्टर के पास भेजें: (1) बीपी 140/90 mmHg या अधिक हो; (2) रैंडम शुगर 140 mg/dL से ज्यादा हो; (3) पैर में न भरने वाला घाव या आंखों से धुंधला दिखना; (4) गर्भवती महिलाओं में उच्च रक्तचाप या शुगर; (5) एक हफ्ते से ज्यादा दवा छूटी हो। सीने में दर्द होने पर सीधे 108 पर कॉल करें।',
      mr: 'खालील प्रसंगी रुग्णाला त्वरित PHC डॉक्टरांकडे पाठवा: (1) रक्तदाब 140/90 mmHg किंवा जास्त असल्यास; (2) रँडम साखर 140 mg/dL पेक्षा जास्त असल्यास; (3) पायावरील जुनी जखम किंवा अंधुक दृष्टी; (4) गरोदर महिलांमध्ये वाढलेला रक्तदाब; (5) आठवड्याहून अधिक काळ गोळ्या चुकल्या असल्यास. छातीत दुखत असल्यास थेट 108 वर संपर्क साधा.'
    }
  }
];

export const OFFLINE_FALLBACK_MESSAGES = {
  en: 'I do not have enough verified clinical guidance on this specific question in my offline database. Please consult your Primary Health Centre (PHC) Medical Officer or ask your local ASHA worker.',
  kn: 'ಈ ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆಗೆ ನನ್ನ ಆಫ್‌ಲೈನ್ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಾಕಷ್ಟು ವೈದ್ಯಕೀಯ ಮಾರ್ಗದರ್ಶನ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ (PHC) ವೈದ್ಯರನ್ನು ಅಥವಾ ಸ್ಥಳೀಯ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  hi: 'इस विशिष्ट प्रश्न के लिए मेरे ऑफलाइन डेटाबेस में पर्याप्त चिकित्सा जानकारी उपलब्ध नहीं है। कृपया अपने प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी या स्थानीय आशा कार्यकर्ता से परामर्श करें।',
  mr: 'या विशिष्ट प्रश्नासाठी माझ्या ऑफलाइन डेटाबेसमध्ये पुरेशी वैद्यकीय माहिती उपलब्ध नाही. कृपया आपल्या प्राथमिक आरोग्य केंद्रातील (PHC) वैद्यकीय अधिकाऱ्यांचा किंवा स्थानिक आशा सेविकेचा सल्ला घ्या.'
};
