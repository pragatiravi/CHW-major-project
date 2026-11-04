/* global process */
import { supabase, isSupabaseConfigured, getSupabaseDiagnostics } from './supabaseClient';
import { fetchUserProfile } from './db/profiles';
import {
  getLockoutStatus,
  recordFailedAttempt,
  resetFailedAttempts
} from './authRateLimiter';
import {
  setUserEncryptionContext,
  clearUserEncryptionContext
} from './crypto/encryption';

/**
 * Demo Mode Flag:
 * In production builds, demo mode must be explicitly enabled via VITE_DEMO_MODE=true.
 * When false, hardcoded demo accounts cannot be used to authenticate.
 */
let demoModeOverride = null;

export function setDemoModeOverride(value) {
  demoModeOverride = value;
}

export function parseBooleanEnv(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0') return false;
  return null;
}

export function isDemoModeActive() {
  if (demoModeOverride !== null) return demoModeOverride;

  // Static references so Vite statically inlines them at build time
  const vDemo = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_DEMO_MODE : undefined;
  const vAccess = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_ENABLE_DEMO_ACCESS : undefined;

  const parsedVDemo = parseBooleanEnv(vDemo);
  const parsedVAccess = parseBooleanEnv(vAccess);

  // Return true if either is explicitly enabled ("true" or "1")
  if (parsedVDemo === true || parsedVAccess === true) return true;
  if (parsedVDemo === false && parsedVAccess === false) return false;

  // Fallback for Node / Vitest
  if (typeof process !== 'undefined' && process.env) {
    const pDemo = parseBooleanEnv(process.env.VITE_DEMO_MODE);
    const pAccess = parseBooleanEnv(process.env.VITE_ENABLE_DEMO_ACCESS);
    if (pDemo === true || pAccess === true) return true;
    if (pDemo === false && pAccess === false) return false;
  }

  // In production builds without explicit flag, demo mode is strictly disabled
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return false;
  }

  // In local development or dev server without .env, allow demo mode
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true;
  }

  return false;
}

/**
 * Statically evaluable demo flag for build-time tree-shaking (Rollup dead-code elimination)
 */
const IS_DEMO_BUILD = (
  import.meta.env?.VITE_DEMO_MODE === 'true' ||
  import.meta.env?.VITE_DEMO_MODE === '1' ||
  import.meta.env?.VITE_ENABLE_DEMO_ACCESS === 'true' ||
  import.meta.env?.VITE_ENABLE_DEMO_ACCESS === '1' ||
  Boolean(import.meta.env?.DEV)
);

/**
 * Seeded Demo Account Registry
 * Tree-shaken out of production bundle when VITE_DEMO_MODE=false.
 */
export const RAW_DEMO_CREDENTIALS = IS_DEMO_BUILD ? {
  chw: {
    email: 'sunita.patil@communityhealth.org',
    password: 'DemoCHW@123!',
    name: 'Sunita Patil',
    role: 'chw',
    status: 'approved',
    id: '00000000-0000-0000-0000-000000000003'
  },
  doctor: {
    email: 'ananya.roy@districtmed.org',
    password: 'DemoDoctor@123!',
    name: 'Dr. Ananya Roy (M.D.)',
    role: 'doctor',
    status: 'approved',
    id: '00000000-0000-0000-0000-000000000005'
  },
  supervisor: {
    email: 'vikram.singh@subdistrictops.org',
    password: 'DemoSupervisor@123!',
    name: 'Vikram Singh',
    role: 'supervisor',
    status: 'approved',
    id: '00000000-0000-0000-0000-000000000002'
  },
  admin: {
    email: 'admin.lead@healthsystem.gov',
    password: 'DemoAdmin@123!',
    name: 'Admin Operations',
    role: 'admin',
    status: 'approved',
    id: '00000000-0000-0000-0000-000000000001'
  },
  patient: {
    email: 'priya.sharma@patienthealth.net',
    password: 'DemoPatient@123!',
    name: 'Priya Sharma',
    role: 'patient',
    status: 'approved',
    id: '11111111-1111-1111-1111-111111111111'
  }
} : {};

export const DEMO_CREDENTIALS = RAW_DEMO_CREDENTIALS;

export function getAvailableDemoCredentials() {
  if (!isDemoModeActive()) return {};
  return DEMO_CREDENTIALS;
}

/**
 * Authenticate with email & password via Supabase Auth or verified local credentials
 */
export async function signInWithCredentials({ email, password }) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  // 0. Brute-force protection: check temporary client-side lockout
  const lockout = getLockoutStatus(normalizedEmail);
  if (lockout.isLocked) {
    throw new Error(`Too many failed sign-in attempts. Please wait ${lockout.remainingSeconds} seconds before trying again.`);
  }

  // 1. Check if email belongs to predefined demo personas
  const matchedDemo = Object.values(DEMO_CREDENTIALS).find(
    acc => acc.email.toLowerCase() === normalizedEmail
  );

  if (matchedDemo) {
    if (!isDemoModeActive()) {
      throw new Error('Demo mode is disabled in production. An active Supabase connection is required.');
    }

    if (matchedDemo.password !== password) {
      recordFailedAttempt(normalizedEmail);
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    resetFailedAttempts(normalizedEmail);

    const authenticatedUser = {
      id: matchedDemo.id,
      name: matchedDemo.name,
      email: matchedDemo.email,
      role: matchedDemo.role,
      status: matchedDemo.status,
      source: 'local_demo'
    };

    try {
      sessionStorage.setItem('chw_auth_session', JSON.stringify(authenticatedUser));
    } catch (e) {
      console.error('Session persistence error:', e);
    }

    setUserEncryptionContext(authenticatedUser.id);
    return authenticatedUser;
  }

  // 2. Authenticate real accounts with Supabase Auth
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (error) {
      recordFailedAttempt(normalizedEmail);
      // Return generic authentication failure to prevent user enumeration
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (!data?.user) {
      recordFailedAttempt(normalizedEmail);
      throw new Error('Authentication session could not be established.');
    }

    // Role and status are strictly verified from the server-side profiles table
    const profile = await fetchUserProfile(data.user.id);

    if (profile?.status === 'pending') {
      await supabase.auth.signOut();
      throw new Error('Your registration has been submitted and is pending supervisor approval. Please contact your PHC administrator.');
    }

    if (profile?.status === 'rejected' || profile?.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('This account has been suspended or is inactive. Please contact your subcenter supervisor.');
    }

    resetFailedAttempts(normalizedEmail);

    const authenticatedUser = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.full_name || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
      role: profile?.role || 'chw',
      status: profile?.status || 'approved',
      subcenter: profile?.subcenter || 'Primary Health Subcenter',
      source: 'supabase'
    };

    try {
      sessionStorage.setItem('chw_auth_session', JSON.stringify(authenticatedUser));
    } catch (e) {
      console.error('Session persistence error:', e);
    }

    resetFailedAttempts(normalizedEmail);
    setUserEncryptionContext(authenticatedUser.id);
    return authenticatedUser;
  }

  // 3. Fallback when Supabase is not configured and email is unknown
  if (!isDemoModeActive()) {
    throw new Error('Demo mode is disabled in production. An active Supabase connection is required.');
  }

  recordFailedAttempt(normalizedEmail);
  throw new Error('Invalid email or password. Please verify your credentials.');
}

/**
 * Register a new user account:
 * - Staff (CHW, Doctor, Supervisor, Admin): status is strictly 'pending' and requires approval.
 * - Patient: self-registration with status 'approved'.
 */
export async function signUpWithCredentials({
  email,
  password,
  fullName,
  role = 'chw',
  languagePref = 'en',
  phone = '',
  village = ''
}) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const assignedRole = role === 'patient' ? 'patient' : role;
  const initialStatus = assignedRole === 'patient' ? 'approved' : 'pending';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: assignedRole,
          language_pref: languagePref,
          phone,
          village
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.user?.id) {
      // Ensure profile row exists with strict server status
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          role: assignedRole,
          status: initialStatus,
          language_pref: languagePref,
          phone,
          village,
          updated_at: new Date().toISOString()
        });
      } catch (profileErr) {
        console.warn('Could not insert profile on signup:', profileErr);
      }
    }

    return {
      user: data.user,
      status: initialStatus,
      message: initialStatus === 'pending'
        ? 'Account created! Your registration is pending supervisor approval.'
        : 'Patient account created successfully! You can now sign in.'
    };
  }

  // Local fallback simulation (only when demo mode is active)
  if (isDemoModeActive()) {
    return {
      status: initialStatus,
      message: initialStatus === 'pending'
        ? 'Registration recorded in local evaluator mode. Requires supervisor approval.'
        : 'Patient account registered successfully in evaluator mode.'
    };
  }

  // When in production without active Supabase connection, provide helpful diagnostic context
  const diag = getSupabaseDiagnostics();
  let reasonMsg = 'Cloud database connection is unconfigured.';
  if (!diag.urlPresent) {
    reasonMsg = 'VITE_SUPABASE_URL was not present when the application was built.';
  } else if (!diag.keyPresent) {
    reasonMsg = 'Neither VITE_SUPABASE_ANON_KEY nor VITE_SUPABASE_PUBLISHABLE_KEY was present when the application was built.';
  } else if (!diag.isConfigured) {
    reasonMsg = 'The provided Supabase configuration appears invalid or incomplete.';
  }

  throw new Error(
    `User registration requires an active Supabase cloud connection in production. ${reasonMsg} ` +
    `If environment variables were recently added in Vercel, a fresh redeploy (without build cache) is required.`
  );
}

/**
 * Restore active session on page reload with server-side role & status verification
 */
export async function restoreAuthenticatedUser() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const profile = await fetchUserProfile(data.session.user.id);
        if (profile?.status === 'approved') {
          return {
            id: data.session.user.id,
            email: data.session.user.email,
            name: profile.full_name || data.session.user.user_metadata?.full_name,
            role: profile.role,
            status: profile.status,
            subcenter: profile.subcenter,
            source: 'supabase'
          };
        }
        // Account has been suspended, rejected, or revoked server-side
        await supabase.auth.signOut();
        sessionStorage.removeItem('chw_auth_session');
        return null;
      }
    } catch {
      // Fall through to sessionStorage
    }
  }

  try {
    const saved = sessionStorage.getItem('chw_auth_session');
    if (!saved) return null;
    const user = JSON.parse(saved);

    // If demo mode is disabled in production, don't allow restored local_demo sessions
    if (user.source === 'local_demo' && !isDemoModeActive()) {
      sessionStorage.removeItem('chw_auth_session');
      return null;
    }

    if (user.status !== 'approved') {
      sessionStorage.removeItem('chw_auth_session');
      return null;
    }

    setUserEncryptionContext(user.id);
    return user;
  } catch {
    return null;
  }
}

/**
 * Sign out and clear active session
 */
export async function signOutAuthenticatedUser() {
  clearUserEncryptionContext();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }

  try {
    sessionStorage.removeItem('chw_auth_session');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return false;
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/#reset`
    });
    return !error;
  }

  // Local demo simulation
  return true;
}

/**
 * Reset password via token from email reset link
 */
export async function resetPasswordWithToken(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
    return true;
  }

  return true;
}

/**
 * Change password for authenticated active user
 */
export async function changePassword(newPassword) {
  return resetPasswordWithToken(newPassword);
}

/**
 * Role-Based Access Guard Check
 * Returns true only if the user is authenticated, approved, and has the required role
 */
export function verifyRoleAccess(user, requiredRole) {
  if (!user || user.status !== 'approved') return false;
  if (!requiredRole) return true;
  return user.role === requiredRole;
}

/**
 * Backwards-compatible alias for existing imports
 */
export const signInWithRole = signInWithCredentials;
