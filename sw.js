const CACHE = "fastfood-omnia-v1";
const SHELL = ["./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Solo cachea la cáscara de la app. Los datos (menú, pedidos, verificación
// de licencia) siempre van en vivo al Control Maestro o al Sheet del
// cliente — nunca se sirven desde caché.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // deja pasar llamadas externas (Apps Script) sin tocar
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
