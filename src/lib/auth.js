const DEMO_ACCOUNTS = {
  chw: { name: 'Sunita Patil', email: 'sunita.patil@communityhealth.org', role: 'chw' },
  doctor: { name: 'Dr. Ananya Roy (M.D.)', email: 'ananya.roy@districtmed.org', role: 'doctor' },
  patient: { name: 'Priya Sharma', email: 'priya.sharma@patienthealth.net', role: 'patient' },
  supervisor: { name: 'Vikram Singh', email: 'vikram.singh@subdistrictops.org', role: 'supervisor' },
  admin: { name: 'Admin Operations', email: 'admin.lead@healthsystem.gov', role: 'admin' },
};

export async function signInWithRole({ email, password, role }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const matched = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.chw;

  const user = {
    id: 'usr_' + Date.now(),
    name: matched.name,
    email: normalizedEmail || matched.email,
    role: role || matched.role,
    source: 'local',
  };

  try {
    sessionStorage.setItem('chw_auth_session', JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save session:', e);
  }

  return user;
}

export async function restoreAuthenticatedUser() {
  try {
    const saved = sessionStorage.getItem('chw_auth_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export async function signOutAuthenticatedUser() {
  try {
    sessionStorage.removeItem('chw_auth_session');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

export async function requestPasswordReset(email) {
  return true;
}
