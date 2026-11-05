import { describe, expect, it } from 'vitest';
import { mapSupabaseAuthError } from './supabaseErrorMapper';

describe('Supabase authentication error mapping', () => {
  it.each([
    [{ code: 'invalid_credentials', message: 'Invalid login credentials' }, /email|password/i],
    [{ code: 'email_not_confirmed', message: 'Email not confirmed' }, /email|confirmed|verification/i],
    [{ code: 'user_not_found', message: 'User not found' }, /account|found/i],
    [{ code: 'over_email_send_rate_limit', message: 'rate limit' }, /many|wait|attempt/i],
    [{ code: 'account_pending', message: 'pending' }, /pending|approval/i],
    [{ code: 'account_rejected', message: 'rejected' }, /declined|rejected/i],
    [{ code: 'account_suspended', message: 'suspended' }, /suspended/i],
    [{ code: 'profile_missing', message: 'missing profile' }, /profile|supervisor/i],
    [{ code: 'profile_read_failed', message: 'profile read failed' }, /profile|supervisor/i],
    [{ code: 'network_error', message: 'Failed to fetch' }, /network|offline/i]
  ])('maps %s to a specific English message', (error, expected) => {
    expect(mapSupabaseAuthError(error, 'en')).toMatch(expected);
  });

  it.each(['en', 'hi', 'kn', 'mr'])('returns a non-empty localized message for every mapped status in %s', (language) => {
    for (const code of ['invalid_credentials', 'email_not_confirmed', 'user_not_found', 'account_pending', 'account_rejected', 'account_suspended', 'profile_missing', 'profile_read_failed']) {
      expect(mapSupabaseAuthError({ code, message: code }, language)).toBeTruthy();
    }
  });
});
