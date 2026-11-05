import { afterEach, describe, expect, it, vi } from 'vitest';
import { addNotification, countUnreadNotifications, deleteNotification, loadNotifications, markAllNotificationsRead, markNotificationRead, saveNotifications } from './notificationStore';
import { getNotificationPermissionState, requestNotificationPermission, showBrowserNotification } from './browserNotifications';

describe('notification store', () => {
  it('uses browser storage without leaking one user’s notifications to another', () => {
    const storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value))
    });
    saveNotifications('user-a', [{ id: 'a', title: 'A' }]);
    saveNotifications('user-b', [{ id: 'b', title: 'B' }]);
    expect(loadNotifications('user-a').map(item => item.id)).toEqual(['a']);
    expect(loadNotifications('user-b').map(item => item.id)).toEqual(['b']);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('deduplicates, marks read, counts unread, and deletes notifications', () => {
    const first = addNotification([], { id: 'n1', type: 'FOLLOW_UP', entityId: 'p1' });
    expect(addNotification(first, { id: 'n2', type: 'FOLLOW_UP', entityId: 'p1' })).toHaveLength(1);
    expect(countUnreadNotifications(first)).toBe(1);
    const read = markNotificationRead(first, 'n1');
    expect(countUnreadNotifications(read)).toBe(0);
    expect(countUnreadNotifications(markAllNotificationsRead(first))).toBe(0);
    expect(deleteNotification(first, 'n1')).toEqual([]);
  });
});

describe('browser notification permission states', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports unsupported when the API is missing', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('Notification', undefined);
    expect(getNotificationPermissionState()).toBe('unsupported');
  });

  it.each(['default', 'granted', 'denied'])('reports %s permission state', (permission) => {
    vi.stubGlobal('window', { Notification: { permission } });
    expect(getNotificationPermissionState()).toBe(permission);
  });

  it('requests permission only when the explicit request function is called', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('window', { Notification: { permission: 'default', requestPermission } });
    await expect(requestNotificationPermission()).resolves.toBe('granted');
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it('does not show a browser popup after permission is denied', async () => {
    vi.stubGlobal('window', { Notification: { permission: 'denied' } });
    await expect(showBrowserNotification({ title: 'Alert' })).resolves.toBe(false);
  });

  it('uses the service worker showNotification API after permission is granted', async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    const notificationApi = vi.fn();
    notificationApi.permission = 'granted';
    vi.stubGlobal('window', { Notification: notificationApi });
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ showNotification }) } });
    await expect(showBrowserNotification({ title: 'Follow-up', deepLink: 'patients' })).resolves.toBe(true);
    expect(showNotification).toHaveBeenCalledWith('Follow-up', expect.objectContaining({ data: { deepLink: 'patients' } }));
  });
});
