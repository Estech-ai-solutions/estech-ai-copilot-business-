// Service Worker for Estech AI PWA
// Provides offline caching and network resilience

const CACHE_NAME = 'estech-ai-v1';
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/leads',
  '/responses',
  '/documents',
  '/knowledge',
  '/tasks',
  '/content',
  '/analytics',
  '/assistant',
  '/settings',
  '/profile',
  '/manifest.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigate requests - serve from cache or fallback to offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Static assets - cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});