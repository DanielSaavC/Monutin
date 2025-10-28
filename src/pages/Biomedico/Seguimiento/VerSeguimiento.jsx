import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
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

export default function VerSeguimiento() {
  const [equipos, setEquipos] = useState([]);

  // Cargar lista de seguimiento
useEffect(() => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) return;

  axios
    .get(`https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`)
    .then((res) => {
      setEquipos(res.data);
    })
    .catch((err) => {
      console.error("❌ Error al cargar equipos en seguimiento:", err);
    });
}, []);


  // Guardar cambios globales
  const actualizarLocalStorage = (nuevaLista) => {
    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(nuevaLista));
    setEquipos(nuevaLista);
  };

  // Apagar alarma (simulado)
  const apagarAlarma = (nombre) => {
    alert(`🔇 Señal enviada para apagar la alarma del equipo: ${nombre}`);
  };

  // Cambiar estado

const toggleEstado = async (id) => {
  const equipo = equipos.find((eq) => eq.id === id);
  if (!equipo) return;

  const nuevoEstado = equipo.estado === "bueno" ? "mantenimiento" : "bueno";

  try {
    // ✅ Actualiza también en el backend
await axios.post("https://monutinbackend-production.up.railway.app/api/seguimiento", {
  usuario_id: usuario.id,
  equipo_id: equipo.id,
});


    // ✅ Actualiza localmente
    const nuevaLista = equipos.map((eq) =>
      eq.id === id ? { ...eq, estado: nuevoEstado } : eq
    );

    setEquipos(nuevaLista);
    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(nuevaLista));

    alert(`✅ Estado del equipo cambiado a "${nuevoEstado}".`);
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    alert("Error al actualizar el estado del equipo.");
  }
};

  // Quitar del seguimiento (solo si está operativo)
  const quitar = (id) => {
    const equipo = equipos.find((eq) => eq.id === id);
    if (equipo.estado === "mantenimiento") {
      alert("⚠️ No se puede quitar un equipo mientras está en mantenimiento.");
      return;
    }

    const nuevaLista = equipos.filter((eq) => eq.id !== id);
    actualizarLocalStorage(nuevaLista);
  };
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
              <p><b>Marca:</b> {eq.marca}</p>
              <p><b>Modelo:</b> {eq.modelo}</p>
              <p><b>Ubicación:</b> {eq.ubicacion}</p>
              <p><b>Tipo:</b> {eq.tipo}</p>
              <p>
                <b>Estado:</b>{" "}
                <span
                  style={{
                    color: eq.estado === "mantenimiento" ? "#c62828" : "#00796b",
                    fontWeight: "bold",
                  }}
                >
                  {eq.estado === "mantenimiento"
                    ? "En mantenimiento ⚠️"
                    : "Operativo ✅"}
                </span>
              </p>

              {eq.imagen && (
                <img
                  src={eq.imagen}
                  alt={eq.nombre}
                  style={{
                    width: "250px",
                    height: "150px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              )}

              <div className="botones-seguimiento">
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
              <div className="chart-box" style={{ marginTop: "20px" }}>
                <h4>🌡️ Temp Externa (°C) vs 💧 Humedad (%)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generarDatosSensores()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="temp" stroke="red" name="Temp Ext" />
                    <Line type="monotone" dataKey="humedad" stroke="blue" name="Humedad" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 🔍 Información extra */}
              <div style={{ marginTop: "10px" }}>
                <h4>⚙️ Datos Técnicos</h4>
                {eq.datos_tecnicos?.length > 0 ? (
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
                {eq.accesorios?.length > 0 ? (
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
