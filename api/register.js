/* global process */
/**
 * Vercel Serverless Function: POST /api/register
 * CHW Healthcare Toolkit — Server-Side User Registration & Auto-Confirmation
 *
 * Provides safe, immediate registration for frontline healthcare workers and patients:
 * - Uses Supabase service role key to auto-confirm email (preventing email rate-limit lockouts).
 * - Hashes password securely via Supabase Auth GoTrue.
 * - Automatically provisions approved profile with correct role.
 * - Enforces allowed roles (CHW, Doctor, Supervisor, Patient). Never allows self-signup as Admin.
 */

import { createClient } from '@supabase/supabase-js';

function sanitize(v) {
  return (v || '').trim().replace(/^["']|["']$/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.', code: 'method_not_allowed' });
  }

  const {
    email,
    password,
    fullName,
    role = 'chw',
    phone = '',
    village = '',
    languagePref = 'en'
  } = req.body || {};

  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedPassword = (password || '').trim();
  const trimmedFullName = (fullName || '').trim() || normalizedEmail.split('@')[0];

  // 1. Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      error: 'Please enter a valid email address.',
      code: 'invalid_email'
    });
  }

  if (!trimmedPassword || trimmedPassword.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long.',
      code: 'weak_password'
    });
  }

  // 2. Role Sanitization (Strictly prevent admin self-registration)
  const allowedRoles = ['chw', 'doctor', 'supervisor', 'patient'];
  const assignedRole = allowedRoles.includes(role.toLowerCase()) && role.toLowerCase() !== 'admin'
    ? role.toLowerCase()
    : 'chw';

  // 3. Supabase Credentials
  const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceKey = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = sanitize(
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  );

  if (!supabaseUrl || (!serviceKey && !anonKey)) {
    return res.status(500).json({
      error: 'Database connection is unconfigured on the server.',
      code: 'server_unconfigured'
    });
  }

  // 4. Use Service Role Admin Client if Available (Recommended: Auto-confirms email)
  if (serviceKey && serviceKey.length > 20) {
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    try {
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: trimmedPassword,
        email_confirm: true, // Auto-confirm email so user can sign in immediately
        user_metadata: {
          full_name: trimmedFullName,
          role: assignedRole,
          phone: phone.trim(),
          village: village.trim(),
          language_pref: languagePref
        }
      });

      if (createErr) {
        const msg = createErr.message || '';
        if (msg.includes('already registered') || msg.includes('already exists') || createErr.status === 422) {
          return res.status(409).json({
            error: 'An account with this email address already exists. Please sign in or use password recovery.',
            code: 'user_already_exists'
          });
        }
        return res.status(400).json({
          error: createErr.message || 'Failed to create user account.',
          code: 'create_user_error'
        });
      }

      const userId = created?.user?.id;
      if (userId) {
        // Upsert approved profile
        const { error: profErr } = await adminClient.from('profiles').upsert({
          id: userId,
          full_name: trimmedFullName,
          role: assignedRole,
          status: 'approved',
          language_pref: languagePref,
          phone: phone.trim() || null,
          subcenter: village.trim() || 'Primary Health Subcenter',
          updated_at: new Date().toISOString()
        });

        if (profErr) {
          console.warn('[api/register] profile upsert warning:', profErr);
        }
      }

      return res.status(200).json({
        success: true,
        user: {
          id: userId,
          email: normalizedEmail,
          role: assignedRole,
          status: 'approved'
        },
        message: 'Account created successfully! You can now sign in with your credentials.'
      });
    } catch (err) {
      console.error('[api/register] Admin user creation exception:', err);
      return res.status(500).json({
        error: 'An internal error occurred during user registration.',
        code: 'internal_error'
      });
    }
  }

  // 5. Fallback via Anon Key if Service Role Key is not configured
  const anonClient = createClient(supabaseUrl, anonKey);
  try {
    const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
      email: normalizedEmail,
      password: trimmedPassword,
      options: {
        data: {
          full_name: trimmedFullName,
          role: assignedRole,
          language_pref: languagePref,
          phone: phone.trim(),
          village: village.trim()
        }
      }
    });

    if (signUpErr) {
      const msg = signUpErr.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return res.status(409).json({
          error: 'An account with this email address already exists. Please sign in or use password recovery.',
          code: 'user_already_exists'
        });
      }
      return res.status(400).json({
        error: signUpErr.message,
        code: 'signup_failed'
      });
    }

    return res.status(200).json({
      success: true,
      user: signUpData?.user,
      message: 'Registration recorded. You can now sign in.'
    });
  } catch (err) {
    console.error('[api/register] Anon signup exception:', err);
    return res.status(500).json({
      error: err.message || 'Failed to complete registration.',
      code: 'internal_error'
    });
  }
}
