const CACHE_PREFIX = "jarvis-hud-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const STATIC_ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

const isApiPath = (pathname) => pathname === "/api" || pathname.startsWith("/api/");

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isApiPath(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return (await caches.match("/index.html")) ||
          new Response("You are offline. Reconnect and try again.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
          });
      }
    })());
    return;
  }

  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    } catch {
      return new Response("Static asset unavailable offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
  })());
});
