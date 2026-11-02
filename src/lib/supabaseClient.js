import { createClient } from '@supabase/supabase-js';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const rawAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const rawPubKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || '';

// Clean and sanitize URL
const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
// Accept either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY
const cleanKey = (rawAnonKey || rawPubKey).trim();

/**
 * Validate Supabase URL format:
 * Must be a valid HTTP(S) URL and not a generic placeholder
 */
function isValidSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (lower.includes('your-project-ref') || lower.includes('placeholder') || lower.includes('example.com')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate Supabase API Key format:
 * Accepts:
 * - Legacy JWT anon keys: starts with 'eyJ' and has 3 dot-separated segments
 * - Newer Supabase publishable keys: starts with 'sb_publishable_' or 'sb_anon_'
 */
function isValidSupabaseKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('your-anon-key') || key.includes('your-publishable-key') || key.includes('placeholder')) {
    return false;
  }
  // JWT format: eyJ...
  if (key.startsWith('eyJ') && key.split('.').length === 3) {
    return true;
  }
  // Supabase modern key format: sb_publishable_... or sb_anon_...
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) {
    return true;
  }
  // Generic fallback: min length 30 characters
  return key.length >= 30;
}

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(cleanUrl) && isValidSupabaseKey(cleanKey)
);

/**
 * Startup diagnostic helper:
 * Returns safe connection status for UI display without leaking credentials.
 */
export function getSupabaseDiagnostics() {
  const urlPresent = Boolean(cleanUrl);
  const urlValid = isValidSupabaseUrl(cleanUrl);
  const keyPresent = Boolean(cleanKey);
  const keyValid = isValidSupabaseKey(cleanKey);

  let keyFormat = 'missing';
  if (cleanKey.startsWith('eyJ')) keyFormat = 'jwt_anon';
  else if (cleanKey.startsWith('sb_publishable_') || cleanKey.startsWith('sb_anon_')) keyFormat = 'supabase_publishable';
  else if (keyPresent) keyFormat = 'custom_string';

  let host = null;
  if (urlValid) {
    try {
      host = new URL(cleanUrl).hostname;
    } catch {
      host = null;
    }
  }

  const issues = [];
  if (!urlPresent) {
    issues.push('VITE_SUPABASE_URL is missing in build environment.');
  } else if (!urlValid) {
    issues.push('VITE_SUPABASE_URL contains placeholder or invalid protocol.');
  }

  if (!keyPresent) {
    issues.push('VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) is missing.');
  } else if (!keyValid) {
    issues.push('Supabase key format appears incomplete or contains placeholder text.');
  }

  return {
    isConfigured: urlValid && keyValid,
    urlPresent,
    urlValid,
    host,
    keyPresent,
    keyValid,
    keyFormat,
    keyPrefix: cleanKey ? cleanKey.slice(0, 10) + '...' : null,
    issues
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
