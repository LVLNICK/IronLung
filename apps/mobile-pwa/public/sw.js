const CACHE_NAME = "ironlung-analyzer-v3";
const fromScope = (path) => new URL(path, self.registration.scope).toString();
const APP_SHELL = [fromScope("./"), fromScope("index.html"), fromScope("manifest.webmanifest"), fromScope("icons/icon-192.svg"), fromScope("icons/icon-512.svg")];

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(fromScope("index.html"))))
  );
});

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
  if (results[0]?.status === "rejected" && results[1]?.status === "rejected") {
    throw new Error("IronLung Analyzer shell could not be cached.");
  }
}
