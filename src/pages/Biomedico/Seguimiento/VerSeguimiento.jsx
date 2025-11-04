import { useNavigate } from "react-router-dom"; // 🔺 Importar useNavigate
import Header from "../../../components/Header";
import React, { useEffect, useState } from "react";
import "../../../App.css";
import axios from "axios";
// ====== GRAFICOS (Recharts) ======
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// 🔔 --- INICIO CÓDIGO DE NOTIFICACIONES PUSH --- 🔔

// 🗝️ Tu Clave VAPID Pública (del backend)
const VAPID_PUBLIC_KEY =
  "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M";

/**
 * Convierte la clave VAPID de Base64 (URL-safe) a un Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Envía la suscripción al backend.
 * @param {number} usuario_id - ID del usuario a asociar.
 * @param {PushSubscription} subscription - El objeto de suscripción.
 */
const sendSubscriptionToBackend = (usuario_id, subscription) => {
  return axios
    .post(
      "https://monutinbackend-production.up.railway.app/api/suscribir",
      {
        usuario_id: usuario_id, // ID del usuario
        subscription: subscription, // Objeto de suscripción
      }
    )
    .then((res) => {
      console.log("✅ Suscripción guardada en el backend.");
    })
    .catch((err) => {
      console.error("❌ Error al guardar suscripción en backend:", err);
    });
};

/**
 * Suscribe al usuario a las notificaciones push.
 * @param {number} usuario_id - ID del usuario logueado.
 */
const subscribeUserToPush = (usuario_id) => {
  navigator.serviceWorker.ready
    .then((registration) => {
      // Opciones de suscripción
      const subscribeOptions = {
        userVisibleOnly: true, // Requerido
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      };
      
      // Intentar suscribir
      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then((pushSubscription) => {
      console.log("Recibida PushSubscription: ", pushSubscription);
      
      // Enviar al backend para guardar
      sendSubscriptionToBackend(usuario_id, pushSubscription);
    })
    .catch((err) => {
      // Manejar errores comunes
      if (Notification.permission === 'denied') {
        console.warn('Permiso de notificaciones denegado por el usuario.');
      } else {
        console.error("❌ Falló la suscripción push: ", err);
      }
    });
};
export default function VerSeguimiento() {
  const [equipos, setEquipos] = useState([]);
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const navigate = useNavigate(); // 🔺 Hook para navegar

  // Cargar lista de seguimiento
  useEffect(() => {
    if (!usuario) return;

    axios
      .get(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`
      )
      .then((res) => {
        // Corrección: Asegurarse de que sea un array (como en la versión anterior)
        const lista = res.data?.data || res.data;
        if (Array.isArray(lista)) {
          setEquipos(lista);
        } else {
          console.warn("La respuesta de la API no era un array:", res.data);
          setEquipos([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error al cargar equipos en seguimiento:", err);
        setEquipos([]);
      });
  }, [usuario?.id]);
  // 🔔 --- useEffect para pedir permiso de Notificación --- 🔔
  useEffect(() => {
    // Solo se ejecuta si tenemos un usuario logueado
    if (usuario && usuario.id) {
      // 1. Verificar si el navegador soporta Service Worker y Push
      if ("serviceWorker" in navigator && "PushManager" in window) {
        
        // 2. Pedir permiso al usuario
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Permiso de notificación concedido.");
            // 3. Suscribir al usuario
            subscribeUserToPush(usuario.id);
          } else {
            console.warn("Permiso de notificación denegado.");
          }
        });
      } else {
        console.warn("Push Notifications no son soportadas en este navegador.");
      }
    }
  }, [usuario]); // Depende del objeto 'usuario'

  // Apagar alarma (simulado)
  const apagarAlarma = (nombre) => {
    alert(`🔇 Señal enviada para apagar la alarma del equipo: ${nombre}`);
  };

  // Cambiar estado (MODIFICADO para usar query params)
  const toggleEstado = async (id) => {
    const equipo = equipos.find((eq) => eq.id === id);
    if (!equipo) return;
const nuevoEstado = equipo.estado === "bueno" ? "mantenimiento" : "bueno";

    try {
      await axios.put(
        `https://monutinbackend-production.up.railway.app/api/equipos/${id}`,
        { estado: nuevoEstado } // Envía el nuevo estado en el body
      );

      const nuevaLista = equipos.map((eq) => eq.id === id ? { ...eq, estado: nuevoEstado } : eq);setEquipos(nuevaLista);alert(`✅ Estado del equipo cambiado a "${nuevoEstado}".`);

    } catch (error) {
      console.error("❌ Error al actualizar estado:", error);alert("Error al actualizar el estado del equipo.");
    }
  };

  // Quitar del seguimiento (MODIFICADO - ¡ESTA ES LA SOLUCIÓN AL ERROR!)
  const quitar = async (id) => {
    const equipo = equipos.find((eq) => eq.id === id);
    if (equipo.estado === "mantenimiento") {
      alert("⚠️ No se puede quitar un equipo mientras está en mantenimiento.");
      return;
    }

    try {
      // 🔺 SOLUCIÓN: Usar Query Params en lugar de 'data' (body) para DELETE.
      // El backend (API) a menudo no lee el 'body' en peticiones DELETE.
      await axios.delete(`https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}/${id}`);

      // Actualizar el estado local (Optimistic UI)
      const nuevaLista = equipos.filter((eq) => eq.id !== id);
      setEquipos(nuevaLista);

      alert("🗑️ Equipo eliminado del seguimiento.");
    } catch (error) {
      // Este error ocurre si la API falla (ej: 404, 500, o si la URL está mal)
      console.error("❌ Error al quitar equipo:", error);
      alert("Error al quitar el equipo del seguimiento.");
    }
  };

  // --- 🔺 NUEVAS FUNCIONES DE BOTONES ---

const descargarFicha = (id) => {
    console.log(`Solicitando PDF para equipo ID: ${id}`);
    
    // ⬇️ ESTA ES LA LÍNEA CLAVE ⬇️
    // Llama directamente a la URL del backend. El navegador gestionará la descarga.
    const url = `https://monutinbackend-production.up.railway.app/api/fichatecnica/${id}/pdf`;
    window.open(url, '_blank');
  };

  const descargarMantenimiento = (id) => {
    alert(`📥 Iniciando descarga de hoja de mantenimiento del equipo ${id}...`);
    // window.open(`https://.../api/equipos/${id}/mantenimiento.pdf`, '_blank');
  };

  const actualizarMantenimiento = (id) => {
    // Esto probablemente debería navegar a una nueva página o abrir un modal
    // para subir un archivo o llenar un formulario.
    alert(`🛠️ Abriendo editor de mantenimiento para equipo ${id}...`);
    // Ejemplo de navegación:
    // navigate(`/equipos/${id}/actualizar-mantenimiento`);
  };

  // --- Fin Nuevas Funciones ---

  // Función de datos simulados (sin cambios)
  const generarDatosSensores = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      time: i,
      temp: 36 + Math.random(),
      humedad: 40 + Math.random() * 10,
      peso: 3 + Math.random() * 0.5,
      tempBebe: 36.5 + Math.random() * 0.5,
    }));
  };

  return (
    <div>
      <Header />
      <div className="seguimiento-container" style={{ padding: "20px" }}>
        <h1>🩺 Monitoreo y Seguimiento de Equipos</h1>

        {equipos.length === 0 ? (
          <p>No hay equipos en seguimiento actualmente.</p>
        ) : (
          equipos.map((eq) => (
            <div
              key={eq.id}
              style={{
                marginBottom: "25px",
                padding: "20px",
                borderRadius: "12px",
                background: "#f1fdfb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ color: "#00796b" }}>{eq.nombre}</h2>
              
              {/* 🔺 SOLUCIÓN IMAGEN: Cambiado de eq.imagen a eq.imagen_base64 */}
              {/* Tu API (GET /api/seguimiento/:id) DEBE devolver este campo */}
              {eq.imagen_base64 ? (
                <img
                  src={eq.imagen_base64} 
                  alt={eq.nombre}
                  style={{
                    width: "250px",
                    height: "150px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              ) : (
                <div style={{
                  width: "250px",
                  height: "150px",
                  background: "#e0f2f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00796b",
                  borderRadius: "8px",
                  marginBottom: "10px"
                }}>
                  📷 Sin imagen
                </div>
              )}

              <p><b>Marca:</b> {eq.marca}</p>
              <p><b>Modelo:</b> {eq.modelo}</p>
              <p><b>Ubicación:</b> {eq.ubicacion}</p>
              <p><b>Tipo:</b> {eq.tipo}</p>
              <p>
                <b>Estado:</b>{" "}
                <span
                  style={{
                    color:
                      eq.estado === "mantenimiento" ? "#c62828" : "#00796b",
                    fontWeight: "bold",
                  }}
                >
                  {eq.estado === "mantenimiento"
                    ? "En mantenimiento ⚠️"
                    : "Operativo ✅"}
                </span>
              </p>

              <div className="botones-seguimiento">
                {/* Botones de Control */}
                <button
                  className="btn-control rojo"
                  onClick={() => apagarAlarma(eq.nombre)}
                >
                  🔕 Apagar alarma
                </button>

                <button
                  className="btn-control verde"
                  onClick={() => toggleEstado(eq.id)}
                >
                  {eq.estado === "mantenimiento"
                    ? "✅ Marcar como operativo"
                    : "🛠️ Marcar en mantenimiento"}
                </button>

                <button
                  className="btn-control gris"
                  disabled={eq.estado === "mantenimiento"}
                  onClick={() => quitar(eq.id)}
                >
                  ❌ Quitar del seguimiento
                </button>
              </div>

              {/* 🔺 NUEVOS BOTONES (DOCUMENTOS) 🔺 */}
              <div className="botones-seguimiento" style={{ marginTop: "10px" }}>
                <button
                  className="btn-control azul" // Necesitarás CSS para .azul
                  onClick={() => descargarFicha(eq.id)}
                >
                  📄 Descargar Ficha Técnica
                </button>

                <button
                  className="btn-control azul"
                  onClick={() => descargarMantenimiento(eq.id)}
                >
                  📥 Descargar Hoja Mantenimiento
                </button>

                <button
                  className="btn-control naranja" // Necesitarás CSS para .naranja
                  onClick={() => actualizarMantenimiento(eq.id)}
                >
                  📤 Actualizar Hoja Mantenimiento
                </button>
              </div>


              <div className="chart-box" style={{ marginTop: "20px" }}>
                <h4>🌡️ Temp Externa (°C) vs 💧 Humedad (%)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generarDatosSensores()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="red"
                      name="Temp Ext"
                    />
                    <Line
                      type="monotone"
                      dataKey="humedad"
                      stroke="blue"
                      name="Humedad"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Información extra (sin cambios) */}
              <div style={{ marginTop: "10px" }}>
                <h4>⚙️ Datos Técnicos</h4>
                {Array.isArray(eq.datos_tecnicos) &&
                eq.datos_tecnicos.length > 0 ? (
                  <ul>
                    {eq.datos_tecnicos.map((dt, i) => (
                      <li key={i}>
                        {dt.funcion}: {dt.info}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay datos técnicos registrados.</p>
                )}

                <h4>🔌 Accesorios</h4>
                {Array.isArray(eq.accesorios) && eq.accesorios.length > 0 ? (
                  <ul>
                    {eq.accesorios.map((acc, i) => (
                      <li key={i}>
                        {acc.funcion}: {acc.info}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay accesorios registrados.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}