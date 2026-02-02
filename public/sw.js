// Minimal service worker so Chrome can offer "Install app".
// Required for PWA installability in many contexts.
const CACHE_NAME = "dan-clean-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Let the network handle requests; we only need a fetch handler for installability.
  event.respondWith(fetch(event.request));
});
