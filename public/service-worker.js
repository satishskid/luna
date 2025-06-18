
const CACHE_NAME = 'luna-ai-journal-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx', // Assuming this is the main entry point processed by the browser
  '/manifest.json',
  // External assets
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  // Add paths to your actual icon files here if you want them precached, e.g.:
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png' // If you create one for apple-touch-icon
];

// URLs for esm.sh modules used in importmap (add more if you use others directly in JS)
const ESM_CDN_ASSETS = [
  "https://esm.sh/react@^19.1.0",
  "https://esm.sh/react@^19.1.0/",
  "https://esm.sh/react-dom@^19.1.0/",
  "https://esm.sh/@google/genai@^1.4.0"
];

const ALL_ASSETS_TO_CACHE = [...CORE_ASSETS, ...ESM_CDN_ASSETS];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching core assets');
        // Add core assets that must be available for the app shell
        // Use addAll with individual requests to avoid failure if one asset is missing
        // or network is spotty for one of them during install.
        const promises = ALL_ASSETS_TO_CACHE.map(assetUrl => {
          return cache.add(new Request(assetUrl, { mode: 'cors' })).catch(err => {
            console.warn(`Failed to cache ${assetUrl}: ${err}`);
          });
        });
        return Promise.all(promises);
      })
      .then(() => self.skipWaiting()) // Activate the new service worker immediately
      .catch(error => {
        console.error('Failed to cache core assets during install:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (HTML), try network first, then cache, then offline page (optional).
  // This ensures users get the latest HTML if online.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If successful, cache the new version
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html'); // Fallback to cached index.html
          });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images, fonts), use a cache-first strategy.
  // These assets don't change as often.
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fetch from network
        return fetch(request).then((networkResponse) => {
          // Cache the new resource for future use (only for GET requests and successful responses)
          if (request.method === 'GET' && networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return networkResponse;
        }).catch(error => {
          console.error('Fetch failed; returning offline fallback or error for:', request.url, error);
          // Optionally, return a generic fallback for images/fonts if needed
          // For now, just let the browser handle the error if network fetch fails and not in cache.
        });
      })
  );
});
