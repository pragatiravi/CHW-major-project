import { supabase, isSupabaseConfigured } from '../supabaseClient';

const LOCAL_PROFILES_KEY = 'chw_profiles';

const DEFAULT_PROFILES = [
  { id: '00000000-0000-0000-0000-000000000001', full_name: 'Admin Operations', email: 'admin.lead@healthsystem.gov', role: 'admin', status: 'approved', subcenter: 'District Health Office' },
  { id: '00000000-0000-0000-0000-000000000002', full_name: 'Vikram Singh', email: 'vikram.singh@subdistrictops.org', role: 'supervisor', status: 'approved', subcenter: 'Belagavi Sub-District PHC' },
  { id: '00000000-0000-0000-0000-000000000003', full_name: 'Sunita Patil', email: 'sunita.patil@communityhealth.org', role: 'chw', status: 'approved', subcenter: 'Vimanapura Subcenter' },
  { id: '00000000-0000-0000-0000-000000000004', full_name: 'Ramesh Kumar', email: 'ramesh.kumar@communityhealth.org', role: 'chw', status: 'approved', subcenter: 'Kittur Rural Subcenter' },
  { id: '00000000-0000-0000-0000-000000000005', full_name: 'Dr. Ananya Roy (M.D.)', email: 'ananya.roy@districtmed.org', role: 'doctor', status: 'approved', subcenter: 'District Civil Hospital' }
];

function getLocalProfiles() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

function saveLocalProfiles(profiles) {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save local profiles:', e);
  }
}

/**
 * Fetch verified server-side profile for an authenticated user
 */
export async function fetchUserProfile(userId) {
  if (!userId) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchUserProfile error:', err);
    }
  }

  const profiles = getLocalProfiles();
  return profiles.find(p => p.id === userId) || null;
}

/**
 * Fetch all profiles (Admin only)
 */
export async function fetchAllProfiles() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('Supabase fetchAllProfiles error:', err);
    }
  }

  return getLocalProfiles();
}

/**
 * Admin approval: update staff status and assign role or supervisor
 */
export async function updateProfileRoleAndStatus(profileId, newRole, newStatus, supervisorId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload = {
        role: newRole,
        status: newStatus,
        supervisor_id: supervisorId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profileId)
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase updateProfileRoleAndStatus error:', err);
    }
  }

  const profiles = getLocalProfiles();
  const updated = profiles.map(p => {
    if (p.id === profileId) {
      return { ...p, role: newRole, status: newStatus, supervisor_id: supervisorId };
    }
    return p;
  });
  saveLocalProfiles(updated);
  return updated.find(p => p.id === profileId);
}
