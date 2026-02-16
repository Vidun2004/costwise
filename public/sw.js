const CACHE = "costwise-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          "/",
          "/app",
          "/manifest.webmanifest",
          "/icon-192x192.png",
          "/icon-512x512.png",
          "/apple-touch-icon.png",
        ]),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))),
      ),
  );
  self.clients.claim();
});

// Navigation requests: network-first, fallback to offline
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE);
        return cache.match(OFFLINE_URL);
      }),
    );
    return;
  }

  // Static: cache-first
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
