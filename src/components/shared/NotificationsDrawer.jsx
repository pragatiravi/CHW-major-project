import { Bell, AlertTriangle, Pill, Calendar, CheckCircle2, X } from 'lucide-react';

export default function NotificationsDrawer({ notifications = [], onClose, onMarkAllRead, onSelectNotification }) {
  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL_ALERT':
      case 'HIGH_RISK':
        return <AlertTriangle size={16} className="text-rose-600" />;
      case 'MEDICATION_ALERT':
        return <Pill size={16} className="text-amber-600" />;
      case 'REFERRAL_UPDATE':
        return <CheckCircle2 size={16} className="text-sky-600" />;
      default:
        return <Calendar size={16} className="text-emerald-600" />;
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer-panel" 
        style={{ width: '420px', maxWidth: '90vw' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <div className="drawer-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 id="notifications-title" className="text-sm font-bold text-slate-900">Clinical Alerts & Notifications</h3>
              <p className="text-3xs text-slate-500">System events and field triage alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="btn btn-secondary text-2xs py-1 px-2 font-semibold"
              onClick={onMarkAllRead}
            >
              Mark all read
            </button>
            <button className="btn-icon-xs" onClick={onClose} aria-label="Close notifications"><X size={14} /></button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-600">All caught up!</p>
              <p className="text-2xs text-slate-400 mt-0.5">No unread clinical alerts.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                type="button"
                key={n.id} 
                className={`notification-list-item p-3 rounded-xl border transition-all cursor-pointer ${
                  n.read ? 'border-slate-200 bg-white opacity-80' : 'border-sky-300 bg-sky-50/60 shadow-xs'
                }`}
                onClick={() => onSelectNotification && onSelectNotification(n)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <strong className="text-xs text-slate-900 block leading-snug">{n.title}</strong>
                      <span className="text-3xs text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                    </div>
                    <p className="text-2xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
