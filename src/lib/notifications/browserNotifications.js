export function getNotificationPermissionState() {
  if (typeof window === 'undefined') return 'unsupported';
  const api = window.Notification || globalThis.Notification;
  return api?.permission || 'unsupported';
}

export async function requestNotificationPermission() {
  if (getNotificationPermissionState() === 'unsupported') return 'unsupported';
  const api = window.Notification || globalThis.Notification;
  return api.requestPermission();
}

export async function showBrowserNotification(notification, onClick) {
  if (getNotificationPermissionState() !== 'granted') return false;
  const options = {
    body: notification.browserBody || 'Open the app to review this care alert.',
    tag: notification.dedupeKey || notification.id,
    icon: '/icons/icon-192.png',
    data: { deepLink: notification.deepLink || 'home' }
  };
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, options);
      return true;
    } catch (error) {
      console.warn('Service worker notification failed; using page notification:', error);
    }
  }
  const api = window.Notification || globalThis.Notification;
  const item = new api(notification.title, options);
  item.onclick = () => { window.focus(); onClick?.(notification); item.close(); };
  return true;
}
