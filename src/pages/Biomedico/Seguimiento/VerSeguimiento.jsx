import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../../App.css";

export default function VerSeguimiento() {
  const [equipos, setEquipos] = useState([]);

  // ✅ Cargar equipos guardados
  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];
    setEquipos(lista);
  }, []);

  // ❌ Quitar equipo
  const quitar = (id) => {
    const nuevaLista = equipos.filter((eq) => eq.id !== id);
    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(nuevaLista));
    setEquipos(nuevaLista);
  };

  // 🔕 Apagar alarma (simulado)
  const apagarAlarma = (nombre) => {
    alert(`🔇 Señal enviada para apagar la alarma de ${nombre}`);
    // Aquí luego irá tu client.publish("monutin/equipos/alarma", "OFF");
  };

  // ⚙️ Cambiar estado
  const toggleEstado = (id) => {
    const nuevaLista = equipos.map((eq) =>
      eq.id === id
        ? { ...eq, estado: eq.estado === "bueno" ? "mantenimiento" : "bueno" }
        : eq
    );
    setEquipos(nuevaLista);
    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(nuevaLista));
  };

  // 🔹 Generador de datos simulados (en vivo)
  const generarDatos = () =>
    Array.from({ length: 15 }, (_, i) => ({
      time: i,
      temp: 36 + Math.random(),
      humedad: 40 + Math.random() * 10,
      peso: 3 + Math.random() * 0.5,
      tempBebe: 36.5 + Math.random() * 0.5,
    }));

  return (
    <div>
      <Header />
      <div className="seguimiento-container" style={{ padding: "20px" }}>
        <h1>📡 Monitoreo y Seguimiento de Equipos</h1>

        {equipos.length === 0 ? (
          <p>No hay equipos en seguimiento actualmente.</p>
        ) : (
          equipos.map((eq) => (
            <div
              key={eq.id}
              style={{
                marginBottom: "30px",
                padding: "20px",
                borderRadius: "12px",
                background: "#f1fdfb",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
              }}
            >
              {/* ====== TÍTULO E IMAGEN ====== */}
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <h2>{eq.nombre}</h2>
                  <p><b>Marca:</b> {eq.marca}</p>
                  <p><b>Modelo:</b> {eq.modelo}</p>
                  <p><b>Ubicación:</b> {eq.ubicacion}</p>
                  <p><b>Tipo:</b> {eq.tipo}</p>
                  <p>
                    <b>Estado:</b>{" "}
                    <span
                      style={{
                        color: eq.estado === "bueno" ? "#00796b" : "#c62828",
                        fontWeight: "bold",
                      }}
                    >
                      {eq.estado === "bueno"
                        ? "En buenas condiciones ✅"
                        : "En mantenimiento ⚠️"}
                    </span>
                  </p>
                </div>

                {eq.imagen ? (
                  <img
                    src={eq.imagen}
                    alt={eq.nombre}
                    style={{
                      width: "250px",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "250px",
                      height: "180px",
                      background: "#e0f2f1",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "10px",
                      color: "#00bfa6",
                      fontWeight: "bold",
                    }}
                  >
                    📷 Sin imagen
                  </div>
                )}
              </div>

              {/* ====== CONTROLES ====== */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  margin: "15px 0",
                }}
              >
                <button
                  onClick={() => apagarAlarma(eq.nombre)}
                  style={{
                    background: "#ff5252",
                    color: "#fff",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🔕 Apagar alarma
                </button>

                <button
                  onClick={() => toggleEstado(eq.id)}
                  style={{
                    background: eq.estado === "bueno" ? "#ffa000" : "#00bfa6",
                    color: "#fff",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {eq.estado === "bueno"
                    ? "🛠️ Marcar en mantenimiento"
                    : "✅ Marcar como operativo"}
                </button>

                <button
                  onClick={() => quitar(eq.id)}
                  style={{
                    background: "#9e9e9e",
                    color: "#fff",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ❌ Quitar del seguimiento
                </button>
              </div>

              {/* ====== INFORMACIÓN TÉCNICA ====== */}
              <div>
                <h3>⚙️ Datos Técnicos</h3>
                {eq.datos_tecnicos && eq.datos_tecnicos.length > 0 ? (
                  <ul>
                    {eq.datos_tecnicos.map((dt, i) => (
                      <li key={i}>
                        <b>{dt.funcion}:</b> {dt.info}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No se registraron datos técnicos.</p>
                )}

                <h3>🧩 Accesorios</h3>
                {eq.accesorios && eq.accesorios.length > 0 ? (
                  <ul>
                    {eq.accesorios.map((acc, i) => (
                      <li key={i}>
                        <b>{acc.funcion}:</b> {acc.info}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No se registraron accesorios.</p>
                )}
              </div>

              {/* ====== GRÁFICOS DE SENSORES ====== */}
              {eq.sensores && (
                <div className="chart-box">
                  <h4>📈 Lecturas de sensores en tiempo real</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eq.sensores || generarDatos()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      {eq.tipo === "incubadora" && (
                        <>
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
                          <Line
                            type="monotone"
                            dataKey="tempBebe"
                            stroke="orange"
                            name="Temp Bebé"
                          />
                          <Line
                            type="monotone"
                            dataKey="peso"
                            stroke="green"
                            name="Peso"
                          />
                        </>
                      )}
                      {eq.tipo === "servocuna" && (
                        <>
                          <Line type="monotone" dataKey="temp" stroke="purple" name="Temp" />
                          <Line type="monotone" dataKey="humedad" stroke="blue" name="Humedad" />
                        </>
                      )}
                      {eq.tipo === "ventilador" && (
                        <>
                          <Line type="monotone" dataKey="presion" stroke="red" name="Presión" />
                          <Line type="monotone" dataKey="flujo" stroke="green" name="Flujo" />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
