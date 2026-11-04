/* global process */
/**
 * Vercel Serverless Function: GET /api/health
 * Returns service health and configuration diagnostic metrics without leaking secrets.
 */

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const geminiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const sanitize = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
  const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey = sanitize(
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    process.env.SUPABASE_ANON_KEY
  );

  const isGeminiConfigured = Boolean(
    geminiKey && 
    !geminiKey.includes('your-gemini-api-key') && 
    geminiKey.length > 20
  );

  const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    supabaseKey && 
    !supabaseUrl.includes('placeholder')
  );

  const isDemoChatAllowed = Boolean(
    process.env.ALLOW_DEMO_CHAT === 'true' ||
    process.env.ALLOW_DEMO_CHAT === '1'
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: {
      isConfigured: isGeminiConfigured,
      model: modelName,
      provider: 'Google Gemini',
      allowDemoChat: isDemoChatAllowed
    },
    database: {
      isConfigured: isSupabaseConfigured,
      host: supabaseUrl ? new URL(supabaseUrl).hostname : null
    },
    version: '1.0.0-clinical',
    environment: process.env.NODE_ENV || 'production'
  });
}
