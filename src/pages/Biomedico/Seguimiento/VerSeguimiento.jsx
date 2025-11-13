import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import React, { useEffect, useState } from "react";
import "../../../App.css";
import axios from "axios";
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
  const [sensores, setSensores] = useState([]); // 🔹 Datos reales de sensores
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const navigate = useNavigate();

  // 🔹 Cargar lista de equipos en seguimiento
  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    axios
      .get(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`
      )
      .then((res) => {
        const lista = res.data?.data || res.data;
        if (Array.isArray(lista)) setEquipos(lista);
      })
      .catch((err) => {
        console.error("❌ Error al cargar equipos en seguimiento:", err);
        setEquipos([]);
      });
  }, [usuario?.id]);

  // 🔹 Cargar lecturas de sensores cada 5 s
  useEffect(() => {
    const fetchSensores = async () => {
      try {
        const res = await axios.get(
          "https://monutinbackend-production.up.railway.app/api/sensores"
        );
        setSensores(res.data || []);
      } catch (error) {
        console.error("❌ Error obteniendo sensores:", error);
      }
    };
    fetchSensores();
    const interval = setInterval(fetchSensores, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Quitar del seguimiento
  const quitar = async (id) => {
    try {
      await axios.delete(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}/${id}`
      );
      setEquipos((prev) => prev.filter((eq) => eq.id !== id));
      alert("🗑️ Equipo eliminado del seguimiento.");
    } catch (error) {
      console.error("❌ Error al quitar equipo:", error);
      alert("Error al quitar el equipo del seguimiento.");
    }
  };

  // 🔹 Descargar ficha técnica (ya funcional)
  const descargarFicha = (id) => {
    const url = `https://monutinbackend-production.up.railway.app/api/fichatecnica/${id}/pdf`;
    window.open(url, "_blank");
  };

  // 🔹 Generar datos para gráficas (usando lecturas reales)
  const generarDatosSensores = () => {
    if (!Array.isArray(sensores)) return [];
    return sensores.slice(-20).map((item) => ({
      time: new Date(item.fecha).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temp: item.temperatura,
      humedad: item.humedad,
      ambTemp: item.ambtemp,
      objTemp: item.objtemp,
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
                <div
                  style={{
                    width: "250px",
                    height: "150px",
                    background: "#e0f2f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#00796b",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  📷 Sin imagen
                </div>
              )}

              <p>
                <b>Marca:</b> {eq.marca}
              </p>
              <p>
                <b>Modelo:</b> {eq.modelo}
              </p>
              <p>
                <b>Ubicación:</b> {eq.ubicacion}
              </p>
              <p>
                <b>Tipo:</b> {eq.tipo}
              </p>
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

              {/* Botones de acción (solo los necesarios) */}
              <div className="botones-seguimiento">
                <button
                  className="btn-control gris"
                  onClick={() => quitar(eq.id)}
                >
                  ❌ Quitar del seguimiento
                </button>

                <button
                  className="btn-control azul"
                  onClick={() => descargarFicha(eq.id)}
                >
                  📄 Descargar Ficha Técnica
                </button>
                <button
                  className="btn-control verde"
                  onClick={() =>
                    window.open(
                      `https://monutinbackend-production.up.railway.app/api/mantenimientos/pdf/${eq.id}`
                    )
                  }
                >
                  📄 Descargar Hoja de Mantenimiento
                </button>
              </div>

              {/* 📈 Gráficas en tiempo real */}
              <div className="chart-box" style={{ marginTop: "20px" }}>
                <h4>🌡️ Temp Externa (°C) y 💧 Humedad (%)</h4>
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
                      name="Temp Externa"
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

              <div className="chart-box" style={{ marginTop: "20px" }}>
                <h4>🌡️ Temp Ambiente (°C) y 🌡️ Temp Paciente (°C)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generarDatosSensores()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="ambTemp"
                      stroke="green"
                      name="Temp Ambiente"
                    />
                    <Line
                      type="monotone"
                      dataKey="objTemp"
                      stroke="orange"
                      name="Temp Paciente"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
