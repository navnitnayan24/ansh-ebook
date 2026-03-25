// ANSH EBOOK - Smart Service Worker v3
// Strategy: Network-First for HTML/API, Cache-First for static assets
// This prevents the blank screen issue caused by stale cache after new deployments.

const CACHE_VERSION = 'ansh-ebook-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = '/';

// Only cache truly static assets (icons, fonts, manifest)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-ansh.png'
];

// ─── INSTALL ───────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  // Immediately activate the new service worker — don't wait for old one to finish
  self.skipWaiting();
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
    }).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

// ─── FETCH ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests (APIs, CDN, etc)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Skip API calls — always go to network for these
  if (url.pathname.startsWith('/api/')) return;

  // For HTML pages — use Network-First
  // This ensures users always get the latest code after a deployment
  if (request.headers.get('accept')?.includes('text/html') || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache a copy of the successful response
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => {
          // Offline fallback — serve cached version if available
          return caches.match(request) || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For JS/CSS/Images — Stale-While-Revalidate
  // Serves from cache immediately, but updates cache in background
  event.respondWith(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const networkFetch = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse); // Offline: return cached

        return cachedResponse || networkFetch;
      });
    })
  );
});
