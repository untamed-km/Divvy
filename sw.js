// DistroFi Service Worker — v7
// Network-first for all navigation; static assets cached after first load.
// On every SW update, ALL old caches are wiped so stale HTML never survives.

const CACHE_NAME = 'distrofi-v6';

// Install: skip waiting immediately — take over as fast as possible
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: delete EVERY cache (including current), then claim all tabs.
// This forces a clean network fetch after every SW update.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   navigation (HTML) → always network-first
//   static assets    → cache-first, populate on miss
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  const url = new URL(event.request.url);

  // Skip caching for API / auth / analytics calls
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname === 'api.anthropic.com' ||
    url.hostname === 'formspree.io' ||
    url.hostname.includes('vercel-insights') ||
    url.pathname.startsWith('/_vercel')
  ) return;

  // Navigation requests (index.html) → network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets → cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
