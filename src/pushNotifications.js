// pushNotifications.js
// Sistema híbrido: Notificaciones locales + Push API

const VAPID_PUBLIC_KEY = "BMN46G7i-9iyf2NeePT20JlN8Of4NMR3_r4SW4eMQUXDihuiq2hVNGah-hmAxQDVnBeTf4M7jSuXwl7SlDVH3Dc";
const API_URL = "https://monutinbackend.onrender.com";

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
// 🔔 INICIALIZAR NOTIFICACIONES (HÍBRIDO)
// ============================================
export async function inicializarNotificacionesPush(usuario_id) {
  try {
    console.log("🔄 Iniciando sistema de notificaciones...");

    // 1. Verificar soporte
    if (!("Notification" in window)) {
      console.warn("⚠️ Este navegador no soporta notificaciones");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Workers no soportados");
      return false;
    }

    // 2. Solicitar permisos
    let permission = Notification.permission;
    
    if (permission === "default") {
      console.log("🔔 Solicitando permisos...");
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("❌ Permisos denegados");
      return false;
    }

    console.log("✅ Permisos concedidos");

    // 3. Registrar Service Worker
    let registration;
    
    try {
      registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("📝 Registrando Service Worker...");
        registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        // Esperar activación
        if (registration.installing) {
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') resolve();
            });
          });
        }
      }
      
      registration = await navigator.serviceWorker.ready;
      console.log("✅ Service Worker listo");
      
    } catch (swError) {
      console.error("❌ Error con Service Worker:", swError);
      return false;
    }

    // 4. Intentar suscripción push (opcional)
    try {
      const oldSub = await registration.pushManager.getSubscription();
      if (oldSub) {
        console.log("🗑️ Limpiando suscripción antigua...");
        await oldSub.unsubscribe();
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("🔄 Intentando crear suscripción push...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log("✅ Suscripción push creada");

      // Enviar al servidor
      const response = await fetch(`${API_URL}/api/suscribir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          usuario_id: usuario_id
        })
      });

      if (response.ok) {
        console.log("✅ Suscripción registrada en servidor");
      }

    } catch (pushError) {
      console.warn("⚠️ No se pudo crear suscripción push (se usarán notificaciones locales):", pushError.message);
      // NO fallar aquí, continuar con notificaciones locales
    }

    // 5. Configurar sistema de polling para notificaciones locales
    console.log("✅ Configurando sistema de notificaciones locales");
    iniciarSistemaDePolling(usuario_id, registration);

    // 6. Mostrar notificación de prueba
    await registration.showNotification("✅ Monutin - Sistema Activo", {
      body: "Las notificaciones están funcionando correctamente",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      tag: "test-notification"
    });

    console.log("✅ Sistema de notificaciones inicializado");
    return true;

  } catch (error) {
    console.error("❌ Error general:", error);
    return false;
  }
}

// ============================================
// 🔄 SISTEMA DE POLLING (NOTIFICACIONES LOCALES)
// ============================================
let pollingInterval = null;
let ultimaNotificacionId = 0;

function iniciarSistemaDePolling(usuario_id, registration) {
  // Limpiar polling anterior
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  console.log("🔄 Iniciando polling de notificaciones cada 15 segundos...");

  // Función para verificar nuevas notificaciones
  const verificarNotificaciones = async () => {
    try {
      // Determinar el tipo de usuario
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario) return;

      let url;
      if (usuario.tipo === "biomedico") {
        url = `${API_URL}/api/notificaciones?rol=biomedico`;
      } else if (usuario.tipo === "tecnico") {
        url = `${API_URL}/api/notificaciones_tecnico/${usuario.id}`;
      } else {
        return; // Enfermeras no reciben notificaciones push
      }

      const response = await fetch(url);
      const notificaciones = await response.json();

      // Filtrar solo las no leídas y nuevas
      const nuevas = notificaciones.filter(n => 
        n.estado === "no_leido" && n.id > ultimaNotificacionId
      );

      if (nuevas.length > 0) {
        console.log(`📬 ${nuevas.length} nueva(s) notificación(es) encontrada(s)`);

        // Mostrar cada notificación nueva
        for (const notif of nuevas) {
          await registration.showNotification("🔔 Monutin - Nueva Alerta", {
            body: notif.mensaje,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [200, 100, 200, 100, 300],
            requireInteraction: true,
            tag: `notif-${notif.id}`,
            data: {
              url: usuario.tipo === "biomedico" ? "/biomedico" : "/tecnico",
              notificacion_id: notif.id
            }
          });

          ultimaNotificacionId = Math.max(ultimaNotificacionId, notif.id);
        }
      }

    } catch (error) {
      console.error("❌ Error en polling:", error);
    }
  };

  // Primera verificación inmediata
  verificarNotificaciones();

  // Polling cada 10 segundos para alertas de sensores
  pollingInterval = setInterval(verificarNotificaciones, 10000);
}

// ============================================
// 🔕 DETENER SISTEMA DE NOTIFICACIONES
// ============================================
export function detenerNotificaciones() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("🔕 Sistema de notificaciones detenido");
  }
}

// ============================================
// 🧪 PROBAR NOTIFICACIÓN
// ============================================
export async function probarNotificacion() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification("🧪 Prueba de Notificación", {
      body: "Si ves esto, las notificaciones funcionan correctamente",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: "test-notification"
    });

    console.log("✅ Notificación de prueba mostrada");

  } catch (error) {
    console.error("❌ Error al mostrar notificación:", error);
  }
}

// ============================================
// 📋 VERIFICAR ESTADO
// ============================================
export function obtenerEstadoNotificaciones() {
  if (!("Notification" in window)) {
    return "no_soportado";
  }
  return Notification.permission;
}

export async function verificarSuscripcionActiva() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    return false;
  }
}