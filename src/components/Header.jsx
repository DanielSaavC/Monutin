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

  // ============================
  // 🔔 CARGA DE NOTIFICACIONES
  // ============================
  useEffect(() => {
    if (!usuario) return;

    // 🔹 Biomédico → recibe todas las alarmas
    if (usuario.tipo === "biomedico") {
      obtenerNotificacionesBiomedico();
      const intervalo = setInterval(obtenerNotificacionesBiomedico, 10000);
      return () => clearInterval(intervalo);
    }

    // 🔹 Técnico → recibe SOLO delegaciones dirigidas a él
    if (usuario.tipo === "tecnico") {
      obtenerNotificacionesTecnico();
      const intervalo = setInterval(obtenerNotificacionesTecnico, 10000);
      return () => clearInterval(intervalo);
    }

    // 🔹 Enfermera → no carga nada
  }, [usuario]);

  // ============================
  // 📩 FUNCIONES NOTIFICACIONES
  // ============================
  const obtenerNotificacionesBiomedico = async () => {
    try {
      const res = await axios.get(
        `https://monutinbackend-production.up.railway.app/api/notificaciones?rol=biomedico`
      );
      setNotificaciones(res.data);
    } catch (error) {
      console.error("Error al cargar notificaciones biomédico:", error);
    }
  };

  const obtenerNotificacionesTecnico = async () => {
    try {
      const res = await axios.get(
        `https://monutinbackend-production.up.railway.app/api/notificaciones_tecnico/${usuario.id}`
      );
      setNotificaciones(res.data);
    } catch (error) {
      console.error("Error al cargar notificaciones técnico:", error);
    }
  };

  const marcarLeida = async (id) => {
    await axios.put(
      `https://monutinbackend-production.up.railway.app/api/notificaciones/${id}/leida`
    );
    if (usuario.tipo === "biomedico") obtenerNotificacionesBiomedico();
    if (usuario.tipo === "tecnico") obtenerNotificacionesTecnico();
  };

  // ============================
  // 🏠 REDIRECCIÓN POR ROL
  // ============================
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

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

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

  // ============================
  // RENDER PRINCIPAL
  // ============================
  return (
    <header className="header-container">
      {/* Flecha atrás */}
      <div className="header-back" onClick={() => navigate(-1)}>
        ←
      </div>

      {/* Logo */}
      <img
        src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
        alt="Logo Monutin"
        className="header-logo"
        onClick={irInicio}
      />

      <div className="header-right">
        {/* ==========================================
           🔔 NOTIFICACIONES SOLO PARA:
           - BIOMÉDICO
           - TÉCNICO (solo delegadas)
        ========================================== */}
        {(usuario.tipo === "biomedico" || usuario.tipo === "tecnico") && (
          <div className="notif-container">
            <span
              className="notif-icon"
              onClick={() => setVerNotificaciones(!verNotificaciones)}
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
                      onClick={() => {
                        marcarLeida(n.id);
                        setNotificacionSeleccionada(n);
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

        {/* Nombre usuario */}
        <div className="header-user" onClick={() => navigate("/ajustes")}>
          {prefijo} {usuario.apellidopaterno || usuario.usuario}
        </div>

        {/* Botón menú */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        {/* Menú */}
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
        </nav>

        {/* ================================
           🧾 PANEL DETALLE NOTIFICACIÓN
           ================================= */}
        {notificacionSeleccionada && (
          <div className="notif-panel">
            <div className="notif-panel-content">
              <h3>Reporte de enfermería</h3>
              <p>
                <strong>Mensaje:</strong> {notificacionSeleccionada.mensaje}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(notificacionSeleccionada.fecha).toLocaleString("es-BO")}
              </p>

              {/* SOLO EL BIOMÉDICO PUEDE DELEGAR */}
              {usuario.tipo === "biomedico" &&
                !notificacionSeleccionada.delegando && (
                  <div className="notif-panel-buttons">
                    <button
                      className="delegar-btn"
                      onClick={async () => {
                        try {
                          const res = await axios.get(
                            "https://monutinbackend-production.up.railway.app/api/tecnicos"
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

              {/* Selección de técnico */}
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
                          alert("⚠️ Debes seleccionar un técnico.");
                          return;
                        }

                        try {
                          // Guardar delegación
                          await axios.post(
                            "https://monutinbackend-production.up.railway.app/api/delegar",
                            {
                              notificacion_id: notificacionSeleccionada.id,
                              tecnico_id:
                                notificacionSeleccionada.tecnicoSeleccionado,
                              biomedico_id: usuario.id,
                            }
                          );

                          // Notificar al técnico
                          await axios.post(
                            "https://monutinbackend-production.up.railway.app/api/notificaciones",
                            {
                              mensaje:
                                "Se te ha delegado un equipo para revisión: " +
                                notificacionSeleccionada.mensaje,
                              usuario_id:
                                notificacionSeleccionada.tecnicoSeleccionado,
                              rol_destino: "tecnico",
                            }
                          );

                          alert("✅ Reporte delegado correctamente.");
                          setNotificacionSeleccionada(null);
                          obtenerNotificacionesBiomedico();
                        } catch (err) {
                          alert("❌ Error al delegar: " + err.message);
                        }
                      }}
                    >
                      ✅ Confirmar
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
