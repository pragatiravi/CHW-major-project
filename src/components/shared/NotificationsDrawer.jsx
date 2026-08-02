import React from 'react';
import { Bell, AlertTriangle, Pill, Calendar, CheckCircle2, X } from 'lucide-react';

export default function NotificationsDrawer({ notifications, onClose, onMarkAllRead, onSelectNotification }) {
  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL_ALERT':
      case 'HIGH_RISK':
        return <AlertTriangle size={18} className="text-red-400" />;
      case 'MEDICATION_ALERT':
        return <Pill size={18} className="text-amber-400" />;
      case 'REFERRAL_UPDATE':
        return <CheckCircle2 size={18} className="text-blue-400" />;
      default:
        return <Calendar size={18} className="text-emerald-400" />;
    }
  };

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-indigo-400" />
            <h3 className="notifications-title">Notifications Hub</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs text-indigo-400 hover:underline" onClick={onMarkAllRead}>
              Mark all read
            </button>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <CheckCircle2 size={32} className="text-gray-500 mb-2" />
              <p>No new notifications. Everything is up to date!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`notification-card ${n.read ? 'read' : 'unread'} type-${n.type}`}
                onClick={() => onSelectNotification && onSelectNotification(n)}
              >
                <div className="notification-icon">{getIcon(n.type)}</div>
                <div className="notification-content">
                  <div className="notification-top">
                    <span className="notification-subject">{n.title}</span>
                    <span className="notification-time">{n.time}</span>
                  </div>
                  <p className="notification-text">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
