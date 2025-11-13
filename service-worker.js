/* =============================
   Monutin Service Worker
   ============================= */

// 🧱 Cache básico (para offline)
const CACHE_NAME = "monutin-cache-v1";
const urlsToCache = ["./", "./index.html", "./manifest.json"];

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
// =============================
// 🔔 Notificaciones Push mejoradas
// =============================
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "🔔 Notificación Monutin";
  const options = {
    body: data.body || "Nuevo evento detectado en el sistema.",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    requireInteraction: true, // 🔹 La notificación permanece visible
    data: {
      url: data.url || "/", // Redirigir al hacer clic
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 🔹 Redirigir al hacer clic
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
