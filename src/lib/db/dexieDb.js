import Dexie from 'dexie';
import { encryptSensitiveData, decryptSensitiveData } from '../crypto/encryption';

export class CHWDatabase extends Dexie {
  constructor() {
    super('CHWToolkitDB');

    this.version(1).stores({
      patients: 'id, custom_id, legacy_id, name, created_by, assigned_chw, updated_at, [assigned_chw+updated_at]',
      visits: 'id, patient_id, chw_id, visit_date, risk_level, updated_at',
      referrals: 'id, patient_id, visit_id, hospital_name, status, updated_at',
      prescriptions: 'id, patient_id, medicine_name, is_active, updated_at',
      counselling_sessions: 'id, patient_id, script_id, language, updated_at',
      follow_ups: 'id, patient_id, due_date, status, updated_at',
      vaccinations: 'id, patient_id, vaccine_name, status, updated_at',
      emergency_reports: 'id, patient_id, reporter_id, urgency, status, created_at',
      inventory: 'id, item_name, category, updated_at',
      sync_queue: '++id, entity, entity_id, operation, created_at, status',
      conflicts: '++id, entity, entity_id, detected_at, status',
      sync_meta: 'key, updated_at'
    });
  }
}

// In-memory fallback if IndexedDB is unavailable in current runtime (e.g., Node.js unit tests)
const isIndexedDBAvailable = typeof indexedDB !== 'undefined';
export const db = isIndexedDBAvailable ? new CHWDatabase() : null;

// Memory storage fallback for Node.js Vitest environments
const memoryStore = {
  patients: new Map(),
  visits: new Map(),
  referrals: new Map(),
  prescriptions: new Map(),
  counselling_sessions: new Map(),
  sync_queue: [],
  conflicts: [],
  sync_meta: new Map()
};

let memoryQueueIdSeq = 1;
let memoryConflictIdSeq = 1;

/**
 * Save a patient to local IndexedDB (with encryption for phone & address)
 */
export async function savePatientLocally(patient, userSecret = 'CHW_LOCAL_PIN') {
  const securePatient = { ...patient };
  if (patient.phone) {
    securePatient.phone = await encryptSensitiveData(patient.phone, userSecret);
  }
  if (patient.address) {
    securePatient.address = await encryptSensitiveData(patient.address, userSecret);
  }
  securePatient.updated_at = patient.updated_at || new Date().toISOString();

  if (db) {
    await db.patients.put(securePatient);
  } else {
    memoryStore.patients.set(securePatient.id, securePatient);
  }
  return patient;
}

/**
 * Retrieve patients from local IndexedDB scoped to user ID (with decryption)
 */
export async function getLocalPatientsFromDB(userId, userSecret = 'CHW_LOCAL_PIN') {
  let records;

  if (db) {
    try {
      if (userId) {
        records = await db.patients
          .filter(p => p.created_by === userId || p.assigned_chw === userId || !p.created_by)
          .toArray();
      } else {
        records = await db.patients.toArray();
      }
    } catch (err) {
      console.warn('IndexedDB read error, using memory fallback:', err);
      records = Array.from(memoryStore.patients.values());
    }
  } else {
    records = Array.from(memoryStore.patients.values());
    if (userId) {
      records = records.filter(p => p.created_by === userId || p.assigned_chw === userId || !p.created_by);
    }
  }

  // Decrypt sensitive attributes on read
  const decrypted = await Promise.all(
    records.map(async (p) => {
      const copy = { ...p };
      if (copy.phone) {
        copy.phone = await decryptSensitiveData(copy.phone, userSecret);
      }
      if (copy.address) {
        copy.address = await decryptSensitiveData(copy.address, userSecret);
      }
      return copy;
    })
  );

  return decrypted;
}

/**
 * Save a visit encounter to local IndexedDB
 */
export async function saveVisitLocally(visit) {
  const payload = {
    ...visit,
    updated_at: visit.updated_at || new Date().toISOString()
  };

  if (db) {
    await db.visits.put(payload);
  } else {
    memoryStore.visits.set(payload.id, payload);
  }
  return payload;
}

/**
 * Retrieve local visits for a patient
 */
export async function getLocalVisitsFromDB(patientId) {
  if (db) {
    try {
      return await db.visits.where('patient_id').equals(patientId).toArray();
    } catch {
      return Array.from(memoryStore.visits.values()).filter(v => v.patient_id === patientId);
    }
  }
  return Array.from(memoryStore.visits.values()).filter(v => v.patient_id === patientId);
}

/**
 * Push an operation into the persistent Outbox Sync Queue
 */
export async function enqueueSyncOperation({ entity, entityId, operation, payload }) {
  const queueItem = {
    entity,
    entity_id: entityId,
    operation, // 'UPSERT' | 'DELETE' | 'INSERT'
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending', // 'pending' | 'syncing' | 'failed'
    last_error: null
  };

  if (db) {
    const id = await db.sync_queue.add(queueItem);
    return { ...queueItem, id };
  } else {
    queueItem.id = memoryQueueIdSeq++;
    memoryStore.sync_queue.push(queueItem);
    return queueItem;
  }
}

/**
 * Get all pending items waiting in the Outbox Sync Queue
 */
export async function getPendingSyncQueue() {
  if (db) {
    try {
      return await db.sync_queue.where('status').equals('pending').or('status').equals('failed').toArray();
    } catch {
      return memoryStore.sync_queue.filter(i => i.status === 'pending' || i.status === 'failed');
    }
  }
  return memoryStore.sync_queue.filter(i => i.status === 'pending' || i.status === 'failed');
}

/**
 * Dequeue an item after successful sync to central database
 */
export async function removeSyncQueueItem(id) {
  if (db) {
    await db.sync_queue.delete(id);
  } else {
    const idx = memoryStore.sync_queue.findIndex(i => i.id === id);
    if (idx >= 0) memoryStore.sync_queue.splice(idx, 1);
  }
}

/**
 * Mark a queue item as failed with error details for exponential backoff
 */
export async function markSyncQueueFailed(id, errorMessage) {
  if (db) {
    const item = await db.sync_queue.get(id);
    if (item) {
      await db.sync_queue.update(id, {
        attempts: (item.attempts || 0) + 1,
        status: 'failed',
        last_error: errorMessage,
        last_attempt: new Date().toISOString()
      });
    }
  } else {
    const item = memoryStore.sync_queue.find(i => i.id === id);
    if (item) {
      item.attempts = (item.attempts || 0) + 1;
      item.status = 'failed';
      item.last_error = errorMessage;
      item.last_attempt = new Date().toISOString();
    }
  }
}

/**
 * Record a detected conflict between local and remote modifications
 */
export async function recordConflict({ entity, entityId, localRecord, remoteRecord }) {
  const conflictRecord = {
    entity,
    entity_id: entityId,
    local_record: localRecord,
    remote_record: remoteRecord,
    detected_at: new Date().toISOString(),
    status: 'unresolved' // 'unresolved' | 'resolved_local' | 'resolved_remote'
  };

  if (db) {
    const id = await db.conflicts.add(conflictRecord);
    return { ...conflictRecord, id };
  } else {
    conflictRecord.id = memoryConflictIdSeq++;
    memoryStore.conflicts.push(conflictRecord);
    return conflictRecord;
  }
}

/**
 * List all unresolved conflicts
 */
export async function getUnresolvedConflicts() {
  if (db) {
    try {
      return await db.conflicts.where('status').equals('unresolved').toArray();
    } catch {
      return memoryStore.conflicts.filter(c => c.status === 'unresolved');
    }
  }
  return memoryStore.conflicts.filter(c => c.status === 'unresolved');
}

/**
 * Resolve a conflict by either choosing local or remote data
 */
export async function resolveConflict(conflictId, chosenSource) {
  if (db) {
    const conflict = await db.conflicts.get(conflictId);
    if (!conflict) return null;

    const chosenRecord = chosenSource === 'local' ? conflict.local_record : conflict.remote_record;
    if (conflict.entity === 'patients') {
      await db.patients.put(chosenRecord);
    }

    await db.conflicts.update(conflictId, {
      status: chosenSource === 'local' ? 'resolved_local' : 'resolved_remote',
      resolved_at: new Date().toISOString()
    });

    return chosenRecord;
  } else {
    const conflict = memoryStore.conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    const chosenRecord = chosenSource === 'local' ? conflict.local_record : conflict.remote_record;
    if (conflict.entity === 'patients') {
      memoryStore.patients.set(chosenRecord.id, chosenRecord);
    }
    conflict.status = chosenSource === 'local' ? 'resolved_local' : 'resolved_remote';
    conflict.resolved_at = new Date().toISOString();
    return chosenRecord;
  }
}

/**
 * Clear local data on logout when sync queue is empty
 */
export async function clearLocalDataIfClean() {
  const queue = await getPendingSyncQueue();
  if (queue.length > 0) {
    throw new Error(`Cannot clear local data: ${queue.length} unsynced items are pending upload.`);
  }

  if (db) {
    await db.patients.clear();
    await db.visits.clear();
    await db.referrals.clear();
    await db.prescriptions.clear();
    await db.counselling_sessions.clear();
    await db.conflicts.clear();
  } else {
    memoryStore.patients.clear();
    memoryStore.visits.clear();
    memoryStore.referrals.clear();
    memoryStore.prescriptions.clear();
    memoryStore.counselling_sessions.clear();
    memoryStore.conflicts = [];
  }

  return true;
}
