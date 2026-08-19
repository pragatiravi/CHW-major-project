import { supabase } from './supabase';

const DATABASE_ROLE_BY_UI_ROLE = {
  patient: 'patient',
  chw: 'chw',
  supervisor: 'supervisor',
  doctor: 'medical_officer',
  admin: 'admin',
};

const UI_ROLE_BY_DATABASE_ROLE = {
  patient: 'patient',
  chw: 'chw',
  supervisor: 'supervisor',
  medical_officer: 'doctor',
  admin: 'admin',
};

function toAppUser(user, profile) {
  return {
    id: user.id,
    name: profile.full_name,
    email: user.email,
    role: UI_ROLE_BY_DATABASE_ROLE[profile.role] || 'patient',
    databaseRole: profile.role,
    facilityId: profile.facility_id,
    source: 'supabase',
  };
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, facility_id, role, full_name, is_active')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Unable to load your authorized profile: ' + error.message);
  }

  if (!data.is_active) {
    throw new Error('This account has been disabled. Contact an administrator.');
  }

  return data;
}

export async function signInWithRole({ email, password, role }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  try {
    const profile = await getProfile(data.user.id);
    const expectedRole = DATABASE_ROLE_BY_UI_ROLE[role];

    if (!expectedRole || profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error('This account is not authorized for the selected workspace.');
    }

    return toAppUser(data.user, profile);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
}

export async function restoreAuthenticatedUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const profile = await getProfile(data.user.id);
  return toAppUser(data.user, profile);
}

export async function signOutAuthenticatedUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email) {
  const redirectTo = new URL('/', window.location.origin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) throw new Error(error.message);
}
