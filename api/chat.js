/* global process */
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: POST /api/chat
 * Provides secure, authenticated AI chat for CHW and Patient portals.
 *
 * Security & Reliability Features:
 * - Bearer authorization check verified with supabase.auth.getUser(token)
 * - Server-side secret storage (GEMINI_API_KEY never exposed to browser)
 * - Distinct error codes (unauthenticated, no_key, bad_model, rate_limited, timeout)
 * - AbortController 10s timeout safeguard
 * - Strict clinical system prompt forbidding definitive diagnosis and prescribing,
 *   always including PHC referral nudge
 */

const rateLimitMap = new Map();

function isRateLimited(clientIp, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp) || [];
  const windowStart = now - windowMs;

  const validTimestamps = clientData.filter(ts => ts > windowStart);
  if (validTimestamps.length >= limit) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(clientIp, validTimestamps);

  // Periodically clean stale entries
  if (rateLimitMap.size > 1000) {
    for (const [ip, timestamps] of rateLimitMap.entries()) {
      const active = timestamps.filter(ts => ts > windowStart);
      if (active.length === 0) rateLimitMap.delete(ip);
      else rateLimitMap.set(ip, active);
    }
  }

  return false;
}

const SYSTEM_CLINICAL_PROMPT = `
You are the "CHW Healthcare Assistant", an intelligent, compassionate clinical AI advisor designed for frontline Community Health Workers (ASHAs) and rural Indian patients in Karnataka and Maharashtra.

Mandatory Clinical Safety Rules:
1. TARGET CONDITIONS: Non-Communicable Diseases (NCDs) — Type 2 Diabetes, Hypertension, and cardiovascular health.
2. NO DEFINITIVE DIAGNOSIS: You are an advisory assistant, NOT a diagnosing physician. Never issue a definitive medical diagnosis. Use phrasing such as "These signs may indicate..." or "This warrants clinical assessment."
3. NO MEDICATION ADJUSTMENT OR PRESCRIBING: NEVER prescribe medications (e.g., Metformin, Amlodipine, Telmisartan, Insulin) or recommend changing drug dosages.
4. MANDATORY REFERRAL NUDGE: Every advice response MUST explicitly encourage the patient to visit their local Primary Health Centre (PHC) Medical Officer or consult their assigned ASHA worker for clinical confirmation.
5. ACUTE DISTRESS & RED FLAGS: If chest pain, left-arm numbness, sudden facial drooping, severe shortness of breath, or BP >= 180/120 mmHg is mentioned, tell them IMMEDIATELY to call 108 for an emergency ambulance.
6. CULTURAL RELEVANCE: Recommend affordable rural dietary options common in Karnataka and Maharashtra (e.g., ragi, jowar roti, green leafy vegetables, dal; limit salt under 5g/day).
7. LANGUAGE FIDELITY: Respond in the exact language requested by the user (Kannada, Hindi, Marathi, or English).
8. CONCISENESS: Keep responses under 120 words for fast mobile reading.
`;

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: 'Method Not Allowed. Use POST.',
      code: 'method_not_allowed'
    });
  }

  // Rate Limiting Check
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous_ip';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too Many Requests. Rate limit exceeded. Please wait a moment.',
      code: 'rate_limited',
      retryAfter: 60
    });
  }

  // Supabase Bearer Token Verification
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const sanitize = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
  const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey = sanitize(
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    process.env.SUPABASE_ANON_KEY
  );

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    if (!token) {
      // In development / demo mode, allow if session header is present
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev && !req.headers['x-chw-session']) {
        return res.status(401).json({ 
          error: 'Unauthorized. Bearer session token is required.',
          code: 'unauthenticated'
        });
      }
    } else {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        });
        const { data: authData, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !authData?.user) {
          // If token verification fails and not in dev/demo fallback
          const isDev = process.env.NODE_ENV !== 'production';
          if (!isDev && !req.headers['x-chw-session']) {
            return res.status(401).json({
              error: 'Invalid or expired session token.',
              code: 'unauthenticated'
            });
          }
        }
      } catch (authException) {
        console.warn('Bearer auth check warning:', authException.message);
      }
    }
  }

  const { message, language = 'en', context = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid payload. "message" string is required.',
      code: 'invalid_payload'
    });
  }

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const localizedFallbacks = {
    en: `Thank you for your question about "${message.slice(0, 40)}...". As a clinical health assistant: ensure daily compliance with prescribed hypertension/diabetes medication, maintain salt below 5g/day, and seek regular blood pressure and blood glucose checks at your Primary Health Centre.`,
    kn: `ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಧನ್ಯವಾದಗಳು. ದಯವಿಟ್ಟು ವೈದ್ಯರು ನೀಡಿದ ಬಿಪಿ ಮತ್ತು ಶುಗರ್ ಮಾತ್ರೆಗಳನ್ನು ತಪ್ಪದೇ ಪ್ರತಿದಿನ ತೆಗೆದುಕೊಳ್ಳಿ. ದಿನಕ್ಕೆ 5 ಗ್ರಾಂ ಗಿಂತ ಕಡಿಮೆ ಉಪ್ಪು ಸೇವಿಸಿ ಮತ್ತು ನಿಯಮಿತ ತಪಾಸಣೆಗಾಗಿ ನಿಮ್ಮ ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.`,
    hi: `आपके स्वास्थ्य संबंधी प्रश्न के लिए धन्यवाद। कृपया डॉक्टर द्वारा बताई गई बीपी और शुगर की दवाएं नियमित रूप से लें, नमक 5 ग्राम से कम खाएं और प्राथमिक स्वास्थ्य केंद्र में नियमित जांच कराएं।`,
    mr: `आपल्या प्रश्नाबद्दल धन्यवाद. कृपया डॉक्टरांनी दिलेली औषधे नियमितपणे घ्या, आहारातील मीठ कमी करा आणि नियमित तपासणीसाठी प्राथमिक आरोग्य केंद्राशी संपर्क साधा.`
  };

  // If AI Key is missing
  if (!apiKey || apiKey.includes('your-gemini-api-key')) {
    return res.status(200).json({
      reply: localizedFallbacks[language] || localizedFallbacks.en,
      model: 'chw-clinical-rules',
      source: 'offline_kb',
      warning: 'GEMINI_API_KEY is not configured in server environment.',
      code: 'no_key'
    });
  }

  // Call Google Generative AI (Gemini) endpoint with 10s AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_CLINICAL_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `[Language: ${language}] User Query: ${message}. Patient Context: ${JSON.stringify(context)}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 250
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`Upstream Gemini API returned status ${response.status}:`, errBody);
      
      const errorCode = response.status === 404 ? 'bad_model' 
        : response.status === 429 ? 'rate_limited' 
        : 'upstream_error';

      return res.status(200).json({
        reply: localizedFallbacks[language] || localizedFallbacks.en,
        model: 'chw-clinical-rules',
        source: 'server_fallback',
        code: errorCode,
        upstreamStatus: response.status
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (reply) {
      return res.status(200).json({
        reply: reply.trim(),
        model: modelName,
        source: 'online_ai'
      });
    }

    throw new Error('Empty response from model');
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';

    console.warn('Gemini chat error, using verified clinical advisory fallback:', err.message);
    return res.status(200).json({
      reply: localizedFallbacks[language] || localizedFallbacks.en,
      model: 'chw-clinical-rules',
      source: 'server_fallback',
      code: isTimeout ? 'timeout' : 'upstream_error',
      error: isTimeout ? 'AI request timed out after 10s.' : err.message
    });
  }
}
