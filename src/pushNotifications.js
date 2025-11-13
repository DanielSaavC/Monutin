// pushNotifications.js
// Utilidad para manejar notificaciones push en React

const VAPID_PUBLIC_KEY = "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M";
const API_URL = "https://monutinbackend-production.up.railway.app";

// Convertir clave VAPID a formato Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================
// 🔔 Solicitar permisos y suscribir al usuario
// ============================================
export async function inicializarNotificacionesPush(usuario_id) {
  try {
    console.log("🔄 Iniciando proceso de notificaciones push...");

    // 1. Verificar si el navegador soporta notificaciones
    if (!("Notification" in window)) {
      console.warn("⚠️ Este navegador no soporta notificaciones");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Workers no soportados");
      return false;
    }

    // 2. Solicitar permisos al usuario
    let permission = Notification.permission;
    
    if (permission === "default") {
      console.log("🔔 Solicitando permisos de notificación...");
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("❌ Permisos de notificación denegados");
      return false;
    }

    console.log("✅ Permisos de notificación concedidos");

    // 3. REGISTRAR Service Worker si no está registrado
    let registration;
    
    try {
      // Primero intenta obtener el registro existente
      registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("📝 Registrando nuevo Service Worker...");
        
        // Registrar el Service Worker
        registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        console.log("✅ Service Worker registrado correctamente");
        
        // CRUCIAL: Esperar a que se active completamente
        if (registration.installing) {
          console.log("⏳ Esperando activación del Service Worker...");
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                resolve();
              }
            });
          });
        }
      } else {
        console.log("✅ Service Worker ya registrado");
      }
      
      // Esperar a que esté completamente listo
      registration = await navigator.serviceWorker.ready;
      console.log("✅ Service Worker completamente listo");
      
    } catch (swError) {
      console.error("❌ Error con Service Worker:", swError);
      return false;
    }

    // 4. LIMPIAR suscripciones antiguas antes de crear nueva
    try {
      const oldSubscription = await registration.pushManager.getSubscription();
      
      if (oldSubscription) {
        console.log("🗑️ Eliminando suscripción antigua...");
        await oldSubscription.unsubscribe();
        console.log("✅ Suscripción antigua eliminada");
      }
    } catch (cleanError) {
      console.warn("⚠️ Error al limpiar suscripción antigua:", cleanError);
    }

    // 5. Pequeña pausa para asegurar que todo está listo
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Crear NUEVA suscripción
    console.log("🔄 Creando nueva suscripción push...");
    
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log("✅ Suscripción creada exitosamente");
      console.log("📍 Endpoint:", subscription.endpoint);
      
    } catch (subError) {
      console.error("❌ Error al crear suscripción:", subError);
      console.error("Detalles:", {
        name: subError.name,
        message: subError.message,
        code: subError.code
      });
      return false;
    }

    // 7. Enviar suscripción al servidor
    console.log("📤 Enviando suscripción al servidor...");
    
    try {
      const response = await fetch(`${API_URL}/api/suscribir`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          usuario_id: usuario_id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Suscripción registrada en servidor:", result);
      
    } catch (serverError) {
      console.error("❌ Error al registrar en servidor:", serverError);
      // Aún así retornamos true porque la suscripción local funcionó
    }

    // 8. Enviar notificación de prueba LOCAL
    console.log("🧪 Mostrando notificación de prueba...");
    await mostrarNotificacionPrueba(registration);
    
    return true;

  } catch (error) {
    console.error("❌ Error general al inicializar notificaciones:", error);
    console.error("Stack:", error.stack);
    return false;
  }
}

// ============================================
// 🧪 Mostrar notificación de prueba LOCAL
// ============================================
async function mostrarNotificacionPrueba(registration) {
  try {
    await registration.showNotification("✅ Monutin - Notificaciones Activas", {
      body: "Las notificaciones push están funcionando correctamente",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      tag: "test-notification",
      requireInteraction: false,
      data: { url: "/" }
    });
    
    console.log("✅ Notificación de prueba mostrada");
    
  } catch (error) {
    console.error("❌ Error al mostrar notificación de prueba:", error);
  }
}

// ============================================
// 🧪 Probar envío de notificación desde servidor
// ============================================
export async function probarNotificacion() {
  try {
    const response = await fetch(`${API_URL}/api/notificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🧪 Prueba desde servidor",
        body: "Esta es una notificación enviada desde el backend"
      })
    });

    if (response.ok) {
      console.log("✅ Notificación de prueba enviada desde servidor");
    } else {
      console.error("❌ Error al enviar notificación:", await response.text());
    }
  } catch (error) {
    console.error("❌ Error al probar notificación:", error);
  }
}

// ============================================
// 🔕 Desuscribirse de notificaciones
// ============================================
export async function desuscribirNotificaciones() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log("✅ Desuscrito de notificaciones push");
      return true;
    }
    
    console.log("ℹ️ No había suscripción activa");
    return false;
  } catch (error) {
    console.error("❌ Error al desuscribirse:", error);
    return false;
  }
}

// ============================================
// 📋 Verificar estado de notificaciones
// ============================================
export function obtenerEstadoNotificaciones() {
  if (!("Notification" in window)) {
    return "no_soportado";
  }
  return Notification.permission; // "granted", "denied", "default"
}

// ============================================
// 🔍 Verificar si ya hay suscripción activa
// ============================================
export async function verificarSuscripcionActiva() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log("✅ Hay suscripción activa:", subscription.endpoint);
      return true;
    }
    
    console.log("ℹ️ No hay suscripción activa");
    return false;
    
  } catch (error) {
    console.error("❌ Error al verificar suscripción:", error);
    return false;
  }
}