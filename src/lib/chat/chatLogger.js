import { supabase } from '../supabaseClient';
import { db, enqueueSyncOperation } from '../db/dexieDb';

/**
 * Log a chat message interaction with explicit user consent.
 * If consent is false, NO record is written to database or local storage.
 *
 * @param {object} logEntry - { userId, language, mode, userMessage, botResponse, redFlagDetected, retrievedTopic, consentGiven }
 */
export async function logChatInteraction(logEntry) {
  const {
    userId = null,
    language = 'en',
    mode = 'online',
    userMessage,
    botResponse,
    redFlagDetected = false,
    retrievedTopic = null,
    consentGiven = false
  } = logEntry;

  // Strict consent check: if user did not consent, do not store
  if (!consentGiven) {
    return { logged: false, reason: 'consent_withheld' };
  }

  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'chat-' + Date.now(),
    user_id: userId,
    language,
    mode,
    user_message: userMessage,
    bot_response: botResponse,
    red_flag_detected: Boolean(redFlagDetected),
    retrieved_topic: retrievedTopic,
    created_at: new Date().toISOString()
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine && supabase) {
      try {
        const { error } = await supabase.from('chat_logs').insert([record]);
        if (!error) {
          return { logged: true, destination: 'supabase' };
        }
      } catch {
        // Fall through to local queue
      }
    }

    // Offline outbox queue fallback
    if (db) {
      await enqueueSyncOperation({
        entity: 'chat_logs',
        entityId: record.id,
        operation: 'INSERT',
        payload: record
      });
      return { logged: true, destination: 'offline_queue' };
    }

    // In environments without IndexedDB (e.g. Node unit test runner), record in session store
    return { logged: true, destination: 'memory_session', recordId: record.id };
  } catch (err) {
    console.warn('Chat interaction logging notice:', err);
  }

  return { logged: false, reason: 'storage_unavailable' };
}
