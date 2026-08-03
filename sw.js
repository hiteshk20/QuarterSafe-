/**
 * QUARANTIN Service Worker
 * Handles caching of app shell for offline support.
 * Strategy: Cache-first with network fallback.
 */

const CACHE_NAME = 'quarantin-cache-v1';
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/themes.css',
  '/css/main.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/print.css',
  '/js/utils.js',
  '/js/taxData.js',
  '/js/calculator.js',
  '/js/storage.js',
  '/js/pwa.js',
  '/js/ui.js',
  '/js/unlock.js',
  '/js/history.js',
  '/js/quarterly.js',
  '/js/dashboard.js',
  '/js/export.js',
  '/js/settings.js',
  '/js/app.js',
  '/assets/logo.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

/**
 * Install event: Pre-cache all app shell files.
 * @param {ExtendableEvent} event - The install event
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW install error:', error);
      })
  );
});

/**
 * Activate event: Clean up old caches.
 * @param {ExtendableEvent} event - The activate event
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event: Serve from cache first, fall back to network.
 * Never intercept Stripe.js requests (allow network-only for CDN).
 * @param {FetchEvent} event - The fetch event
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Allow Stripe.js to always go to network (never cache external CDN)
  if (url.hostname === 'js.stripe.com' || url.hostname === 'checkout.stripe.com') {
    return;
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Cache the newly fetched resource
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
      })
  );
});
