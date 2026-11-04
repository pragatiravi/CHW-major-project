/* global process */
/**
 * Vercel Serverless Function: POST /api/chat
 * CHW Healthcare Toolkit — Grounded Clinical AI Pipeline
 *
 * PIPELINE ORDER:
 *  1. Auth check (real Supabase token OR ALLOW_DEMO_CHAT demo path)
 *  2. Input cleaning (trim, collapse whitespace, cap at 500 chars)
 *  3. Red-flag detector (pregnancy danger signs + cardiac/BP/stroke)
 *  4. Knowledge-base retrieval (top-3 passages, relevance threshold)
 *  5a. ONLINE: Gemini call with ONLY retrieved passages in prompt
 *  5b. OFFLINE / AI fail: return KB passages with honest badge
 *
 * AUTH RULE:
 *  - Real users: Bearer token verified with supabase.auth.getUser()
 *  - Demo users: x-chw-demo-session header + ALLOW_DEMO_CHAT=true
 *    ⚠️  The demo marker is NOT cryptographically verified — it is a
 *       quota-limited convenience gate only. Set ALLOW_DEMO_CHAT=false
 *       after the viva to close this path in production.
 *  - Anything else → 401
 *
 * RATE LIMITING NOTE:
 *  The in-process rateLimitMap is per-serverless-instance and resets on cold
 *  starts. Serverless functions may have multiple warm instances, so this
 *  provides UX smoothing only — it is NOT a production rate-limit. For strict
 *  enforcement add Vercel KV or an edge middleware counter.
 *
 * CURRENT GEMINI MODEL: gemini-2.0-flash
 *  Chosen: gemini-1.5-flash is deprecated; gemini-2.0-flash is the current
 *  stable fast model. Override with GEMINI_MODEL env var if needed.
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, UX-only — see note above)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();
const demoGlobalCounter = { count: 0, resetAt: Date.now() + 86_400_000 };

function isRateLimited(clientIp, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const data = rateLimitMap.get(clientIp) || [];
  const windowStart = now - windowMs;
  const valid = data.filter(ts => ts > windowStart);
  if (valid.length >= limit) return true;
  valid.push(now);
  rateLimitMap.set(clientIp, valid);
  if (rateLimitMap.size > 1000) {
    for (const [ip, ts] of rateLimitMap.entries()) {
      const a = ts.filter(t => t > windowStart);
      if (!a.length) rateLimitMap.delete(ip);
      else rateLimitMap.set(ip, a);
    }
  }
  return false;
}

function isDemoRateLimited(demoLimit, demoWindowMs = 86_400_000) {
  const now = Date.now();
  if (now > demoGlobalCounter.resetAt) {
    demoGlobalCounter.count = 0;
    demoGlobalCounter.resetAt = now + demoWindowMs;
  }
  demoGlobalCounter.count += 1;
  return demoGlobalCounter.count > demoLimit;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sanitize(v) { return (v || '').trim().replace(/^["']|["']$/g, ''); }

/**
 * Clean input text: trim, collapse whitespace, strip pasted web boilerplate,
 * cap at 500 characters and return { clean, wasTruncated }.
 */
function cleanInput(raw) {
  if (!raw || typeof raw !== 'string') return { clean: '', wasTruncated: false };
  let s = raw.trim();
  // Collapse multiple whitespace
  s = s.replace(/\s+/g, ' ');
  // Strip common web-page boilerplate patterns
  s = s.replace(/\b(cookie policy|privacy policy|terms of service|accept all cookies|subscribe to newsletter)\b.*$/gi, '');
  s = s.trim();
  const MAX = 500;
  if (s.length > MAX) {
    return { clean: s.slice(0, MAX), wasTruncated: true };
  }
  return { clean: s, wasTruncated: false };
}

// ---------------------------------------------------------------------------
// Multilingual offline fallback (NEVER echoes user text)
// ---------------------------------------------------------------------------
const OFFLINE_CANNOT_ANSWER = {
  en: "I don't have a verified answer for this offline. Please consult your supervisor or the nearest PHC/doctor.",
  kn: "ಈ ಪ್ರಶ್ನೆಗೆ ನನ್ನ ಬಳಿ ದೃಢೀಕರಿಸಿದ ಉತ್ತರ ಇಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರು ಅಥವಾ ಹತ್ತಿರದ PHC/ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  hi: "इस विषय पर मेरे पास सत्यापित उत्तर उपलब्ध नहीं है। कृपया अपने पर्यवेक्षक या नजदीकी PHC/डॉक्टर से मिलें।",
  mr: "या विषयावर माझ्याकडे सत्यापित उत्तर नाही. कृपया तुमच्या पर्यवेक्षकाशी किंवा जवळच्या PHC/डॉक्टरांशी संपर्क साधा."
};

// ---------------------------------------------------------------------------
// Server-side knowledge base (English only — for grounding Gemini prompts)
// The full multilingual KB lives in src/data/ncdKnowledgeBase.js (client).
// Here we keep the English answers for prompt grounding to avoid a cross-
// import between Vercel serverless and the React src tree.
// ---------------------------------------------------------------------------
const SERVER_KB = [
  {
    id: 'kb-htn-ranges',
    topic: 'hypertension_ranges',
    keywords: ['normal bp', 'blood pressure normal', 'blood pressure range', 'bp level', 'bp categories', 'normal blood pressure', 'bp reading'],
    answer: 'According to WHO/ISH guidelines: Normal BP is less than 120/80 mmHg. Elevated is 120–129 / <80 mmHg. Stage 1 Hypertension: 130–139 / 80–89 mmHg. Stage 2 Hypertension: ≥140/90 mmHg. Hypertensive Crisis (requires emergency care): ≥180/120 mmHg. Source: WHO-ISH 2020 Hypertension Guidelines; NPCDCS/NHM India.'
  },
  {
    id: 'kb-dm-ranges',
    topic: 'diabetes_ranges',
    keywords: ['normal sugar', 'blood glucose normal', 'fasting sugar', 'blood sugar level', 'glucose range', 'rbs', 'ppbs'],
    answer: 'According to clinical guidelines: Fasting blood sugar: Normal 70–99 mg/dL, Prediabetes 100–125 mg/dL, Diabetes ≥126 mg/dL. Postprandial (2 hours after meal) / Random Blood Glucose (RBG): Normal <140 mg/dL, Prediabetes 140–199 mg/dL, Diabetes ≥200 mg/dL. In diagnosed diabetics, target post-meal is under 180 mg/dL. Source: ICMR-INDIAB, ADA 2024.'
  },
  {
    id: 'kb-dm-diet',
    topic: 'diabetes_diet',
    keywords: ['diabetes diet', 'millet for diabetes', 'what to eat diabetes', 'diet for sugar', 'ragi jowar bajra', 'avoid rice diabetes'],
    answer: 'Replace polished white rice and refined flour (maida) with high-fiber whole grains: Ragi (Finger Millet), Jowar (Sorghum), Bajra, and Foxtail Millet (Navane). Fill half your plate with non-starchy green leafy vegetables. Eat whole pulses/dal. Strictly avoid sugary tea, biscuits, packaged sweets, and fried snacks. Drink plenty of water. Source: ICMR Dietary Guidelines 2024; NHM NCD guidelines.'
  },
  {
    id: 'kb-low-sugar',
    topic: 'hypoglycemia',
    keywords: ['low sugar symptoms', 'low blood sugar', 'sugar drop', 'hypoglycemia symptoms', 'shivering sweating sugar', 'low glucose', '15 15 rule', 'sugar fell', 'sugar kum'],
    answer: 'Hypoglycemia (low blood sugar): If glucose <70 mg/dL or patient feels shaky, sweaty, dizzy, or weak, apply the Rule of 15: immediately give 15 grams of fast-acting sugar (3 teaspoons of sugar dissolved in water, half a cup of fruit juice, or 3–4 glucose tablets). Wait 15 minutes and re-check blood glucose. If still low, repeat once. If the patient becomes unconscious, never force liquids into their mouth; call 108 immediately. Source: ADA Hypoglycemia Guidelines; NHM NCD.'
  },
  {
    id: 'kb-pregnancy-htn',
    topic: 'pregnancy_hypertension',
    keywords: ['pregnant high bp', 'pregnancy blood pressure', 'preeclampsia', 'pregnancy danger signs', 'bp in pregnancy', 'gestational hypertension', 'pregnant swelling headache', 'pregnancy headache vision'],
    answer: 'URGENT: High blood pressure in pregnancy (BP ≥140/90 mmHg) is a medical emergency that may indicate Pre-eclampsia. Warning signs: severe headache, blurred vision or flashing lights, swelling of face/hands, upper abdominal (right-side) pain, reduced or absent fetal movement, fits/convulsions, or any bleeding. Refer to PHC/hospital IMMEDIATELY. If BP ≥160/110 or convulsions occur, call 108 without delay. Source: WHO ANC Guidelines 2016; FOGSI; NHM RMNCH.'
  },
  {
    id: 'kb-htn-lifestyle',
    topic: 'hypertension_lifestyle',
    keywords: ['reduce high bp', 'salt hypertension', 'exercise for bp', 'walking blood pressure', 'lifestyle bp'],
    answer: 'Restrict salt to less than 5 grams (1 teaspoon) per day. Avoid pickles (uppinakayi/achar), papad, salted fish, and packaged chips. Engage in 30 minutes of brisk walking 5 days a week. Completely quit tobacco, gutkha, and smoking. Practice deep breathing/pranayama to manage stress. Source: WHO PEN Protocol; NPCDCS India.'
  },
  {
    id: 'kb-med-adherence',
    topic: 'medication_adherence',
    keywords: ['stop bp medicine', 'skip medicine', 'stop diabetes medicine', 'lifelong medicine', 'medication side effects'],
    answer: 'Never stop or reduce medication without your doctor\'s explicit advice. Blood pressure and glucose readings are normal precisely because the medicines are working. Stopping them causes dangerous rebound spikes leading to strokes, heart attacks, or kidney failure. Take medicines every day at the same time. Source: WHO PEN; NHM NCD guidelines.'
  },
  {
    id: 'kb-dm-footcare',
    topic: 'diabetic_foot_care',
    keywords: ['diabetic foot', 'foot ulcer diabetes', 'numbness feet diabetes', 'wound not healing diabetes'],
    answer: 'Inspect feet daily for cuts, blisters, redness, or swelling. Wash feet with mild soap and warm water; dry thoroughly especially between toes. Never walk barefoot—even indoors. Wear comfortable, well-fitting footwear. Cut toenails straight across. If any non-healing blister or black spot appears, see a doctor immediately. Source: WHO Diabetic Foot Guidelines; NHM.'
  },
  {
    id: 'kb-chw-referral',
    topic: 'chw_referral_criteria',
    keywords: ['when to refer patient', 'chw referral', 'refer to phc', 'high risk referral'],
    answer: 'Refer immediately to PHC/Doctor if: (1) BP ≥140/90 on two readings; (2) Random glucose ≥140 mg/dL or Fasting ≥126 mg/dL; (3) Non-healing foot wounds or vision blurring; (4) Pregnant women with elevated BP or glycosuria; (5) Medications missed for over a week. For chest pain or stroke signs—bypass referral and call 108. Source: NPCDCS Field Guide; NHM CHW Protocols.'
  },
  {
    id: 'kb-bp-measurement',
    topic: 'bp_measurement_technique',
    keywords: ['how to measure bp', 'bp measurement', 'blood pressure check', 'take blood pressure', 'bp machine'],
    answer: 'BP Measurement Technique: Patient should rest for 5 minutes before measurement. Sit comfortably with back supported, feet flat on floor. Place cuff on bare upper arm at heart level. No coffee, exercise, or smoking 30 minutes before. Take 2 readings 2 minutes apart and record the lower one. Source: WHO-ISH 2020; NPCDCS Field Protocols.'
  },
  {
    id: 'kb-hypertensive-crisis',
    topic: 'hypertensive_crisis',
    keywords: ['bp very high', 'bp 180', 'hypertensive crisis', 'bp 200', 'very high blood pressure', 'bp emergency'],
    answer: 'A BP reading of 180/120 mmHg or higher is a Hypertensive Crisis—a medical emergency. Symptoms include severe headache, chest pain, shortness of breath, vision changes, or confusion. Call 108 immediately. Do not wait. Do not give extra doses of BP medicine without medical guidance. Source: WHO-ISH 2020; AHA.'
  },
  {
    id: 'kb-gestational-diabetes',
    topic: 'gestational_diabetes',
    keywords: ['gestational diabetes', 'sugar in pregnancy', 'diabetes pregnancy', 'pregnancy blood sugar', 'gdm'],
    answer: 'Gestational Diabetes (GDM) is high blood sugar that develops during pregnancy. It usually resolves after delivery but increases risk of Type 2 diabetes later. Management: regular glucose monitoring, controlled diet (reduce sweets and white rice), light walking, and regular ANC visits. If fasting glucose ≥92 mg/dL or post-meal ≥153 mg/dL during pregnancy, refer to PHC immediately. Source: FOGSI GDM Guidelines; WHO ANC 2016.'
  },
  {
    id: 'kb-ors-dehydration',
    topic: 'ors_dehydration',
    keywords: ['dehydration', 'ors', 'oral rehydration', 'diarrhea treatment', 'loose motions treatment'],
    answer: 'For dehydration from diarrhea or vomiting: Give ORS (Oral Rehydration Solution)—mix 1 ORS sachet in 1 litre of clean water. Give small sips frequently. Continue breastfeeding in infants. If the patient cannot drink, is unconscious, or shows severe dehydration signs (sunken eyes, very dry mouth, no urine for 8 hours), go to PHC immediately. Source: WHO ORS Guidelines; IAP.'
  },
  {
    id: 'kb-vaccination-basics',
    topic: 'vaccination_basics',
    keywords: ['vaccination schedule', 'immunisation', 'vaccine child', 'routine immunisation', 'bcg polio measles'],
    answer: 'India\'s Universal Immunisation Programme (UIP) provides free vaccines at PHC/sub-centres. Key vaccines: BCG at birth, OPV and Hepatitis B at 0/6/10/14 weeks, Pentavalent, IPV, PCV, MR at 9 months, DPT booster at 16–24 months. Adults: TT for pregnant women, annual flu vaccine for high-risk groups. Consult your ASHA or PHC for the full schedule. Source: MoHFW UIP India.'
  }
];

/**
 * Very lightweight keyword-based retriever (no Fuse.js in serverless).
 * Returns top-3 passages with a relevance score.
 * @param {string} query - cleaned user query
 * @returns {Array<{id, topic, answer, score}>}
 */
function retrievePassages(query) {
  const q = query.toLowerCase();
  const scored = SERVER_KB.map(entry => {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwL = kw.toLowerCase();
      if (q.includes(kwL)) {
        score += kwL.split(' ').length * 4; // multi-word phrases score higher
      } else {
        // Token overlap
        const qTokens = q.split(/\s+/);
        const kwTokens = kwL.split(/\s+/);
        for (const qt of qTokens) {
          if (qt.length >= 3 && kwTokens.some(kt => kt.includes(qt) || qt.includes(kt))) {
            score += 2;
          }
        }
      }
    }
    return { ...entry, score };
  });
  return scored
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Minimum relevance threshold: skip KB grounding if top score is too low
const MIN_RELEVANT_SCORE = 4;

// ---------------------------------------------------------------------------
// Server-side pregnancy red-flag detector (runs before Gemini call)
// ---------------------------------------------------------------------------
const PREGNANCY_RED_FLAG_PATTERNS = [
  /pregnant.{0,30}(bp|blood pressure|high pressure)/i,
  /pregnancy.{0,30}(headache|vision|swelling|bleeding|fits|convulsions|reduced movement|epigastric)/i,
  /(preeclampsia|pre-eclampsia|eclampsia)/i,
  /gestational.{0,20}(hypertension|high bp)/i,
  /(pregnant|pregnancy|garbhavati|gavati|गर्भवती|गरोदर|ಗರ್ಭಿಣಿ).{0,30}(bp|blood pressure|140|150|160)/i,
  // Hindi/Marathi/Kannada patterns
  /(गर्भवती|गरोदर|ಗರ್ಭಿಣಿ|गरोदरपण).{0,30}(रक्तदाब|बीपी|ರಕ್ತದೊತ್ತಡ|ಬಿಪಿ)/i,
  /(severe headache|blurred vision|face swelling|hand swelling|upper abdominal pain|reduced fetal)/i
];

function isPregnancyRedFlag(text) {
  const t = text.toLowerCase();
  return PREGNANCY_RED_FLAG_PATTERNS.some(p => p.test(t));
}

const PREGNANCY_URGENT = {
  en: '🚨 URGENT REFERRAL NEEDED: High blood pressure in pregnancy may indicate Pre-eclampsia — a life-threatening emergency. Warning signs: severe headache, blurred vision, face/hand swelling, upper abdominal pain, fits, reduced fetal movement, or any bleeding. Take the patient to the nearest hospital or PHC IMMEDIATELY. If BP ≥160/110 or fits occur, call 108 Ambulance NOW.',
  hi: '🚨 तत्काल रेफरल जरूरी: गर्भावस्था में उच्च रक्तचाप प्री-एक्लेम्पसिया का संकेत हो सकता है — यह जानलेवा आपातकाल है। तुरंत निकटतम PHC/अस्पताल ले जाएं। BP ≥160/110 या झटके आने पर अभी 108 पर कॉल करें।',
  kn: '🚨 ತಕ್ಷಣ ರೆಫರ್ ಮಾಡಿ: ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಹೆಚ್ಚಿನ ರಕ್ತದೊತ್ತಡ ಪ್ರಿ-ಎಕ್ಲಾಂಪ್ಸಿಯಾ ಸಂಕೇತವಾಗಿರಬಹುದು. ತಕ್ಷಣ ಹತ್ತಿರದ PHC/ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯಿರಿ. ತೀವ್ರ ತಲೆನೋವು, ದೃಷ್ಟಿ ಮಸುಕು, ಮುಖ/ಕೈ ಊತ, ಏದುಸಿರು ಅಥವಾ ಮೂರ್ಛೆ ಕಂಡರೆ ನೇರವಾಗಿ 108 ಕರೆ ಮಾಡಿ।',
  mr: '🚨 तात्काळ रेफरल आवश्यक: गरोदरपणात उच्च रक्तदाब हे प्री-एक्लेम्पसियाचे लक्षण असू शकते — हे जीवघेणे आहे. त्वरित जवळच्या PHC/रुग्णालयात न्या. BP ≥160/110 किंवा झटके आल्यास आत्ताच 108 वर फोन करा.'
};

// ---------------------------------------------------------------------------
// System prompt (sent to Gemini)
// ---------------------------------------------------------------------------
function buildSystemPrompt(passages) {
  const passageText = passages.length > 0
    ? passages.map((p, i) => `[Passage ${i + 1} — ${p.topic}]\n${p.answer}`).join('\n\n')
    : 'No specific local passages retrieved for this question.';

  return `You are the CHW Healthcare Assistant for rural India (supporting Karnataka and Maharashtra). Your role is to help ASHA/ANM Community Health Workers and patients understand healthcare topics, non-communicable diseases (hypertension, diabetes), maternal health, nutrition, wellness, and application features.

CORE BEHAVIOR:
1. When local verified clinical passages are provided below, prioritize and ground your advice directly in those passages.
2. If the user asks about general health, nutrition, lifestyle, Type 1 vs Type 2 diabetes, blood pressure monitoring, or how to use the CHW Toolkit, provide an accurate, clear, helpful, educational response based on standard medical guidance.
3. NEVER prescribe specific prescription drugs or alter medication dosages. Always remind the user to consult a qualified medical officer at the PHC or doctor.
4. For medical emergencies (BP >= 180/120, chest pain radiating to left arm/jaw, severe shortness of breath, signs of stroke [face drooping, arm weakness, speech difficulty], or pregnancy danger signs [pre-eclampsia, severe headache, convulsions, heavy bleeding]), immediately urge the user to call 108 ambulance and reach the nearest hospital.
5. If the query is completely unrelated to health or community medicine (e.g. software programming, movies, political opinions), politely decline by stating you are a specialized community health assistant.
6. Respond in the user's requested language: English, Hindi, Kannada, or Marathi.
7. Keep responses concise, supportive, and accessible (under 200 words).

VERIFIED LOCAL CLINICAL GUIDANCE:
${passageText}`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.', code: 'method_not_allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.', code: 'rate_limited', retryAfter: 60 });
  }

  // --- Auth ---
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const isDemoRequest = req.headers['x-chw-demo-session'] === 'true';

  const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey = sanitize(
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
  const supabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'));

  let authMode = null; // 'real' | 'demo' | null

  if (token && supabaseConfigured) {
    // Real user: verify token
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        authMode = 'real';
      }
    } catch {
      // fall through
    }
  }

  if (!authMode && isDemoRequest) {
    // Demo path — check ALLOW_DEMO_CHAT flag (allows demo chat unless explicitly 'false')
    const allowDemo = sanitize(process.env.ALLOW_DEMO_CHAT).toLowerCase();
    const isDemoAllowed = allowDemo === '' || allowDemo === 'true' || allowDemo === '1' || process.env.VITE_DEMO_MODE === 'true';

    if (isDemoAllowed) {
      // Demo rate limit: global cap
      const demoLimit = parseInt(process.env.DEMO_CHAT_DAILY_LIMIT || '200', 10);
      if (isDemoRateLimited(demoLimit)) {
        return res.status(429).json({
          error: 'Demo chat daily limit reached. Please try again tomorrow, or sign up for a real account.',
          code: 'demo_rate_limited'
        });
      }
      // Demo IP limit: 10 req/min
      if (isRateLimited('demo:' + clientIp, 10, 60_000)) {
        return res.status(429).json({ error: 'Demo rate limit: please wait before sending another message.', code: 'rate_limited' });
      }
      authMode = 'demo';
    }
  }

  if (!authMode) {
    return res.status(401).json({
      error: 'Unauthorized. A valid Supabase session token is required, or enable demo mode.',
      code: 'unauthenticated'
    });
  }

  // --- Parse body ---
  const { message: rawMessage, language = 'en', context = {}, history = [] } = req.body || {};

  if (!rawMessage || typeof rawMessage !== 'string') {
    return res.status(400).json({ error: 'Invalid payload. "message" string is required.', code: 'invalid_payload' });
  }

  // Demo users cannot send patient data
  if (authMode === 'demo' && context?.patientId) {
    return res.status(400).json({ error: 'Patient data cannot be sent in demo mode.', code: 'demo_patient_data_rejected' });
  }

  // --- Input cleaning ---
  const { clean: message, wasTruncated } = cleanInput(rawMessage);
  if (!message) {
    return res.status(400).json({ error: 'Message is empty after cleaning.', code: 'invalid_payload' });
  }

  const lang = ['en', 'hi', 'kn', 'mr'].includes(language) ? language : 'en';

  // --- Pregnancy red-flag (server-side, before Gemini) ---
  if (isPregnancyRedFlag(message)) {
    console.log(`[chat] pregnancy red-flag detected, ip=${clientIp.slice(0, 8)}…`);
    return res.status(200).json({
      reply: PREGNANCY_URGENT[lang] || PREGNANCY_URGENT.en,
      source: 'red_flag_pregnancy',
      badge: 'urgent_referral',
      wasTruncated,
      code: 'red_flag'
    });
  }

  // --- Knowledge base retrieval ---
  const passages = retrievePassages(message);
  const hasRelevantPassages = passages.length > 0 && passages[0].score >= MIN_RELEVANT_SCORE;
  const retrievedTopics = passages.map(p => p.topic).join(', ') || null;

  // --- AI key check ---
  const apiKey = sanitize(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);
  const modelName = sanitize(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  if (!apiKey || apiKey.includes('your-gemini-api-key') || apiKey.length < 10) {
    // No AI key — serve offline guide if relevant, otherwise "can't answer"
    console.warn('[chat] GEMINI_API_KEY not configured');
    if (hasRelevantPassages) {
      return res.status(200).json({
        reply: passages[0].answer,
        source: 'offline_kb',
        badge: 'offline_guide',
        topic: retrievedTopics,
        passages: passages.map(p => ({ topic: p.topic, source: p.id })),
        wasTruncated,
        code: 'no_key'
      });
    }
    return res.status(200).json({
      reply: OFFLINE_CANNOT_ANSWER[lang] || OFFLINE_CANNOT_ANSWER.en,
      source: 'offline_fallback',
      badge: 'cant_answer_offline',
      wasTruncated,
      code: 'no_key'
    });
  }

  // --- Demo users: shorter max output ---
  const maxTokens = authMode === 'demo' ? 150 : 300;

  // --- Multi-turn conversation contents ---
  const geminiContents = [];
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6);
    for (const h of recent) {
      const msgText = typeof h.text === 'string' ? h.text.trim() : (typeof h.content === 'string' ? h.content.trim() : '');
      if (!msgText) continue;
      const role = (h.role === 'user' || h.sender === 'user') ? 'user' : 'model';
      geminiContents.push({
        role,
        parts: [{ text: msgText.slice(0, 500) }]
      });
    }
  }

  // Append current turn
  geminiContents.push({
    role: 'user',
    parts: [{ text: `[Language: ${lang}] ${message}` }]
  });

  // --- Online Gemini call with grounded passages ---
  const systemPrompt = buildSystemPrompt(hasRelevantPassages ? passages : []);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens }
      })
    });

    clearTimeout(timeoutId);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.warn(`[chat] Gemini ${geminiRes.status} upstream error:`, errText.slice(0, 200));
      const errorCode = geminiRes.status === 404 ? 'bad_model' : geminiRes.status === 429 ? 'rate_limited' : 'upstream_error';

      // Fall back to offline KB
      if (hasRelevantPassages) {
        return res.status(200).json({
          reply: passages[0].answer,
          source: 'offline_kb',
          badge: 'offline_guide',
          topic: retrievedTopics,
          fallbackReason: 'AI service unavailable, using offline guide.',
          wasTruncated,
          code: errorCode
        });
      }
      return res.status(200).json({
        reply: OFFLINE_CANNOT_ANSWER[lang] || OFFLINE_CANNOT_ANSWER.en,
        source: 'offline_fallback',
        badge: 'cant_answer_offline',
        fallbackReason: 'AI service unavailable.',
        wasTruncated,
        code: errorCode
      });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (reply) {
      return res.status(200).json({
        reply,
        model: modelName,
        source: 'online_ai',
        badge: 'online_ai',
        topic: retrievedTopics,
        authMode,
        wasTruncated
      });
    }
    throw new Error('Empty response from Gemini');

  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    console.warn(`[chat] Error (${isTimeout ? 'timeout' : err.message?.slice(0, 80)}), falling back to offline KB`);

    if (hasRelevantPassages) {
      return res.status(200).json({
        reply: passages[0].answer,
        source: 'offline_kb',
        badge: 'offline_guide',
        topic: retrievedTopics,
        fallbackReason: isTimeout ? 'AI request timed out. Showing offline guide.' : 'AI service error. Showing offline guide.',
        wasTruncated,
        code: isTimeout ? 'timeout' : 'upstream_error'
      });
    }
    return res.status(200).json({
      reply: OFFLINE_CANNOT_ANSWER[lang] || OFFLINE_CANNOT_ANSWER.en,
      source: 'offline_fallback',
      badge: 'cant_answer_offline',
      fallbackReason: isTimeout ? 'AI request timed out.' : 'AI service error.',
      wasTruncated,
      code: isTimeout ? 'timeout' : 'upstream_error'
    });
  }
}
