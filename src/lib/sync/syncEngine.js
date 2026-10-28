import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  getPendingSyncQueue, 
  removeSyncQueueItem, 
  markSyncQueueFailed,
  recordConflict,
  getUnresolvedConflicts,
  savePatientLocally
} from '../db/dexieDb';

let syncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  status: 'synced', // 'synced' | 'syncing' | 'offline' | 'error'
  pendingCount: 0,
  conflictsCount: 0,
  lastSyncedAt: null,
  lastError: null
};

const listeners = new Set();
let syncTimer = null;

function notify() {
  const snapshot = { ...syncState };
  listeners.forEach(fn => {
    try { fn(snapshot); } catch (e) { console.error('Sync listener error:', e); }
  });
}

export function getSyncStatusSnapshot() {
  return { ...syncState };
}

export function subscribeSyncStatus(listener) {
  listeners.add(listener);
  listener({ ...syncState });
  return () => listeners.delete(listener);
}

/**
 * Push an individual queued mutation to Supabase
 */
async function pushQueueItem(item) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client not configured.');
  }

  const { entity, operation, payload } = item;

  if (entity === 'patients') {
    if (operation === 'DELETE') {
      const { error } = await supabase
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('custom_id', payload.custom_id || payload.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('patients')
        .upsert([payload], { onConflict: 'custom_id' });
      if (error) throw new Error(error.message);
    }
  } else if (entity === 'visits') {
    const { error } = await supabase
      .from('visits')
      .insert([payload]);
    if (error) throw new Error(error.message);
  } else if (entity === 'referrals') {
    const { error } = await supabase
      .from('referrals')
      .upsert([payload], { onConflict: 'id' });
    if (error) throw new Error(error.message);
  } else if (entity === 'prescriptions') {
    const { error } = await supabase
      .from('prescriptions')
      .upsert(Array.isArray(payload) ? payload : [payload]);
    if (error) throw new Error(error.message);
  } else if (entity === 'counselling_sessions') {
    const { error } = await supabase
      .from('counselling_sessions')
      .insert([payload]);
    if (error) throw new Error(error.message);
  }
}

/**
 * Execute full bidirectional sync: Outbox Push + Remote Pull with Conflict Detection
 */
export async function executeSync() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    syncState.isOnline = false;
    syncState.status = 'offline';
    notify();
    return { success: false, reason: 'offline' };
  }

  syncState.isOnline = true;
  syncState.status = 'syncing';
  notify();

  let pushedCount = 0;
  let failedCount = 0;

  try {
    // 1. Process Outbox Push Queue
    const pendingQueue = await getPendingSyncQueue();
    syncState.pendingCount = pendingQueue.length;

    for (const item of pendingQueue) {
      // Exponential backoff check (skip if too soon after previous failure)
      if (item.attempts > 0 && item.last_attempt) {
        const backoffMs = Math.min(300000, Math.pow(2, item.attempts) * 1000);
        const timeSince = Date.now() - new Date(item.last_attempt).getTime();
        if (timeSince < backoffMs) {
          continue; // Wait for next interval
        }
      }

      try {
        await pushQueueItem(item);
        await removeSyncQueueItem(item.id);
        pushedCount++;
      } catch (err) {
        failedCount++;
        await markSyncQueueFailed(item.id, err.message || 'Push failure');
      }
    }

    // 2. Pull Remote Changes & Detect Conflicts (if Supabase is available)
    if (isSupabaseConfigured && supabase) {
      const lastSync = syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toISOString() : null;
      let query = supabase.from('patients').select('*').is('deleted_at', null);
      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: remotePatients, error: pullErr } = await query;

      if (!pullErr && Array.isArray(remotePatients)) {
        const remainingQueue = await getPendingSyncQueue();

        for (const remoteRecord of remotePatients) {
          // Check if this patient is currently pending in local outbox
          const localPending = remainingQueue.find(
            q => q.entity === 'patients' && q.entity_id === remoteRecord.custom_id
          );

          if (localPending) {
            // CONFLICT DETECTED: Both sides modified this record!
            await recordConflict({
              entity: 'patients',
              entityId: remoteRecord.custom_id,
              localRecord: localPending.payload,
              remoteRecord: remoteRecord
            });
          } else {
            // Clean Last-Write-Wins: Save pulled record locally
            await savePatientLocally(remoteRecord);
          }
        }
      }
    }

    // 3. Update Sync State
    const remaining = await getPendingSyncQueue();
    const unresolvedConflicts = await getUnresolvedConflicts();

    syncState.pendingCount = remaining.length;
    syncState.conflictsCount = unresolvedConflicts.length;
    syncState.lastSyncedAt = new Date().toISOString();
    syncState.status = failedCount > 0 ? 'error' : 'synced';
    syncState.lastError = failedCount > 0 ? `${failedCount} item(s) could not sync.` : null;
    notify();

    return {
      success: failedCount === 0,
      pushed: pushedCount,
      failed: failedCount,
      pending: remaining.length,
      conflicts: unresolvedConflicts.length
    };
  } catch (globalErr) {
    console.error('Sync engine error:', globalErr);
    syncState.status = 'error';
    syncState.lastError = globalErr.message || 'Sync failed';
    notify();
    return { success: false, error: globalErr.message };
  }
}

/**
 * Start the sync engine (registers window online/offline events & periodic sync)
 */
export function initSyncEngine() {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    syncState.isOnline = true;
    notify();
    executeSync();
  };

  const handleOffline = () => {
    syncState.isOnline = false;
    syncState.status = 'offline';
    notify();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic automatic sync check every 60 seconds when online
  syncTimer = setInterval(() => {
    if (navigator.onLine && syncState.status !== 'syncing') {
      executeSync();
    }
  }, 60000);

  // Initial trigger
  if (navigator.onLine) {
    executeSync();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (syncTimer) clearInterval(syncTimer);
  };
}
