const STORAGE_PREFIX = 'chw_notifications_v1:';

export function notificationStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

export function loadNotifications(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem(notificationStorageKey(userId)) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function saveNotifications(userId, notifications) {
  try {
    localStorage.setItem(notificationStorageKey(userId), JSON.stringify(notifications.slice(0, 100)));
  } catch (error) {
    console.warn('Could not persist notifications on this device:', error);
  }
}

export function addNotification(notifications, notification) {
  const dedupeKey = notification.dedupeKey || `${notification.type}:${notification.entityId || notification.id}`;
  if (notifications.some(item => item.dedupeKey === dedupeKey)) return notifications;
  return [{ ...notification, dedupeKey, read: false, createdAt: notification.createdAt || new Date().toISOString() }, ...notifications].slice(0, 100);
}

export function markNotificationRead(notifications, id) {
  return notifications.map(item => item.id === id ? { ...item, read: true } : item);
}

export function markAllNotificationsRead(notifications) {
  return notifications.map(item => ({ ...item, read: true }));
}

export function deleteNotification(notifications, id) {
  return notifications.filter(item => item.id !== id);
}

export function countUnreadNotifications(notifications) {
  return notifications.filter(item => !item.read).length;
}
