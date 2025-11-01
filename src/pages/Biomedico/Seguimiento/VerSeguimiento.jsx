import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import "../../../App.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

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
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const navigate = useNavigate();

  // ============================================================
  // 🔹 Cargar lista de seguimiento desde el backend
  // ============================================================
  useEffect(() => {
    if (!usuario) return;

    axios
      .get(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`
      )
      .then((res) => {
        setEquipos(res.data);
      })
      .catch((err) => {
        console.error("❌ Error al cargar equipos en seguimiento:", err);
      });
  }, []);

  // ============================================================
  // 🔹 Actualizar LocalStorage
  // ============================================================
  const actualizarLocalStorage = (nuevaLista) => {
    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(nuevaLista));
    setEquipos(nuevaLista);
  };

  // ============================================================
  // 🔹 Simulación de datos de sensores
  // ============================================================
  const generarDatosSensores = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      time: i,
      temp: 36 + Math.random(),
      humedad: 40 + Math.random() * 10,
    }));
  };

  // ============================================================
  // 🔹 Apagar alarma (simulado)
  // ============================================================
  const apagarAlarma = (nombre) => {
    alert(`🔇 Señal enviada para apagar la alarma del equipo: ${nombre}`);
  };

  // ============================================================
  // 🔹 Cambiar estado operativo/mantenimiento
  // ============================================================
  const toggleEstado = async (id) => {
    const equipo = equipos.find((eq) => eq.id === id);
    if (!equipo) return;

    const nuevoEstado =
      equipo.estado === "mantenimiento" ? "bueno" : "mantenimiento";

    try {
      await axios.post(
        "https://monutinbackend-production.up.railway.app/api/seguimiento",
        {
          usuario_id: usuario.id,
          equipo_id: equipo.id,
        }
      );

      const nuevaLista = equipos.map((eq) =>
        eq.id === id ? { ...eq, estado: nuevoEstado } : eq
      );

      setEquipos(nuevaLista);
      localStorage.setItem(
        "equipos_en_seguimiento",
        JSON.stringify(nuevaLista)
      );

      alert(`✅ Estado del equipo cambiado a "${nuevoEstado}".`);
    } catch (error) {
      console.error("❌ Error al actualizar estado:", error);
      alert("Error al actualizar el estado del equipo.");
    }
  };

  // ============================================================
  // 🔹 Quitar equipo del seguimiento
  // ============================================================
  const quitar = async (id) => {
    const equipo = equipos.find((eq) => eq.id === id);
    if (equipo.estado === "mantenimiento") {
      alert("⚠️ No se puede quitar un equipo mientras está en mantenimiento.");
      return;
    }

    try {
      await axios.delete(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}/${id}`
      );

      const nuevaLista = equipos.filter((eq) => eq.id !== id);
      actualizarLocalStorage(nuevaLista);
      alert("✅ Equipo quitado del seguimiento correctamente.");
    } catch (error) {
      console.error("❌ Error al quitar equipo:", error);
      alert("Error al quitar el equipo del seguimiento.");
    }
  };

  // ============================================================
  // 🔹 Descargar ficha técnica en PDF
  // ============================================================
  const descargarFichaTecnica = (equipo) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ficha Técnica del Equipo", 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${equipo.nombre_equipo}`, 20, 40);
    doc.text(`Marca: ${equipo.marca}`, 20, 50);
    doc.text(`Modelo: ${equipo.modelo}`, 20, 60);
    doc.text(`Ubicación: ${equipo.ubicacion}`, 20, 70);
    doc.text(`Servicio: ${equipo.servicio || "N/A"}`, 20, 80);
    doc.text(`Código: ${equipo.codigo || "N/A"}`, 20, 90);

    if (equipo.imagen_base64) {
      doc.addImage(equipo.imagen_base64, "JPEG", 140, 30, 50, 40);
    }

    doc.save(`Ficha_${equipo.nombre_equipo}.pdf`);
  };

  // ============================================================
  // 🔹 Renderizado principal
  // ============================================================
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
                padding: "25px",
                borderRadius: "14px",
                background: "#f1fdfb",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ color: "#00796b" }}>
                {eq.nombre_equipo || eq.nombre}
              </h2>

              {(eq.imagen_base64 || eq.imagen) && (
                <img
                  src={eq.imagen_base64 || eq.imagen}
                  alt={eq.nombre_equipo}
                  style={{
                    width: "300px",
                    height: "180px",
                    borderRadius: "12px",
                    objectFit: "cover",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    marginBottom: "15px",
                  }}
                />
              )}

              <p><b>Marca:</b> {eq.marca}</p>
              <p><b>Modelo:</b> {eq.modelo}</p>
              <p><b>Ubicación:</b> {eq.ubicacion}</p>
              <p><b>Tipo:</b> {eq.tipo || "No especificado"}</p>
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

              {/* 🔘 Botones de acción */}
              <div
                className="botones-seguimiento"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >
                <button
                  className="btn-control rojo"
                  onClick={() => apagarAlarma(eq.nombre_equipo)}
                >
                  🔕 Apagar alarma
                </button>

                <button
                  className="btn-control verde"
                  onClick={() => toggleEstado(eq.id)}
                >
                  {eq.estado === "mantenimiento"
                    ? "✅ Marcar operativo"
                    : "🛠️ Marcar mantenimiento"}
                </button>

                <button
                  className="btn-control gris"
                  disabled={eq.estado === "mantenimiento"}
                  onClick={() => quitar(eq.id)}
                >
                  ❌ Quitar del seguimiento
                </button>

                <button
                  className="btn-control azul"
                  onClick={() => descargarFichaTecnica(eq)}
                >
                  📄 Descargar Ficha Técnica
                </button>

                <button
                  className="btn-control naranja"
                  onClick={() => navigate(`/hojaDeMantenimiento/${eq.id}`)}
                >
                  🛠️ Actualizar Hoja de Mantenimiento
                </button>
              </div>

              {/* 📊 Gráfico de sensores */}
              <div className="chart-box" style={{ marginTop: "15px" }}>
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

              {/* 🔍 Información técnica */}
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
