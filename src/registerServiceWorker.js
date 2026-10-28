import { registerSW } from 'virtual:pwa-register';

let deferredPrompt = null;
const installListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installListeners.forEach(listener => listener(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installListeners.forEach(listener => listener(false));
  });
}

export function subscribeToInstallPrompt(callback) {
  installListeners.add(callback);
  callback(Boolean(deferredPrompt));
  return () => installListeners.delete(callback);
}

export async function promptPWAInstall() {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installListeners.forEach(listener => listener(false));
    return outcome === 'accepted';
  } catch (err) {
    console.warn('PWA install prompt error:', err);
    return false;
  }
}

export function initPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.info('CHW Toolkit update ready.');
        },
        onOfflineReady() {
          console.info('CHW Toolkit ready to work offline.');
        }
      });
    } catch (e) {
      console.warn('PWA registration notice:', e);
    }
  }
}
