/**
 * Client-side Brute-Force Rate Limiter
 * Enforces temporary lockout after repeated failed sign-in attempts.
 * Complements server-side Supabase rate limiting.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const STORAGE_KEY_PREFIX = 'chw_auth_attempts_';

function getStorage() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

// In-memory fallback for environments without sessionStorage (e.g. Node tests)
const memoryAttempts = new Map();

export function getLockoutStatus(email) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return { isLocked: false, remainingSeconds: 0, attempts: 0 };

  let record = null;
  const storage = getStorage();

  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY_PREFIX + key);
      if (raw) record = JSON.parse(raw);
    } catch {
      record = null;
    }
  } else {
    record = memoryAttempts.get(key) || null;
  }

  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      attempts: record.attempts || MAX_FAILED_ATTEMPTS
    };
  }

  // If lockout has expired, reset counter
  if (record.lockedUntil && record.lockedUntil <= now) {
    resetFailedAttempts(key);
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    attempts: record.attempts || 0
  };
}

export function recordFailedAttempt(email) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return { isLocked: false, remainingSeconds: 0, attempts: 0 };

  const current = getLockoutStatus(key);
  const now = Date.now();
  const nextAttempts = current.attempts + 1;

  let lockedUntil = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_MS;
    isLocked = true;
    remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
  }

  const newRecord = {
    attempts: nextAttempts,
    lockedUntil,
    lastAttemptAt: now
  };

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(newRecord));
    } catch (e) {
      console.warn('Failed to persist auth attempts:', e);
    }
  } else {
    memoryAttempts.set(key, newRecord);
  }

  return {
    isLocked,
    remainingSeconds,
    attempts: nextAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - nextAttempts)
  };
}

export function resetFailedAttempts(email) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return;

  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch (e) {
      console.warn('Failed to clear auth attempts:', e);
    }
  } else {
    memoryAttempts.delete(key);
  }
}
