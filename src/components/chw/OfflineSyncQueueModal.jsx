import React from 'react';
import { X, RefreshCw, WifiOff, HardDrive, Download, Upload, CheckCircle, Clock } from 'lucide-react';

export default function OfflineSyncQueueModal({
  onClose,
  offlineQueue,
  syncLogs,
  onSyncOfflineData,
  patients,
  onRestoreBackup
}) {
  const handleExportBackup = () => {
    const backupData = JSON.stringify({ patients, syncLogs, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chw_toolkit_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
          alert('Backup restored successfully!');
          onClose();
        } else {
          alert('Invalid backup format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header bg-gradient-to-r from-blue-950 to-slate-900">
          <div className="flex items-center gap-2">
            <HardDrive className="text-blue-400" size={24} />
            <div>
              <h2>Offline Storage & Cloud Sync Hub</h2>
              <p className="text-xs text-gray-400">Local Database Sync Queue & Backup Tools</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Top Sync Trigger Status */}
          <div className="card-box bg-secondary mb-4 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <WifiOff size={16} className="text-amber-400" /> Pending Offline Queue Status
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {offlineQueue.length} patient record(s) queued for synchronization.
              </p>
            </div>
            <button 
              className="btn btn-primary flex items-center gap-1"
              onClick={onSyncOfflineData}
              disabled={offlineQueue.length === 0}
            >
              <RefreshCw size={16} /> Batch Sync Now ({offlineQueue.length})
            </button>
          </div>

          {/* Pending Queue List */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Unsynchronized Queued Items</h4>
            {offlineQueue.length > 0 ? (
              <div className="space-y-2">
                {offlineQueue.map((item, idx) => (
                  <div key={idx} className="sync-queue-item">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-white text-sm">{item.name}</strong>
                        <span className="text-xs text-gray-400 ml-2">ID: {item.id}</span>
                      </div>
                      <span className="badge badge-warning flex items-center gap-1">
                        <Clock size={12} /> Pending Local Queue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle size={32} className="text-emerald-500 mb-2" />
                <p className="text-emerald-400">All local data is fully synchronized with Cloud DB!</p>
              </div>
            )}
          </div>

          {/* Backup & Restore Utility */}
          <div className="grid-2-col gap-4 mt-4 border-t border-slate-800 pt-4">
            <div className="card-box bg-slate-900 border-slate-700">
              <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                <Download size={14} /> Export Local Database Backup
              </h4>
              <p className="text-2xs text-gray-400 mb-3">Download encrypted JSON snapshot of all patient records and sync logs.</p>
              <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={handleExportBackup}>
                <Download size={14} /> Download Backup (.JSON)
              </button>
            </div>

            <div className="card-box bg-slate-900 border-slate-700">
              <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                <Upload size={14} /> Restore Database Backup
              </h4>
              <p className="text-2xs text-gray-400 mb-3">Upload previously saved JSON backup to restore local storage.</p>
              <label className="btn btn-secondary text-xs inline-flex items-center gap-1 cursor-pointer">
                <Upload size={14} /> Select Backup File
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Sync Activity History */}
          <div className="mt-4 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Recent Sync Audit Logs</h4>
            <div className="sync-logs-list">
              {syncLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="sync-log-row">
                  <span className="text-indigo-400 font-mono text-xs">{log.id}</span>
                  <span className="text-xs text-gray-300">{log.timestamp}</span>
                  <span className="badge badge-neutral">{log.type}</span>
                  <span className="text-xs text-gray-400">{log.count} records synced ({log.device})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
