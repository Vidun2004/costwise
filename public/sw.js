const CACHE = "costwise-v2";
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icon-64x64.png",
  "/icon-128x128.png",
  "/apple-touch-icon.png",
];

async function safeAddAll(cache, urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) await cache.put(url, res.clone());
    } catch {
      // ignore individual failures so install doesn't crash
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await safeAddAll(cache, PRECACHE_URLS);
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (k === CACHE ? null : caches.delete(k))),
      );
      self.clients.claim();
    })(),
  );
});

// Navigation: network-first, fallback to offline page
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE);
        return (
          (await cache.match("/offline")) ||
          new Response("Offline", { status: 503 })
        );
      }),
    );
    return;
  }

  // Static: cache-first when available
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
