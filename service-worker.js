/* =============================
   Monutin Service Worker
   ============================= */

// 🧱 Cache básico (para offline)
const CACHE_NAME = "monutin-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Instalar SW
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar SW
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});

// =============================
// 🔔 Notificaciones Push
// =============================
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Alerta Monutin";
  const options = {
    body: data.body || "Nuevo evento detectado",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    sound: "/alerta.mp3" // opcional
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
