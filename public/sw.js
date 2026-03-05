const CACHE_NAME = 'istimewaku-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
  '/admin/dashboard',
  '/admin/students',
  '/admin/parents',
  '/admin/teachers',
  '/parent/dashboard',
  '/parent/my-children',
  '/parent/login',
  '/parent/register',
  '/login-admin',
  '/penyumbang-bahan',
  '/motivasi',
  '/assets/index.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/screenshots/desktop-home.png',
  '/screenshots/desktop-dashboard.png',
  '/screenshots/mobile-home.png',
  '/screenshots/mobile-dashboard.png',
]

// Assets to cache when visited
const DYNAMIC_CACHE_URLS = ['/api/', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com']

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      }),
      // Immediately activate the new service worker
      self.skipWaiting(),
    ]),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      }),
      // Take control of all pages immediately
      self.clients.claim(),
    ]),
  )
})

self.addEventListener('fetch', (event) => {
  // --- Add this check ---
  // Don't intercept POST requests or requests to Supabase API
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    // Let the browser handle it directly
    return
  }
  // --- End of check ---

  // HTML navigation
  if (
    event.request.mode === 'navigate' ||
    (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Ensure OFFLINE_URL is cached during install
        return caches.match(OFFLINE_URL)
      }),
    )
    return
  }

  // Images - Cache first, network fallback
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            // Check if the response is valid before caching
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse
            }
            const responseToCache = fetchResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
            return fetchResponse
          })
        )
      }),
    )
    return
  }

  // Other GET assets - Network first, cache fallback
  // This strategy is applied because we already filtered out non-GET requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          // Double check it's GET
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed, try the cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Specific fallback for documents (already handled by navigate, but as a safeguard)
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL)
          }
          // Generic fallback for other failed assets (optional)
          // Avoid returning a generic error for API calls etc.
          // Consider what makes sense for your app if assets fail to load
          // return new Response('Resource not available offline', {
          //   status: 404,
          //   headers: { 'Content-Type': 'text/plain' },
          // });
        })
      }),
  )
})

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(
      // Process any stored form submissions
      self.registration.sync.register('sync-forms'),
    )
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url,
      },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
