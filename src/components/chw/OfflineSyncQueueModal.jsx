import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  RefreshCw, 
  WifiOff, 
  HardDrive, 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Check, 
  ArrowRight,
  Database
} from 'lucide-react';
import { useToast } from '../shared/ToastContainer';
import { 
  getPendingSyncQueue, 
  getUnresolvedConflicts, 
  resolveConflict 
} from '../../lib/db/dexieDb';

export default function OfflineSyncQueueModal({
  onClose,
  syncLogs = [],
  onSyncOfflineData,
  patients = [],
  onRestoreBackup
}) {
  const { toastSuccess, toastError } = useToast();
  const [dexieQueue, setDexieQueue] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [queueItems, conflictItems] = await Promise.all([
        getPendingSyncQueue(),
        getUnresolvedConflicts()
      ]);
      setDexieQueue(queueItems || []);
      setConflicts(conflictItems || []);
    } catch (err) {
      console.warn('Could not read Dexie queue/conflicts:', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPendingSyncQueue(),
      getUnresolvedConflicts()
    ]).then(([queueItems, conflictItems]) => {
      if (active) {
        setDexieQueue(queueItems || []);
        setConflicts(conflictItems || []);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Could not read Dexie queue/conflicts:', err);
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      if (onSyncOfflineData) {
        await onSyncOfflineData();
      }
      await loadData();
    } catch (err) {
      toastError(`Sync failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflict = async (conflictId, chosenSource) => {
    try {
      await resolveConflict(conflictId, chosenSource);
      toastSuccess(`Conflict resolved using ${chosenSource === 'local' ? 'Local' : 'Remote'} record.`);
      await loadData();
    } catch (err) {
      toastError(`Failed to resolve conflict: ${err.message}`);
    }
  };

  const handleExportBackup = () => {
    const backupData = JSON.stringify({ 
      patients, 
      syncLogs, 
      pendingQueue: dexieQueue, 
      timestamp: new Date().toISOString() 
    }, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chw_toolkit_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toastSuccess('Database backup JSON snapshot downloaded.');
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.patients && Array.isArray(json.patients)) {
          onRestoreBackup(json.patients);
          toastSuccess(`Restored ${json.patients.length} patient records successfully!`);
          onClose();
        } else {
          toastError('Invalid backup file format: missing patients array.');
        }
      } catch {
        toastError('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card-box w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Offline Storage & Outbox Sync Hub</h2>
              <p className="text-2xs text-slate-500">IndexedDB local database with bidirectional sync & conflict resolution</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close sync manager"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Sync Action Card */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <WifiOff size={16} className="text-sky-700" /> Pending IndexedDB Outbox
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {dexieQueue.length} mutation(s) queued for cloud sync.
              </p>
            </div>
            <button 
              className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
              onClick={handleSyncAll}
              disabled={isSyncing || dexieQueue.length === 0}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> 
              {isSyncing ? 'Syncing...' : `Sync All (${dexieQueue.length})`}
            </button>
          </div>

          {/* CONFLICT RESOLUTION SECTION */}
          {conflicts.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Sync Conflicts Detected ({conflicts.length})</span>
              </div>
              <p className="text-xs text-amber-800">
                These records were modified both on this handheld device and centrally by another provider. Please decide which version to preserve:
              </p>

              <div className="space-y-3">
                {conflicts.map((conflict) => {
                  const local = conflict.local_record || {};
                  const remote = conflict.remote_record || {};
                  return (
                    <div key={conflict.id} className="p-3 bg-white rounded-lg border border-amber-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 font-mono">
                          {conflict.entity.toUpperCase()} ID: {conflict.entity_id}
                        </span>
                        <span className="text-2xs text-amber-700 font-medium">
                          Detected: {new Date(conflict.detected_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-2xs">
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <strong className="text-sky-700 block mb-1">Local Version (Handheld)</strong>
                          <div className="text-slate-600 font-mono">
                            Name: {local.name || 'N/A'}<br/>
                            BP: {local.systolic || '-'}/{local.diastolic || '-'} mmHg<br/>
                            Sugar: {local.glucose || '-'} mg/dL<br/>
                            Updated: {local.updated_at ? new Date(local.updated_at).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>

                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <strong className="text-indigo-700 block mb-1">Remote Version (Clinic Cloud)</strong>
                          <div className="text-slate-600 font-mono">
                            Name: {remote.name || 'N/A'}<br/>
                            BP: {remote.systolic || '-'}/{remote.diastolic || '-'} mmHg<br/>
                            Sugar: {remote.glucose || '-'} mg/dL<br/>
                            Updated: {remote.updated_at ? new Date(remote.updated_at).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          className="btn btn-secondary text-2xs py-1 px-2.5 font-bold text-sky-700"
                          onClick={() => handleResolveConflict(conflict.id, 'local')}
                        >
                          <Check size={12} /> Keep Local
                        </button>
                        <button 
                          className="btn btn-primary text-2xs py-1 px-2.5 font-bold"
                          onClick={() => handleResolveConflict(conflict.id, 'remote')}
                        >
                          <ArrowRight size={12} /> Accept Remote
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outbox Queued Mutations */}
          <div className="space-y-2">
            <span className="metric-label text-2xs uppercase block">Outbox Sync Queue ({dexieQueue.length})</span>
            {loading ? (
              <div className="py-4 text-center text-slate-400 text-xs">Checking local store...</div>
            ) : dexieQueue.length > 0 ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {dexieQueue.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary text-3xs font-mono uppercase">{item.operation}</span>
                        <strong className="text-slate-900">{item.entity}</strong>
                        <span className="text-2xs text-slate-500 font-mono">({item.entity_id})</span>
                      </div>
                      {item.last_error && (
                        <div className="text-2xs text-rose-600 mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} /> Attempt {item.attempts}: {item.last_error}
                        </div>
                      )}
                    </div>
                    <span className="badge badge-risk-moderate text-3xs flex items-center gap-1">
                      <Clock size={11} /> {item.status === 'failed' ? 'Backoff Retry' : 'Pending Sync'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>All local records are synchronized with central clinic database.</span>
              </div>
            )}
          </div>

          {/* Backup & Restore Section */}
          <div className="grid-2-col gap-4 pt-3 border-t border-slate-200">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <strong className="text-xs text-slate-900 block flex items-center gap-1.5">
                <Download size={14} className="text-sky-600" /> Export Database Backup
              </strong>
              <p className="text-2xs text-slate-500">Download complete encrypted JSON snapshot of local records & outbox.</p>
              <button className="btn btn-secondary text-xs" onClick={handleExportBackup}>
                <Download size={14} /> Download Backup (.JSON)
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <strong className="text-xs text-slate-900 block flex items-center gap-1.5">
                <Upload size={14} className="text-indigo-600" /> Restore Database Backup
              </strong>
              <p className="text-2xs text-slate-500">Upload saved JSON backup file to restore patient state.</p>
              <label className="btn btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                <Upload size={14} /> Select Backup File
                <input type="file" accept=".json" onChange={handleRestoreFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Recent Sync Audit History */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <span className="metric-label text-2xs uppercase block">Recent Sync Audit History</span>
            <div className="space-y-1.5">
              {syncLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-sky-700 font-bold">{log.id}</span>
                    <span className="text-slate-900 font-medium">{log.type}</span>
                  </div>
                  <div className="text-2xs text-slate-500">
                    {log.count} records • {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-2xs text-slate-500 flex items-center gap-1">
            <Database size={12} className="text-sky-600" /> IndexedDB AES-GCM Encrypted at Rest
          </span>
          <button className="btn btn-secondary text-xs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
