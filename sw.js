const CACHE_NAME = 'trendforge-cache-v3'; // Incremented version to clear old cache

// 1. Tell the worker exactly what assets it must save for offline use
const urlsToCache = [
  '/',
  '/landing.css',
  '/api.js',       // Added leading slash for safety
  '/ui.js',        // Added leading slash for safety
  '/static/manifest.json',    // Fixed path to your static folder
  '/static/icon-192x192.png', // Fixed path to your static folder
  '/static/icon-512x512.png'  // Fixed path to your static folder
];


// Install Event: Save everything to the browser cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching essential assets...');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear old cache versions automatically
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first falling back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests (like POST requests for AI forms/login)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network works, duplicate the response into cache for later
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), pull file from cache
        return caches.match(event.request);
      })
  );
});