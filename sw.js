/** QUARANTIN Service Worker — cache v2 (relative paths for GitHub Pages). */
const CACHE_NAME = 'quarantin-cache-v3';
const APP_SHELL = [
  './', './index.html', './manifest.json',
  './css/themes.css', './css/main.css', './css/components.css', './css/animations.css', './css/print.css',
  './js/utils.js', './js/taxData.js', './js/calculator.js', './js/storage.js', './js/pwa.js', './js/ui.js',
  './js/history.js', './js/quarterly.js', './js/dashboard.js', './js/export.js', './js/settings.js', './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.error('SW install error:', err))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
