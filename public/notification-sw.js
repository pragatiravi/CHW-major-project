self.addEventListener('notificationclick', (event) => {
  const deepLink = event.notification.data?.deepLink || 'home';
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'CHW_NOTIFICATION_CLICK', deepLink });
      return client.focus();
    }
    return self.clients.openWindow(`/?section=${encodeURIComponent(deepLink)}`);
  })());
});
