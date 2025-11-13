import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import axios from "axios";
import QRCode from "qrcode";
import "../../../App.css";

export default function IncubadoraDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [enSeguimiento, setEnSeguimiento] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [data, setData] = useState([]); // 🔹 Datos reales de sensores

  // 🔹 Obtener lecturas reales desde Railway
  useEffect(() => {
    const fetchSensores = async () => {
      try {
        const res = await axios.get(
          "https://monutinbackend-production.up.railway.app/api/sensores"
        );

        const formatted = res.data.map((item) => ({
          time: new Date(item.fecha).toLocaleTimeString("es-BO", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          temp: item.temperatura,
          humedad: item.humedad,
          tempBebe: item.objtemp,
          ambTemp: item.ambtemp,
        }));

        setData(formatted.reverse());
      } catch (err) {
        console.error("❌ Error obteniendo sensores:", err);
      }
    };

    fetchSensores();
    const interval = setInterval(fetchSensores, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Obtener datos del equipo
  useEffect(() => {
    axios
      .get("https://monutinbackend-production.up.railway.app/api/equipos")
      .then((res) => {
        const encontrado = res.data.find((eq) => eq.id === parseInt(id));
        setEquipo(encontrado || null);
      })
      .catch((err) => console.error("❌ Error cargando equipo:", err));
  }, [id]);

  // 🔹 Verificar sesión
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      localStorage.setItem("redirectAfterLogin", window.location.hash);
      navigate("/login");
    }
  }, [navigate]);

  // 🔹 Verificar si el equipo está en seguimiento
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || !id) return;

    axios
      .get(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`
      )
      .then((res) => {
        const lista = res.data?.data || res.data;
        if (Array.isArray(lista)) {
          const existe = lista.some((eq) => eq.id === parseInt(id));
          setEnSeguimiento(existe);
        } else {
          setEnSeguimiento(false);
        }
      })
      .catch((err) => {
        console.error("❌ Error al verificar estado de seguimiento:", err);
      });
  }, [id]);

  // 🔹 Activar / desactivar seguimiento
  const toggleSeguimiento = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario || !equipo) {
        alert("⚠️ Usuario o equipo no definidos.");
        return;
      }

      if (enSeguimiento) {
        setEnSeguimiento(false);
        await axios.delete(
          "https://monutinbackend-production.up.railway.app/api/seguimiento",
          {
            data: { usuario_id: usuario.id, equipo_id: equipo.id },
          }
        );
        alert("🗑️ Equipo eliminado del seguimiento.");
      } else {
        setEnSeguimiento(true);
        await axios.post(
          "https://monutinbackend-production.up.railway.app/api/seguimiento",
          {
            usuario_id: usuario.id,
            equipo_id: equipo.id,
          }
        );
        alert("✅ Equipo agregado al seguimiento.");
      }
    } catch (err) {
      console.error("❌ Error al cambiar seguimiento:", err);
      setEnSeguimiento(!enSeguimiento);
      alert("Error al actualizar el seguimiento del equipo.");
    }
  };

  // 🔹 Generar y descargar QR
  const generarQR = async () => {
    try {
      const url = `https://danielsaavc.github.io/Monutin/#/incubadoras/${id}`;
      const qr = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        width: 350,
        color: { dark: "#00796B", light: "#FFFFFF" },
      });

      setQrImage(qr);
      const link = document.createElement("a");
      link.href = qr;
      link.download = `QR_Incubadora_${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("❌ Error al generar QR:", err);
      alert("No se pudo generar el QR.");
    }
  };

  // 🔹 Descargar ficha técnica
  const descargarFicha = (id) => {
    const url = `https://monutinbackend-production.up.railway.app/api/fichatecnica/${id}/pdf`;
    window.open(url, "_blank");
  };

  if (!equipo)
    return (
      <div className="menu-container">
        <Header />
        <h2>📊 Cargando datos de la incubadora...</h2>
      </div>
    );

  return (
    <div className="menu-container">
      <Header />
      <h2>📊 {equipo.nombre_equipo || `Incubadora ${id}`}</h2>

      {/* 📈 Botón seguimiento */}
      <div className="seguimiento-boton-container">
        <button
          onClick={toggleSeguimiento}
          className={`btn-seguimiento ${enSeguimiento ? "activo" : ""}`}
        >
          {enSeguimiento ? "👁️ En seguimiento" : "📈 Dar seguimiento"}
        </button>
      </div>

      {/* 🔳 Botón QR */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button
          onClick={generarQR}
          style={{
            backgroundColor: "#00796B",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1em",
          }}
        >
          🔳 Generar QR
        </button>

        {qrImage && (
          <div style={{ marginTop: "20px" }}>
            <img
              src={qrImage}
              alt="QR de la incubadora"
              style={{
                width: "200px",
                height: "200px",
                border: "2px solid #00796B",
                borderRadius: "10px",
                padding: "10px",
                backgroundColor: "#fff",
              }}
            />
            <p style={{ fontSize: "0.9em", color: "#555" }}>
              Escanéame para abrir esta incubadora
            </p>
          </div>
        )}
      </div>

      {/* 📸 Imagen */}
      <div className="equipo-detalle-imagen">
        {equipo.imagen_base64 ? (
          <img
            src={equipo.imagen_base64}
            alt={equipo.nombre_equipo}
            style={{
              width: "300px",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <div
            style={{
              width: "300px",
              height: "200px",
              background: "#e0f2f1",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00bfa6",
              fontSize: "2em",
            }}
          >
            📷 Sin imagen
          </div>
        )}
      </div>

      {/* 📋 Información */}
      <div className="equipo-detalle-info">
        <h3>🔧 Información de la Incubadora</h3>
        <p><b>Marca:</b> {equipo.marca || "N/A"}</p>
        <p><b>Modelo:</b> {equipo.modelo || "N/A"}</p>
        <p><b>Serie:</b> {equipo.serie || "N/A"}</p>
        <p><b>Servicio:</b> {equipo.servicio || "N/A"}</p>
        <p><b>Ubicación:</b> {equipo.ubicacion || "N/A"}</p>

        <h3>🧩 Accesorios</h3>
        {equipo.accesorios?.length ? (
          <ul>
            {equipo.accesorios.map((a, i) => (
              <li key={i}>
                <b>{a.funcion}:</b> {a.info}
              </li>
            ))}
          </ul>
        ) : (
          <p>No se registraron accesorios.</p>
        )}

        <h3>⚙️ Datos Técnicos</h3>
        {equipo.datos_tecnicos?.length ? (
          <ul>
            {equipo.datos_tecnicos.map((dt, i) => (
              <li key={i}>
                <b>{dt.funcion}:</b> {dt.info}
              </li>
            ))}
          </ul>
        ) : (
          <p>No se registraron datos técnicos.</p>
        )}
      </div>

      {/* 📄 Ficha técnica */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => descargarFicha(id)}
          style={{
            backgroundColor: "#005e56",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1em",
          }}
        >
          📄 Descargar Ficha Técnica
        </button>
      </div>

      {/* 📊 Gráficas (no modificadas) */}
      <div className="chart-box">
        <h4>🌡️ Temp Externa (°C) vs 💧 Humedad (%)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="red" name="Temp Ext" />
            <Line
              type="monotone"
              dataKey="humedad"
              stroke="blue"
              name="Humedad"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-box">
        <h4>🌡️ Temp Bebé (°C) vs 🌡️ Temp Ambiente (°C)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="tempBebe"
              stroke="orange"
              name="Temp Bebé"
            />
            <Line
              type="monotone"
              dataKey="ambTemp"
              stroke="green"
              name="Temp Amb"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
