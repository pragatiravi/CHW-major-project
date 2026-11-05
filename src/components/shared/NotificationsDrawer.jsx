import { Bell, AlertTriangle, Pill, Calendar, CheckCircle2, X, Trash2, BellRing } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function NotificationsDrawer({ notifications = [], onClose, onMarkAllRead, onMarkRead, onDeleteNotification, onSelectNotification, permissionState, systemNotificationsEnabled, onToggleSystemNotifications }) {
  const { t } = useLanguage();
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
              <h3 id="notifications-title" className="text-sm font-bold text-slate-900">{t('notificationsTitle')}</h3>
              <p className="text-3xs text-slate-500">{t('notificationsSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="btn btn-secondary text-2xs py-1 px-2 font-semibold"
              onClick={onMarkAllRead}
            >
              {t('markAllRead')}
            </button>
            <button className="btn-icon-xs" onClick={onClose} aria-label="Close notifications"><X size={14} /></button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 text-2xs">
          <span className="text-slate-600">{t('browserNotifications')}</span>
          {permissionState === 'unsupported' ? <span className="text-slate-400">{t('notificationsUnsupported')}</span> : permissionState === 'denied' ? <span className="text-amber-700">{t('notificationsBlocked')}</span> : (
            <button type="button" className="btn btn-secondary text-2xs py-1 px-2" onClick={onToggleSystemNotifications}>
              <BellRing size={13} /> {systemNotificationsEnabled ? t('notificationsOn') : permissionState === 'granted' ? t('notificationsOff') : t('enableNotifications')}
            </button>
          )}
        </div>
        <p className="px-4 pb-2 text-3xs text-slate-500">{t('browserNotificationsExplain')}</p>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-600">{t('notificationsEmptyTitle')}</p>
              <p className="text-2xs text-slate-400 mt-0.5">{t('notificationsEmptyBody')}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id} 
                className={`notification-list-item p-3 rounded-xl border transition-all cursor-pointer ${
                  n.read ? 'border-slate-200 bg-white opacity-80' : 'border-sky-300 bg-sky-50/60 shadow-xs'
                }`}
              >
                <button type="button" className="w-full text-left" onClick={() => onSelectNotification?.(n)}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <strong className="text-xs text-slate-900 block leading-snug">{n.titleKey ? t(n.titleKey) : n.title}</strong>
                      <span className="text-3xs text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                    </div>
                    <p className="text-2xs text-slate-600 mt-1 leading-relaxed">{n.messageKey ? t(n.messageKey) : n.message}</p>
                  </div>
                  </div>
                </button>
                <div className="flex justify-end gap-2 mt-2">
                  {!n.read && <button type="button" className="text-3xs text-sky-700" onClick={() => onMarkRead?.(n.id)}>{t('markRead')}</button>}
                  <button type="button" className="text-3xs text-slate-500" aria-label={t('deleteNotification')} onClick={() => onDeleteNotification?.(n.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
