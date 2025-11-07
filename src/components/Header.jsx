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

  // === REGISTRAR SERVICE WORKER (Una sola vez) ===
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

  // === 🔔 SUSCRIPCIÓN PUSH (SOLO BIOMÉDICOS) ===
  useEffect(() => {
    // ⚠️ VERIFICAR TIPO DE USUARIO PRIMERO
    if (usuario?.tipo !== "biomedico") {
      console.log("ℹ️ Usuario no es biomédico, no se suscribe a push.");
      return;
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("✅ Permiso de notificación concedido");
          
          navigator.serviceWorker.ready.then((registration) => {
            // Verificar si ya hay una suscripción
            registration.pushManager.getSubscription().then((existingSub) => {
              if (existingSub) {
                console.log("✅ Ya existe una suscripción activa");
                return;
              }

              // Crear nueva suscripción
              registration.pushManager
                .subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(
                    "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M"
                  ),
                })
                .then((subscription) => {
                  console.log("📢 Enviando suscripción al backend...", subscription);
                  
                  // Enviar al backend
                  axios
                    .post(
                      "https://monutinbackend-production.up.railway.app/api/suscribir",
                      {
                        subscription: subscription,
                        usuario_id: usuario.id,
                      }
                    )
                    .then(() => {
                      console.log("✅ Suscripción push registrada en backend");
                    })
                    .catch((err) => {
                      console.error("❌ Error al enviar suscripción:", err);
                    });
                })
                .catch((err) => {
                  console.error("❌ Error al crear suscripción push:", err);
                });
            });
          });
        } else {
          console.warn("⚠️ Permiso de notificación denegado");
        }
      });
    } else {
      console.warn("⚠️ Push API no soportada en este navegador");
    }
  }, [usuario]); // ⬅️ Se ejecuta cuando cambia el usuario

  // Función auxiliar para convertir clave VAPID
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // === 🔔 Cargar notificaciones (solo biomédico) ===
  useEffect(() => {
    if (usuario?.tipo === "biomedico") {
      obtenerNotificaciones();
      const interval = setInterval(obtenerNotificaciones, 30000); // Cada 30s
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const obtenerNotificaciones = async () => {
    try {
      const res = await axios.get(
        "https://monutinbackend-production.up.railway.app/api/notificaciones?rol=biomedico"
      );
      setNotificaciones(res.data);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  const marcarLeida = async (id) => {
    await axios.put(
      `https://monutinbackend-production.up.railway.app/api/notificaciones/${id}/leida`
    );
    obtenerNotificaciones();
  };

  // === Redirección al inicio según tipo ===
  const irInicio = () => {
    switch (usuario?.tipo) {
      case "medico":
        navigate("/medico");
        break;
      case "enfermera":
        navigate("/enfermera");
        break;
      case "tecnico":
        navigate("/tecnico");
        break;
      case "biomedico":
        navigate("/biomedico");
        break;
      case "natural":
        navigate("/natural");
        break;
      default:
        navigate("/");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  // Prefijo según tipo
  let prefijo = "";
  switch (usuario?.tipo) {
    case "medico":
      prefijo = "Dr.";
      break;
    case "enfermera":
      prefijo = "Enf.";
      break;
    case "tecnico":
      prefijo = "Tec.";
      break;
    case "biomedico":
      prefijo = "Ing.";
      break;
    default:
      prefijo = "";
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

  return (
    <header className="header-container">
      <div className="header-back" onClick={() => navigate(-1)}>
        ←
      </div>

      <img
        src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
        alt="Logo Monutin"
        className="header-logo"
        onClick={irInicio}
      />

      <div className="header-right">
        {/* 🔔 Notificaciones (solo biomédicdo) */}
        {usuario.tipo === "biomedico" && (
          <div className="notif-container">
            <span
              className="notif-icon"
              onClick={() => {
                setVerNotificaciones(!verNotificaciones);
                obtenerNotificaciones();
              }}
            >
              🔔
            </span>
            {notificaciones.filter((n) => n.estado === "no_leido").length > 0 && (
              <span className="notif-count">
                {notificaciones.filter((n) => n.estado === "no_leido").length}
              </span>
            )}

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
                        {new Date(n.fecha).toLocaleString("es-BO", {
                          timeZone: "America/La_Paz",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="header-user" onClick={() => navigate("/ajustes")}>
          {prefijo} {usuario.apellidopaterno || usuario.usuario}
        </div>

        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        <nav className={`menu ${menuOpen ? "active" : ""}`}>
          <button onClick={irInicio} className="menu-btn">
            Inicio
          </button>
          <button onClick={() => navigate("/ajustes")} className="menu-btn">
            Ajustes
          </button>
          <button onClick={cerrarSesion} className="menu-btn">
            Cerrar sesión
          </button>
          <button
            onClick={() => document.body.classList.toggle("dark-mode")}
            style={{
              background: "none",
              border: "none",
              color: "#00BFA6",
              fontSize: "1.2em",
              cursor: "pointer",
            }}
          >
            🌙
          </button>
        </nav>
      </div>
    </header>
  );
}