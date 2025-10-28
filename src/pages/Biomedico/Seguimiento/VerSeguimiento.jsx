import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import "../../../App.css";

export default function VerSeguimiento() {
  const [equipos, setEquipos] = useState([]);

  // Cargar lista de seguimiento
  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];
    setEquipos(lista);
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
  const toggleEstado = (id) => {
    const nuevaLista = equipos.map((eq) =>
      eq.id === id
        ? {
            ...eq,
            estado: eq.estado === "mantenimiento" ? "bueno" : "mantenimiento",
          }
        : eq
    );
    actualizarLocalStorage(nuevaLista);
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
