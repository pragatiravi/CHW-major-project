#!/usr/bin/env node
/**
 * scripts/check-env.mjs
 * Pre-build environment variable checker for the CHW Healthcare Toolkit.
 *
 * Prints which VITE_ variable NAMES are present (never values).
 * Exits with code 1 (failing the build) if the Supabase URL or key is absent.
 * Values are NEVER printed — only presence/absence.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');

// ---------------------------------------------------------------------------
// 1. Load .env into a local map (Vite hasn't run yet, so we do it ourselves)
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const map = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    map[key] = val;
  }
  return map;
}

const dotEnv = loadDotEnv();

// Priority: process.env (Vercel injects these) > .env file
function get(name) {
  return (process.env[name] || dotEnv[name] || '').trim().replace(/^["']|["']$/g, '');
}

function present(name) {
  const v = get(name);
  return v.length > 0;
}

// ---------------------------------------------------------------------------
// 2. Collect all VITE_ variables from both sources
// ---------------------------------------------------------------------------
const allViteNames = new Set([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_DEMO_MODE',
  'VITE_ENABLE_DEMO_ACCESS',
]);

// Also pick up any VITE_ vars in process.env (injected by Vercel)
for (const k of Object.keys(process.env)) {
  if (k.startsWith('VITE_')) allViteNames.add(k);
}
for (const k of Object.keys(dotEnv)) {
  if (k.startsWith('VITE_')) allViteNames.add(k);
}

// ---------------------------------------------------------------------------
// 3. Print presence table (NAMES ONLY — no values)
// ---------------------------------------------------------------------------
console.log('\n===[ CHW Toolkit — Pre-build Environment Check ]===');
console.log('');

const rows = [];
for (const name of [...allViteNames].sort()) {
  const found = present(name);
  rows.push({ name, found });
  const icon = found ? '✅' : '⚠️ ';
  console.log(`  ${icon} ${name}: ${found ? 'PRESENT' : 'MISSING'}`);
}

// Server-side (non-VITE) vars — just check presence, never log values
const serverVars = ['GEMINI_API_KEY', 'AI_API_KEY', 'GEMINI_MODEL', 'ALLOW_DEMO_CHAT'];
console.log('');
console.log('  Server-side vars (not inlined into client bundle):');
for (const name of serverVars) {
  const found = present(name);
  const icon = found ? '✅' : '  ';
  console.log(`  ${icon} ${name}: ${found ? 'PRESENT' : 'not set (optional in some configs)'}`);
}

// ---------------------------------------------------------------------------
// 4. Validate required vars — exit 1 if critical ones are missing
// ---------------------------------------------------------------------------
console.log('');

const urlOk = (() => {
  const v = get('VITE_SUPABASE_URL');
  if (!v) return false;
  if (v.includes('your-project-ref') || v.includes('placeholder') || v.includes('example.com')) return false;
  try { new URL(v); return true; } catch { return false; }
})();

const keyOk = (() => {
  const anon = get('VITE_SUPABASE_ANON_KEY');
  const pub  = get('VITE_SUPABASE_PUBLISHABLE_KEY');
  const key  = anon || pub;
  if (!key) return false;
  if (key.includes('your-anon-key') || key.includes('your-publishable-key') || key.includes('placeholder')) return false;
  if (key.startsWith('eyJ') && key.split('.').length === 3) return true;
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) return true;
  return key.length >= 30;
})();

let failed = false;

if (!urlOk) {
  console.error('❌ FATAL: VITE_SUPABASE_URL is missing or contains a placeholder.');
  console.error('   Set it in your .env or in Vercel Project Settings > Environment Variables.');
  console.error('   Looked for: VITE_SUPABASE_URL');
  failed = true;
}

if (!keyOk) {
  console.error('❌ FATAL: Neither VITE_SUPABASE_ANON_KEY nor VITE_SUPABASE_PUBLISHABLE_KEY is valid.');
  console.error('   Set at least one in .env or Vercel Project Settings > Environment Variables.');
  console.error('   Looked for: VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY');
  failed = true;
}

if (!failed) {
  console.log('✅ Supabase URL and key are present and appear valid (names only checked — values never logged).');
}

console.log('===================================================\n');

if (failed) {
  if (process.env.CI && !process.env.VERCEL) {
    console.warn('⚠️ Running in CI without production credentials: build will continue, but app will require configured env at runtime.');
  } else {
    process.exit(1);
  }
}

