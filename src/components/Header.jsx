import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [verNotificaciones, setVerNotificaciones] = useState(false);

  // === 🔔 Cargar notificaciones solo si es biomédico ===
// En Header.jsx

useEffect(() => {
  // ⚠️ AÑADE ESTA CONDICIÓN ⚠️
  if (usuario?.tipo !== "biomedico") {
    console.log("ℹ️ No es biomédico, no se suscribe a push.");
    return; // ⬅️ Salir temprano si no es biomédico
  }

  if ("serviceWorker" in navigator && "PushManager" in window) {
    Notification.requestPermission().then((permission) => {
      // ... (el resto de tu código de suscripción)
    });
  }
}, [usuario]); // ⬅️ Añade 'usuario' a las dependencias

// === REGISTRAR SERVICE WORKER ===
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((registration) => {
        console.log("✅ Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("❌ Error al registrar el Service Worker:", error);
      });
  }
}, []);

useEffect(() => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        navigator.serviceWorker.ready.then((registration) => {
          registration.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M"
              ),
            })
            .then((subscription) => {
              // ⚠️ CAMBIO AQUÍ: Envía la suscripción Y el ID del usuario
              axios.post(
                "https://monutinbackend-production.up.railway.app/api/suscribir",
                { 
                  subscription: subscription,
                  usuario_id: usuario.id // ⬅️ AÑADE ESTO
                } 
              );
              console.log("✅ Suscripción push registrada en backend");
            })
            .catch((err) =>
              console.error("❌ Error al suscribirse al Push:", err)
            );
        });
      } else {
        console.warn("⚠️ Permiso de notificación denegado o no aceptado.");
      }
    });
  }
}, []);

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

  const obtenerNotificaciones = async () => {
    try {
      const res = await axios.get("https://monutinbackend-production.up.railway.app/api/notificaciones?rol=biomedico");
      setNotificaciones(res.data);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  // === Función para marcar como leída ===
  const marcarLeida = async (id) => {
    await axios.put(`https://monutinbackend-production.up.railway.app/api/notificaciones/${id}/leida`);
    obtenerNotificaciones();
  };

  // === Redirección al inicio según tipo ===
  const irInicio = () => {
    switch (usuario?.tipo) {
      case "medico": navigate("/medico"); break;
      case "enfermera": navigate("/enfermera"); break;
      case "tecnico": navigate("/tecnico"); break;
      case "biomedico": navigate("/biomedico"); break;
      case "natural": navigate("/natural"); break;
      default: navigate("/");
    }
  };

  // === Cerrar sesión ===
  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  // === Prefijo según tipo ===
  let prefijo = "";
  switch (usuario?.tipo) {
    case "medico": prefijo = "Dr."; break;
    case "enfermera": prefijo = "Enf."; break;
    case "tecnico": prefijo = "Tec."; break;
    case "biomedico": prefijo = "Ing."; break;
    default: prefijo = "";
  }

  // Si no hay usuario, solo muestra el logo
  if (!usuario) {
    return (
      <div className="header-container">
        <img
          src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
          alt="Logo Monutin"
          className="header-logo"
          onClick={() => navigate("/")}
        />
      </div>
    );
  }

  // === Render principal ===
  return (
    <header className="header-container">
      {/* Flecha atrás */}
      <div className="header-back" onClick={() => navigate(-1)}>←</div>

      {/* Logo principal */}
      <img
        src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
        alt="Logo Monutin"
        className="header-logo"
        onClick={irInicio}
      />

      {/* Contenedor derecho */}
      <div className="header-right">
        {/* 🔔 Notificaciones (solo biomédico) */}
        {usuario.tipo === "biomedico" && (
          <div className="notif-container">
            <span className="notif-icon" onClick={() => setVerNotificaciones(!verNotificaciones)}>🔔</span>
            {notificaciones.filter(n => n.estado === "no_leido").length > 0 && (
              <span className="notif-count">
                {notificaciones.filter(n => n.estado === "no_leido").length}
              </span>
            )}

            {/* Lista desplegable */}
            {verNotificaciones && (
              <div className="notif-dropdown">
                {notificaciones.length === 0 ? (
                  <p className="notif-empty">Sin notificaciones</p>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.estado}`}
                      onClick={() => marcarLeida(n.id)}
                    >
                      {n.mensaje}
                      <span className="notif-fecha">
                        {new Date(n.fecha).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Nombre */}
        <div className="header-user" onClick={() => navigate("/ajustes")}>
          {prefijo} {usuario.apellidopaterno || usuario.usuario}
        </div>

        {/* Botón menú */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        {/* Menú desplegable */}
        <nav className={`menu ${menuOpen ? "active" : ""}`}>
          <button onClick={irInicio} className="menu-btn">Inicio</button>
          <button onClick={() => navigate("/ajustes")} className="menu-btn">Ajustes</button>
          <button onClick={cerrarSesion} className="menu-btn">Cerrar sesión</button>
          <button
            onClick={() => document.body.classList.toggle("dark-mode")}
            style={{
              background: "none",
              border: "none",
              color: "#00BFA6",
              fontSize: "1.2em",
              cursor: "pointer"
            }}
          >
            🌙
          </button>
        </nav>
      </div>
    </header>
  );
}
