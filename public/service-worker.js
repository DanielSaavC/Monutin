/* =============================
   Monutin Service Worker
   Versión: 2.0
   ============================= */

const CACHE_NAME = "monutin-cache-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json"
];

// =============================
// 🔧 INSTALACIÓN
// =============================
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker: Instalando...");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("✅ Service Worker: Cache abierto");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("✅ Service Worker: Instalación completada");
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker: Error en instalación:", error);
      })
  );
});

// =============================
// 🚀 ACTIVACIÓN
// =============================
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activando...");
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Service Worker: Eliminando cache antiguo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker: Activado y listo");
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("❌ Service Worker: Error en activación:", error);
      })
  );
});

// =============================
// 🌐 INTERCEPTAR PETICIONES
// =============================
self.addEventListener("fetch", (event) => {
  // Ignorar peticiones al backend
  if (event.request.url.includes("monutinbackend-production.up.railway.app")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver de cache si existe, si no, hacer fetch
        return response || fetch(event.request);
      })
      .catch(() => {
        // Si falla todo, devolver página offline (opcional)
        return caches.match("./index.html");
      })
  );
});

// =============================
// 🔔 NOTIFICACIONES PUSH
// =============================
self.addEventListener("push", (event) => {
  console.log("📬 Service Worker: Push recibido");
  
  let data = {};
  
  // Parsear datos del push
  if (event.data) {
    try {
      data = event.data.json();
      console.log("📦 Datos del push:", data);
    } catch (e) {
      console.error("❌ Error al parsear datos del push:", e);
      data = {
        title: "Notificación Monutin",
        body: event.data.text() || "Nueva notificación"
      };
    }
  }

  const title = data.title || "🔔 Monutin";
  const options = {
    body: data.body || "Nueva notificación del sistema",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    requireInteraction: true,
    tag: data.tag || "monutin-notification",
    data: {
      url: data.url || "/",
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("✅ Service Worker: Notificación mostrada");
      })
      .catch((error) => {
        console.error("❌ Service Worker: Error al mostrar notificación:", error);
      })
  );
});

// =============================
// 👆 CLIC EN NOTIFICACIÓN
// =============================
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Service Worker: Click en notificación");
  
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ 
      type: "window", 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      // Buscar si ya hay una ventana abierta con la app
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          console.log("✅ Service Worker: Enfocando ventana existente");
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        console.log("✅ Service Worker: Abriendo nueva ventana");
        return clients.openWindow(targetUrl);
      }
    })
    .catch((error) => {
      console.error("❌ Service Worker: Error al manejar clic:", error);
    })
  );
});

// =============================
// 🔕 CIERRE DE NOTIFICACIÓN
// =============================
self.addEventListener("notificationclose", (event) => {
  console.log("🔕 Service Worker: Notificación cerrada");
});

// =============================
// 📨 MENSAJE DESDE LA APP
// =============================
self.addEventListener("message", (event) => {
  console.log("📨 Service Worker: Mensaje recibido:", event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("✅ Service Worker: Script cargado correctamente");