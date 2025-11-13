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
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("❌ Permisos de notificación denegados");
      return false;
    }

    console.log("✅ Permisos de notificación concedidos");

    // 3. Esperar a que el Service Worker esté listo
    const registration = await navigator.serviceWorker.ready;
    console.log("✅ Service Worker listo");

    // 4. Verificar si ya existe una suscripción
    let subscription = await registration.pushManager.getSubscription();

    // 5. Si no existe, crear una nueva
    if (!subscription) {
      console.log("🔄 Creando nueva suscripción...");
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log("✅ Suscripción creada:", subscription.endpoint);
    } else {
      console.log("ℹ️ Ya existe una suscripción activa");
    }

    // 6. Enviar suscripción al servidor
    const response = await fetch(`${API_URL}/api/suscribir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        usuario_id: usuario_id
      })
    });

    if (!response.ok) {
      throw new Error(`Error en servidor: ${response.status}`);
    }

    console.log("✅ Suscripción registrada en el servidor");
    return true;

  } catch (error) {
    console.error("❌ Error al inicializar notificaciones push:", error);
    return false;
  }
}

// ============================================
// 🧪 Probar envío de notificación manual
// ============================================
export async function probarNotificacion() {
  try {
    const response = await fetch(`${API_URL}/api/notificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🧪 Prueba de notificación",
        body: "Si ves esto, las notificaciones funcionan correctamente"
      })
    });

    if (response.ok) {
      console.log("✅ Notificación de prueba enviada");
    }
  } catch (error) {
    console.error("❌ Error al enviar notificación de prueba:", error);
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