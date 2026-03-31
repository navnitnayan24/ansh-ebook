// ANSH EBOOK - Smart Service Worker v5
// Strategy: NETWORK-FIRST for ALL requests
// This guarantees users ALWAYS get the latest code after deployment.

const CACHE_VERSION = 'ansh-ebook-v5';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Only cache icons/manifest for offline splash screen
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-ansh.png'
];

// ─── INSTALL ───────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting(); // Immediately activate
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Precache failed (non-fatal):', err);
      });
    })
  );
});

// ─── ACTIVATE ──────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH — NETWORK-FIRST for everything ──────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin and API calls entirely (never cache)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // NETWORK-FIRST: Always try fresh version, fallback to cache only offline
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache a copy for offline fallback
        if (response.ok) {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(request);
      })
  );
});
