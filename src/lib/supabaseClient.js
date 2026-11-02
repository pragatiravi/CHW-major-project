/* global process */
import { createClient } from '@supabase/supabase-js';

/**
 * Clean and sanitize environment variable values:
 * - Trims whitespace
 * - Strips surrounding single or double quotes (e.g. from Vercel or .env)
 */
export function sanitizeEnvValue(val) {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

// Direct static member expressions so Vite compiler inlines values at build time
const rawUrl = sanitizeEnvValue(
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL) : '')
);

const rawAnonKey = sanitizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY) : '')
);

const rawPublishableKey = sanitizeEnvValue(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== 'undefined' ? (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY) : '')
);

// Clean and sanitize URL
const cleanUrl = rawUrl.replace(/\/+$/, '');

// Accept key from ANY of: VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY (first one found)
const cleanKey = rawAnonKey || rawPublishableKey;
const activeKeySource = rawAnonKey 
  ? 'VITE_SUPABASE_ANON_KEY' 
  : (rawPublishableKey ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : null);

/**
 * Validate Supabase URL format:
 * Must be a valid HTTP(S) URL and not a generic placeholder
 */
export function isValidSupabaseUrl(url) {
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
export function isValidSupabaseKey(key) {
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
  const lookedUp = [
    { name: 'VITE_SUPABASE_URL', found: Boolean(rawUrl) },
    { name: 'VITE_SUPABASE_ANON_KEY', found: Boolean(rawAnonKey) },
    { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', found: Boolean(rawPublishableKey) }
  ];

  const urlPresent = Boolean(cleanUrl);
  const urlValid = isValidSupabaseUrl(cleanUrl);
  const keyPresent = Boolean(cleanKey);
  const keyValid = isValidSupabaseKey(cleanKey);

  let keyFormat = 'missing';
  if (cleanKey.startsWith('eyJ')) keyFormat = 'jwt_anon (legacy)';
  else if (cleanKey.startsWith('sb_publishable_')) keyFormat = 'sb_publishable (modern)';
  else if (cleanKey.startsWith('sb_anon_')) keyFormat = 'sb_anon (modern)';
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
    issues.push('VITE_SUPABASE_URL was not present when built.');
  } else if (!urlValid) {
    issues.push('VITE_SUPABASE_URL contains placeholder or invalid protocol.');
  }

  if (!keyPresent) {
    issues.push('Neither VITE_SUPABASE_ANON_KEY nor VITE_SUPABASE_PUBLISHABLE_KEY was found.');
  } else if (!keyValid) {
    issues.push('Supabase key format appears incomplete or contains placeholder text.');
  }

  return {
    isConfigured: urlValid && keyValid,
    lookedUp,
    activeKeySource,
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
