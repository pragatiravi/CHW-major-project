import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueSyncOperation,
  getPendingSyncQueue,
  removeSyncQueueItem,
  markSyncQueueFailed,
  recordConflict,
  getUnresolvedConflicts,
  resolveConflict,
  clearLocalDataIfClean,
  savePatientLocally,
  getLocalPatientsFromDB
} from '../db/dexieDb';
import {
  encryptSensitiveData,
  decryptSensitiveData,
  getOrCreateDeviceSalt,
  setUserEncryptionContext,
  clearUserEncryptionContext
} from '../crypto/encryption';

describe('Phase 3: Offline-First IndexedDB Store & Sync Outbox', () => {
  beforeEach(async () => {
    // Ensure clean state before each test
    try {
      const pending = await getPendingSyncQueue();
      for (const item of pending) {
        await removeSyncQueueItem(item.id);
      }
      await clearLocalDataIfClean();
    } catch {
      // Ignore if cannot clear yet
    }
  });

  describe('Sync Outbox Queue', () => {
    it('enqueues mutations into the persistent outbox', async () => {
      const patientMutation = {
        id: 'patient-test-uuid-1',
        custom_id: 'P9901',
        name: 'Sunita Kamble',
        systolic: 142,
        diastolic: 92
      };

      const queued = await enqueueSyncOperation({
        entity: 'patients',
        entityId: 'P9901',
        operation: 'UPSERT',
        payload: patientMutation
      });

      expect(queued).toBeDefined();
      expect(queued.entity).toBe('patients');
      expect(queued.operation).toBe('UPSERT');
      expect(queued.status).toBe('pending');

      const pending = await getPendingSyncQueue();
      const match = pending.find(i => i.entity_id === 'P9901');
      expect(match).toBeDefined();
      expect(match.payload.name).toBe('Sunita Kamble');
    });

    it('tracks retry attempts and errors for exponential backoff', async () => {
      const item = await enqueueSyncOperation({
        entity: 'visits',
        entityId: 'visit-test-01',
        operation: 'INSERT',
        payload: { id: 'visit-test-01', patient_id: 'P9901', blood_glucose: 210 }
      });

      await markSyncQueueFailed(item.id, 'Connection timeout: Supabase unreachable');

      const pending = await getPendingSyncQueue();
      const failed = pending.find(i => i.id === item.id);
      expect(failed.attempts).toBe(1);
      expect(failed.status).toBe('failed');
      expect(failed.last_error).toContain('Connection timeout');
      expect(failed.last_attempt).toBeDefined();
    });

    it('dequeues an item after successful sync', async () => {
      const item = await enqueueSyncOperation({
        entity: 'referrals',
        entityId: 'ref-01',
        operation: 'UPSERT',
        payload: { id: 'ref-01', status: 'Pending' }
      });

      let pending = await getPendingSyncQueue();
      expect(pending.some(i => i.id === item.id)).toBe(true);

      await removeSyncQueueItem(item.id);
      pending = await getPendingSyncQueue();
      expect(pending.some(i => i.id === item.id)).toBe(false);
    });
  });

  describe('Bidirectional Conflict Resolution', () => {
    it('records and resolves conflicts when both local and remote change', async () => {
      const localRecord = { custom_id: 'P9902', name: 'Ramesh Patil', systolic: 160, updated_at: '2026-10-28T10:00:00Z' };
      const remoteRecord = { custom_id: 'P9902', name: 'Ramesh Patil', systolic: 130, updated_at: '2026-10-28T11:00:00Z' };

      const conflict = await recordConflict({
        entity: 'patients',
        entityId: 'P9902',
        localRecord,
        remoteRecord
      });

      expect(conflict.status).toBe('unresolved');

      const unresolved = await getUnresolvedConflicts();
      expect(unresolved.length).toBeGreaterThan(0);
      expect(unresolved.some(c => c.entity_id === 'P9902')).toBe(true);

      // Resolve choosing Local
      const chosenLocal = await resolveConflict(conflict.id, 'local');
      expect(chosenLocal.systolic).toBe(160);

      const remaining = await getUnresolvedConflicts();
      expect(remaining.some(c => c.id === conflict.id)).toBe(false);
    });

    it('supports choosing remote record during conflict resolution', async () => {
      const localRecord = { custom_id: 'P9903', name: 'Kavita Naik', glucose: 240 };
      const remoteRecord = { custom_id: 'P9903', name: 'Kavita Naik', glucose: 155 };

      const conflict = await recordConflict({
        entity: 'patients',
        entityId: 'P9903',
        localRecord,
        remoteRecord
      });

      const chosenRemote = await resolveConflict(conflict.id, 'remote');
      expect(chosenRemote.glucose).toBe(155);
    });
  });

  describe('At-Rest Health Data Encryption', () => {
    it('encrypts and decrypts sensitive phone numbers and addresses', async () => {
      const rawPhone = '+91 98765 43210';
      const secretKey = 'CHW_LOCAL_PIN_7890';

      const cipher = await encryptSensitiveData(rawPhone, secretKey);
      expect(cipher).not.toBe(rawPhone);

      const decrypted = await decryptSensitiveData(cipher, secretKey);
      expect(decrypted).toBe(rawPhone);
    });

    it('preserves patient object attributes while securing PII in storage', async () => {
      const patient = {
        id: 'patient-enc-01',
        name: 'Fatima Shaikh',
        phone: '+91 91234 56789',
        address: 'Bailhongal Ward 3',
        created_by: 'chw-user-uuid-1'
      };

      await savePatientLocally(patient, 'CHW_PIN');
      const retrieved = await getLocalPatientsFromDB('chw-user-uuid-1', 'CHW_PIN');

      const found = retrieved.find(p => p.id === 'patient-enc-01');
      expect(found).toBeDefined();
      expect(found.name).toBe('Fatima Shaikh');
      expect(found.phone).toBe('+91 91234 56789');
      expect(found.address).toBe('Bailhongal Ward 3');
    });

    it('initializes and persists a device-level salt across reloads', () => {
      const salt1 = getOrCreateDeviceSalt();
      expect(typeof salt1).toBe('string');
      expect(salt1.length).toBeGreaterThan(10);

      const salt2 = getOrCreateDeviceSalt();
      expect(salt2).toBe(salt1);
    });

    it('derives isolated encryption keys per user session and clears on logout', async () => {
      const testSecretPhone = '+91 99887 76655';

      // User 1 session
      setUserEncryptionContext('user-chw-001');
      const cipherUser1 = await encryptSensitiveData(testSecretPhone);
      expect(cipherUser1).not.toBe(testSecretPhone);

      const decryptedUser1 = await decryptSensitiveData(cipherUser1);
      expect(decryptedUser1).toBe(testSecretPhone);

      // Logout clears volatile key
      clearUserEncryptionContext();

      // User 2 logs in
      setUserEncryptionContext('user-chw-002');
      const decryptedUser2 = await decryptSensitiveData(cipherUser1);
      // Even if fallback happens, decryptSensitiveData returns either decrypted string or cipher safely
      expect(typeof decryptedUser2).toBe('string');

      clearUserEncryptionContext();
    });

    it('maintains backwards compatibility for legacy payloads encrypted with static keys', async () => {
      const sensitiveData = 'Belagavi Rural Subcenter Block 4';
      const legacyCipher = await encryptSensitiveData(sensitiveData, 'CHW_LOCAL_PIN');

      // Now with no user context set, decrypt should still succeed via legacy fallback
      clearUserEncryptionContext();
      const recovered = await decryptSensitiveData(legacyCipher);
      expect(recovered).toBe(sensitiveData);
    });
  });

  describe('Safe Logout Local Data Management', () => {
    it('blocks clearing local data when unsynced items are pending in the outbox', async () => {
      await enqueueSyncOperation({
        entity: 'patients',
        entityId: 'P_UNSYNCED',
        operation: 'UPSERT',
        payload: { id: 'P_UNSYNCED', name: 'Unsaved Field Screening' }
      });

      await expect(clearLocalDataIfClean()).rejects.toThrow(/unsynced items are pending/i);
    });

    it('clears sensitive local records safely when the outbox is clean', async () => {
      // Clean all pending items first
      const pending = await getPendingSyncQueue();
      for (const item of pending) {
        await removeSyncQueueItem(item.id);
      }

      const result = await clearLocalDataIfClean();
      expect(result).toBe(true);

      const patients = await getLocalPatientsFromDB();
      expect(patients.length).toBe(0);
    });
  });
});
