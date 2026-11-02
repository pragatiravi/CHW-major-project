import { describe, it, expect, beforeEach } from 'vitest';

// Node.js environment storage polyfill for Vitest
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

if (!globalThis.localStorage) {
  globalThis.localStorage = new MemoryStorage();
}
if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = new MemoryStorage();
}

import { 
  signInWithCredentials, 
  signUpWithCredentials, 
  signOutAuthenticatedUser,
  restoreAuthenticatedUser,
  verifyRoleAccess,
  setDemoModeOverride,
  getAvailableDemoCredentials,
  DEMO_CREDENTIALS 
} from './auth';
import { 
  recordFailedAttempt, 
  resetFailedAttempts, 
  getLockoutStatus 
} from './authRateLimiter';
import { fetchPatients, savePatient } from './db/patients';

describe('Authentication & Role Guards', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setDemoModeOverride(true);
    resetFailedAttempts(DEMO_CREDENTIALS.chw.email);
  });

  it('rejects authentication with empty or missing credentials', async () => {
    await expect(signInWithCredentials({ email: '', password: '' }))
      .rejects.toThrow('Please enter both your email address and password.');

    await expect(signInWithCredentials({ email: 'test@example.com', password: '' }))
      .rejects.toThrow('Please enter both your email address and password.');
  });

  it('rejects authentication with invalid password for a known account', async () => {
    await expect(signInWithCredentials({ 
      email: DEMO_CREDENTIALS.chw.email, 
      password: 'WrongPassword123!' 
    })).rejects.toThrow('Invalid email or password');
  });

  it('authenticates CHW demo account with exact password and assigns chw role', async () => {
    const user = await signInWithCredentials({
      email: DEMO_CREDENTIALS.chw.email,
      password: DEMO_CREDENTIALS.chw.password
    });

    expect(user).toBeDefined();
    expect(user.role).toBe('chw');
    expect(user.status).toBe('approved');
    expect(user.email).toBe(DEMO_CREDENTIALS.chw.email);
    expect(sessionStorage.getItem('chw_auth_session')).toContain('chw');
  });

  it('authenticates Doctor demo account with doctor role and approved status', async () => {
    const doctor = await signInWithCredentials({
      email: DEMO_CREDENTIALS.doctor.email,
      password: DEMO_CREDENTIALS.doctor.password
    });

    expect(doctor.role).toBe('doctor');
    expect(doctor.status).toBe('approved');
  });

  it('authenticates Admin demo account with admin role', async () => {
    const admin = await signInWithCredentials({
      email: DEMO_CREDENTIALS.admin.email,
      password: DEMO_CREDENTIALS.admin.password
    });

    expect(admin.role).toBe('admin');
    expect(admin.status).toBe('approved');
  });

  it('authenticates Supervisor demo account with supervisor role', async () => {
    const supervisor = await signInWithCredentials({
      email: DEMO_CREDENTIALS.supervisor.email,
      password: DEMO_CREDENTIALS.supervisor.password
    });

    expect(supervisor.role).toBe('supervisor');
    expect(supervisor.status).toBe('approved');
  });

  it('enforces minimum 8-character password length on new user signup', async () => {
    await expect(signUpWithCredentials({
      email: 'newuser@communityhealth.org',
      password: '123',
      fullName: 'New CHW'
    })).rejects.toThrow('Password must be at least 8 characters long.');
  });

  it('marks newly registered user status as pending approval', async () => {
    const result = await signUpWithCredentials({
      email: 'newchw@communityhealth.org',
      password: 'SecurePassword123!',
      fullName: 'Pooja Naik'
    });

    expect(result.status).toBe('pending');
    expect(result.message).toContain('pending');
  });

  it('restores authenticated user from active session and clears on logout', async () => {
    await signInWithCredentials({
      email: DEMO_CREDENTIALS.chw.email,
      password: DEMO_CREDENTIALS.chw.password
    });

    const restored = await restoreAuthenticatedUser();
    expect(restored).not.toBeNull();
    expect(restored.role).toBe('chw');

    await signOutAuthenticatedUser();
    const afterLogout = await restoreAuthenticatedUser();
    expect(afterLogout).toBeNull();
  });
});

describe('Phase 1 Security: Demo Mode Gating', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    resetFailedAttempts(DEMO_CREDENTIALS.chw.email);
  });

  it('blocks hardcoded demo authentication when demo mode is disabled', async () => {
    setDemoModeOverride(false);

    await expect(signInWithCredentials({
      email: DEMO_CREDENTIALS.chw.email,
      password: DEMO_CREDENTIALS.chw.password
    })).rejects.toThrow(/Demo mode is disabled in production/i);

    expect(getAvailableDemoCredentials()).toEqual({});
  });

  it('allows demo authentication when demo mode is explicitly enabled', async () => {
    setDemoModeOverride(true);

    const user = await signInWithCredentials({
      email: DEMO_CREDENTIALS.chw.email,
      password: DEMO_CREDENTIALS.chw.password
    });

    expect(user.role).toBe('chw');
    expect(user.status).toBe('approved');
  });
});

describe('Phase 1 Security: Role Guards & Tamper Prevention', () => {
  it('allows approved user with matching role to pass role guard', () => {
    const user = { role: 'chw', status: 'approved' };
    expect(verifyRoleAccess(user, 'chw')).toBe(true);
  });

  it('rejects user attempting to access a different role portal (role spoofing)', () => {
    const chwUser = { role: 'chw', status: 'approved' };
    expect(verifyRoleAccess(chwUser, 'admin')).toBe(false);
    expect(verifyRoleAccess(chwUser, 'doctor')).toBe(false);
    expect(verifyRoleAccess(chwUser, 'supervisor')).toBe(false);
  });

  it('rejects access for users with pending approval status', () => {
    const pendingStaff = { role: 'chw', status: 'pending' };
    expect(verifyRoleAccess(pendingStaff, 'chw')).toBe(false);
  });

  it('rejects access for suspended or rejected accounts', () => {
    const suspendedDoctor = { role: 'doctor', status: 'suspended' };
    const rejectedAdmin = { role: 'admin', status: 'rejected' };

    expect(verifyRoleAccess(suspendedDoctor, 'doctor')).toBe(false);
    expect(verifyRoleAccess(rejectedAdmin, 'admin')).toBe(false);
  });
});

describe('Phase 1 Security: Brute-Force Rate Limiting', () => {
  const testEmail = 'bruteforce.test@communityhealth.org';

  beforeEach(() => {
    resetFailedAttempts(testEmail);
  });

  it('tracks failed attempts and enforces lockout after 5 consecutive failures', () => {
    expect(getLockoutStatus(testEmail).isLocked).toBe(false);

    // Fail 4 times
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedAttempt(testEmail);
      expect(res.isLocked).toBe(false);
      expect(res.attempts).toBe(i);
    }

    // 5th failure triggers lockout
    const fifthRes = recordFailedAttempt(testEmail);
    expect(fifthRes.isLocked).toBe(true);
    expect(fifthRes.remainingSeconds).toBeGreaterThan(0);

    const status = getLockoutStatus(testEmail);
    expect(status.isLocked).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThan(50);
  });

  it('rejects sign in immediately when user account is in locked state', async () => {
    setDemoModeOverride(true);

    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(testEmail);
    }

    await expect(signInWithCredentials({
      email: testEmail,
      password: 'AnyPassword123!'
    })).rejects.toThrow(/Too many failed sign-in attempts/i);
  });
});

describe('Phase 1: Patient Self-Registration Flow', () => {
  it('automatically sets patient self-registration status to approved', async () => {
    setDemoModeOverride(true);

    const result = await signUpWithCredentials({
      email: 'newpatient@ruralcare.in',
      password: 'PatientPass123!',
      fullName: 'Sunita Bai',
      role: 'patient',
      phone: '+91 9876500000',
      village: 'Vimanapura'
    });

    expect(result.status).toBe('approved');
    expect(result.message).toContain('Patient account');
  });

  it('requires supervisor approval for staff role signups', async () => {
    setDemoModeOverride(true);

    const result = await signUpWithCredentials({
      email: 'newdoctor@districtmed.org',
      password: 'DoctorPass123!',
      fullName: 'Dr. Ramesh Joshi',
      role: 'doctor'
    });

    expect(result.status).toBe('pending');
    expect(result.message).toContain('pending');
  });
});

describe('User-Scoped Patient Cache Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('scopes local patient cache per user id and does not leak data between different users', async () => {
    const userA = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'CHW Asha',
      role: 'chw'
    };

    const userB = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'CHW Bharati',
      role: 'chw'
    };

    // User A starts with empty patients
    const patientsAInitial = await fetchPatients(userA);
    expect(patientsAInitial).toEqual([]);

    // User A saves a new patient record
    const patientA1 = {
      id: 'P9001',
      name: 'Ravi Kumar',
      age: 50,
      gender: 'male',
      systolic: 140,
      diastolic: 90,
      glucose: 130
    };
    await savePatient(patientA1, userA);

    // Verify User A now has their patient saved in their scoped cache
    const patientsAAfter = await fetchPatients(userA);
    expect(patientsAAfter.length).toBe(1);
    expect(patientsAAfter[0].name).toBe('Ravi Kumar');
    expect(localStorage.getItem(`chw_patients_${userA.id}`)).not.toBeNull();

    // Verify User B logs in and CANNOT see User A's cached patient
    const patientsB = await fetchPatients(userB);
    expect(patientsB).toEqual([]);
    expect(patientsB.find(p => p.name === 'Ravi Kumar')).toBeUndefined();
  });
});
