/**
 * Service Worker - Aggressive caching strategy
 * Caches all assets and API responses for maximum performance
 */

const CACHE_NAME = "deradar-v1.0"
const RUNTIME_CACHE = "deradar-runtime"

// Assets to cache immediately
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/data/airlines.json",
]

// Install event - precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, then cache
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // For API requests, use network first, fallback to cache
  if (request.url.includes("/api/") || request.url.includes("aircraft.json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache on network error
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached
            }
            // Return offline response if no cache
            return new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            })
          })
        })
    )
    return
  }

  // For static assets, cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
    })
  )
})
