const CACHE_NAME = "ironlung-analyzer-v5";
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
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstPage(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(fromScope("index.html"))))
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    await cache.put(fromScope("index.html"), response.clone());
    return response;
  } catch {
    return await caches.match(fromScope("index.html")) || await caches.match(fromScope("./"));
  }
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const results = [];
  for (const url of APP_SHELL) {
    try {
      await cache.add(url);
      results.push({ status: "fulfilled" });
    } catch {
      results.push({ status: "rejected" });
    }
  }
  if (results[0] && results[0].status === "rejected" && results[1] && results[1].status === "rejected") {
    throw new Error("IronLung Analyzer shell could not be cached.");
  }
}
