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
    const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);

    // === 🔔 Cargar notificaciones solo si es biomédico ===
    useEffect(() => {
      if (usuario?.tipo === "biomedico") {
        obtenerNotificaciones();
        const intervalo = setInterval(obtenerNotificaciones, 10000); // cada 10s
        return () => clearInterval(intervalo);
      }
    }, [usuario]);

// ✅ USA ESTE CÓDIGO
useEffect(() => {
  // 1. Verificamos que el usuario esté cargado Y sea biomédico
  if (usuario?.tipo === "biomedico" && "serviceWorker" in navigator && "PushManager" in window) {
    console.log("ℹ️ Usuario biomédico detectado, intentando suscribir a push...");
    
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M"
          ),
        })
        .then((subscription) => {
          
          // 2. Creamos el objeto que el backend espera
          const dataParaBackend = {
            subscription: subscription, // La suscripción anidada
            usuario_id: usuario.id      // El ID del usuario logueado
          };

          console.log("✅ Suscripción Push obtenida, enviando al backend:", dataParaBackend);

          // 3. Enviamos el objeto correcto
          axios.post(
            "https://monutinbackend-production.up.railway.app/api/suscribir",
            dataParaBackend // ⬅️ ¡CORRECTO!
          );
        })
        .catch((err) => console.error("❌ Error en suscripción push:", err));
    });
  }
// 4. Hacemos que se ejecute CADA VEZ que el 'usuario' cambie
}, [usuario]);

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
        const res = await axios.get(
          "https://monutinbackend-production.up.railway.app/api/notificaciones?rol=biomedico"
        );
        setNotificaciones(res.data);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    // === Función para marcar como leída ===
    const marcarLeida = async (id) => {
      await axios.put(
        `https://monutinbackend-production.up.railway.app/api/notificaciones/${id}/leida`
      );
      obtenerNotificaciones();
    };

    // === Redirección al inicio según tipo ===
    const irInicio = () => {
      switch (usuario?.tipo) {
        case "enfermera":
          navigate("/enfermera");
          break;
        case "tecnico":
          navigate("/tecnico");
          break;
        case "biomedico":
          navigate("/biomedico");
          break;
        default:
          navigate("/");
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
      case "enfermera":
        prefijo = "Enf.";
        break;
      case "tecnico":
        prefijo = "Tec.";
        break;
      case "biomedico":
        prefijo = "Ing.";
        break;
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
        <div className="header-back" onClick={() => navigate(-1)}>
          ←
        </div>

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
              <span
                className="notif-icon"
                onClick={() => setVerNotificaciones(!verNotificaciones)}
              >
                🔔
              </span>

              {notificaciones.filter((n) => n.estado === "no_leido").length > 0 && (
                <span className="notif-count">
                  {
                    notificaciones.filter((n) => n.estado === "no_leido")
                      .length
                  }
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
                          onClick={() => {
                            marcarLeida(n.id);
                            setNotificacionSeleccionada(n); // 👈 abre el panel con la info de esa notificación
                          }}
                        >
                        {n.mensaje}
                        <span className="notif-fecha">
                          {new Date(n.fecha).toLocaleString("es-BO")}
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
          {/* 🧾 Panel flotante de detalle de notificación */}
{notificacionSeleccionada && (
  <div className="notif-panel">
    <div className="notif-panel-content">
      <h3>Reporte de enfermería</h3>
      <p><strong>Mensaje:</strong> {notificacionSeleccionada.mensaje}</p>
      <p><strong>Fecha:</strong> {new Date(notificacionSeleccionada.fecha).toLocaleString("es-BO")}</p>

      {/* Selector de técnico */}
      {!notificacionSeleccionada.delegando && (
        <div className="notif-panel-buttons">
          <button
            className="delegar-btn"
            onClick={async () => {
              try {
                // 🔹 Traer lista de técnicos disponibles desde backend
                const res = await axios.get(
                  "https://monutinbackend-production.up.railway.app/api/usuarios?rol=tecnico"
                );
                setNotificacionSeleccionada({
                  ...notificacionSeleccionada,
                  delegando: true,
                  tecnicos: res.data,
                });
              } catch (err) {
                alert("❌ Error al cargar técnicos: " + err.message);
              }
            }}
          >
            🧰 Delegar
          </button>

          <button
            className="cerrar-btn"
            onClick={() => setNotificacionSeleccionada(null)}
          >
            ❌ Cerrar
          </button>
        </div>
      )}

      {/* Si está seleccionando un técnico */}
      {notificacionSeleccionada.delegando && (
        <div className="delegar-panel">
          <h4>Seleccionar técnico disponible</h4>
          <select
            className="delegar-select"
            onChange={(e) =>
              setNotificacionSeleccionada({
                ...notificacionSeleccionada,
                tecnicoSeleccionado: e.target.value,
              })
            }
          >
            <option value="">-- Selecciona un técnico --</option>
            {notificacionSeleccionada.tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} {t.apellidopaterno}
              </option>
            ))}
          </select>

          <div className="notif-panel-buttons">
            <button
              className="delegar-btn"
              onClick={async () => {
                if (!notificacionSeleccionada.tecnicoSeleccionado) {
                  alert("⚠️ Debes seleccionar un técnico primero.");
                  return;
                }

                try {
                  // 🔹 Enviamos la delegación al backend
                  await axios.post(
                    "https://monutinbackend-production.up.railway.app/api/delegar",
                    {
                      notificacion_id: notificacionSeleccionada.id,
                      tecnico_id: notificacionSeleccionada.tecnicoSeleccionado,
                      biomedico_id: usuario.id,
                    }
                  );

                  alert("✅ Reporte delegado al técnico correctamente.");

                  // 🔹 Crear notificación para el técnico
                  await axios.post(
                    "https://monutinbackend-production.up.railway.app/api/notificaciones",
                    {
                      mensaje: `Se te ha delegado un equipo para revisión: ${notificacionSeleccionada.mensaje}`,
                      rol: "tecnico",
                      usuario_id: notificacionSeleccionada.tecnicoSeleccionado,
                    }
                  );

                  setNotificacionSeleccionada(null);
                  obtenerNotificaciones();
                } catch (err) {
                  alert("❌ Error al delegar: " + err.message);
                }
              }}
            >
              ✅ Confirmar delegación
            </button>

            <button
              className="cerrar-btn"
              onClick={() =>
                setNotificacionSeleccionada({
                  ...notificacionSeleccionada,
                  delegando: false,
                })
              }
            >
              🔙 Atrás
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        </div>
      </header>
    );
  }
