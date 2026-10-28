import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { INITIAL_AUDIT_LOGS } from '../../data/initialData';

const LOCAL_AUDIT_KEY = 'chw_audit_logs';

function getLocalAuditLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

function saveLocalAuditLogs(logs) {
  try {
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save audit logs locally:', e);
  }
}

/**
 * Record an immutable security audit event
 */
export async function logAuditEvent(action, entity, entityId, details, user = null) {
  const logEntry = {
    id: 'LOG-' + Math.floor(100 + Math.random() * 900),
    timestamp: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    user: user?.name || 'Authorized Field Worker',
    role: user?.role || 'CHW',
    action,
    entity,
    entity_id: entityId,
    details: typeof details === 'string' ? details : JSON.stringify(details)
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user?.id || null,
        user_name: user?.name || 'Local User',
        role: user?.role || 'CHW',
        action,
        entity,
        entity_id: String(entityId),
        details: typeof details === 'string' ? details : JSON.stringify(details)
      }]);
    } catch (err) {
      console.warn('Supabase audit log insert error:', err);
    }
  }

  const current = getLocalAuditLogs();
  saveLocalAuditLogs([logEntry, ...current]);
  return logEntry;
}

/**
 * Fetch audit trail logs
 */
export async function fetchAuditLogs() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(item => ({
          id: item.id,
          timestamp: new Date(item.created_at).toLocaleString(),
          user: item.user_name || 'System User',
          role: item.role || 'Staff',
          action: item.action,
          details: item.details
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchAuditLogs error:', err);
    }
  }

  return getLocalAuditLogs();
}
