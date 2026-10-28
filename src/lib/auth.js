import { supabase, isSupabaseConfigured } from './supabaseClient';
import { fetchUserProfile } from './db/profiles';

/**
 * Seeded Demo Account Registry (Requires exact passwords even in local mode)
 */
export const DEMO_CREDENTIALS = {
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
};

/**
 * Authenticate with email & password via Supabase Auth or verified local credentials
 */
export async function signInWithCredentials({ email, password }) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  // 1. Authenticate with Supabase Auth if online / configured
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });

    if (error) {
      // Return generic authentication failure to prevent user enumeration
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (!data?.user) {
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
      throw new Error('This account is inactive. Please contact your subcenter supervisor.');
    }

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

    return authenticatedUser;
  }

  // 2. Local Fallback Verification (Requires exact matching password)
  const matchedDemo = Object.values(DEMO_CREDENTIALS).find(
    acc => acc.email.toLowerCase() === normalizedEmail
  );

  if (!matchedDemo || matchedDemo.password !== password) {
    throw new Error('Invalid email or password. Please check your credentials.');
  }

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

  return authenticatedUser;
}

/**
 * Register a new staff account (Creates user in auth.users; status defaults to pending)
 */
export async function signUpWithCredentials({ email, password, fullName, languagePref = 'en' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
          language_pref: languagePref
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: data.user,
      status: 'pending',
      message: 'Account created! Your registration is pending supervisor approval.'
    };
  }

  // Local fallback simulation
  return {
    status: 'pending',
    message: 'Registration submitted with pending status. An administrator must approve your account.'
  };
}

/**
 * Restore active session on page reload
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
            name: profile.full_name,
            role: profile.role,
            status: profile.status,
            source: 'supabase'
          };
        }
      }
    } catch {
      // Fall through to sessionStorage
    }
  }

  try {
    const saved = sessionStorage.getItem('chw_auth_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Sign out and clear active session
 */
export async function signOutAuthenticatedUser() {
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
 * Request password reset
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

  return true;
}

/**
 * Backwards-compatible alias for existing imports
 */
export const signInWithRole = signInWithCredentials;
