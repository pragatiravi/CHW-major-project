import { X, RefreshCw, WifiOff, HardDrive, Download, Upload, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '../shared/ToastContainer';

export default function OfflineSyncQueueModal({
  onClose,
  offlineQueue = [],
  syncLogs = [],
  onSyncOfflineData,
  patients = [],
  onRestoreBackup
}) {
  const { toastSuccess, toastError } = useToast();

  const handleExportBackup = () => {
    const backupData = JSON.stringify({ patients, syncLogs, timestamp: new Date().toISOString() }, null, 2);
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
          toastError('Invalid backup file format.');
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
        className="card-box w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl p-0 flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Offline Storage & Cloud Sync Hub</h2>
              <p className="text-2xs text-slate-500">Local database synchronization & backup management</p>
            </div>
          </div>
          <button className="btn-icon-xs" onClick={onClose} aria-label="Close sync manager"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top Sync Action Card */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <WifiOff size={16} className="text-sky-700" /> Pending Offline Sync Queue
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {offlineQueue.length} patient screening record(s) queued for synchronization.
              </p>
            </div>
            <button 
              className="btn btn-primary text-xs font-bold"
              onClick={onSyncOfflineData}
              disabled={offlineQueue.length === 0}
            >
              <RefreshCw size={14} /> Sync All ({offlineQueue.length})
            </button>
          </div>

          {/* Queued Records */}
          <div className="space-y-2">
            <span className="metric-label text-2xs uppercase block">Queued Patient Records</span>
            {offlineQueue.length > 0 ? (
              offlineQueue.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900">{item.name}</strong>
                    <span className="text-2xs text-slate-500 font-mono ml-2">ID: {item.id}</span>
                  </div>
                  <span className="badge badge-risk-moderate text-3xs flex items-center gap-1">
                    <Clock size={11} /> Queued Locally
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>All local field data is fully synchronized with central registry.</span>
              </div>
            )}
          </div>

          {/* Backup & Restore Section */}
          <div className="grid-2-col gap-4 pt-3 border-t border-slate-200">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <strong className="text-xs text-slate-900 block flex items-center gap-1.5">
                <Download size={14} className="text-sky-600" /> Export Database Backup
              </strong>
              <p className="text-2xs text-slate-500">Download complete encrypted JSON snapshot of local records.</p>
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button className="btn btn-secondary text-xs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
