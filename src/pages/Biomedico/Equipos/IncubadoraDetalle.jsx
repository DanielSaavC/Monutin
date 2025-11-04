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

  // 🔹 Datos simulados (sin cambios)
  const data = Array.from({ length: 10 }, (_, i) => ({
    time: i,
    temp: 36 + Math.random(),
    humedad: 40 + Math.random() * 10,
    peso: 3 + Math.random() * 0.5,
    tempBebe: 36.5 + Math.random() * 0.5,
  }));

  // 🔹 Obtener datos del equipo (sin cambios)
  useEffect(() => {
    axios
      .get("https://monutinbackend-production.up.railway.app/api/equipos")
      .then((res) => {
        const encontrado = res.data.find((eq) => eq.id === parseInt(id));
        setEquipo(encontrado || null);
      })
      .catch((err) => console.error("❌ Error cargando equipo:", err));
  }, [id]);

  // 🔹 Verificar sesión (sin cambios)
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      localStorage.setItem("redirectAfterLogin", window.location.hash);
      navigate("/login");
    }
  }, [navigate]);

  // 🔹 Verificar si ya está en seguimiento (MODIFICADO)
  // Ahora lee desde el backend en lugar de localStorage
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    
    // Solo ejecutar si tenemos usuario y el ID del equipo
    if (!usuario || !id) return;

    axios
      .get(
        `https://monutinbackend-production.up.railway.app/api/seguimiento/${usuario.id}`
      )
      .then((res) => {
        // Aseguramos que la respuesta sea un array
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
  }, [id]); // Depende del 'id' del equipo (se re-ejecuta si cambia)

  // 🔹 Agregar o quitar del seguimiento (MODIFICADO)
  const toggleSeguimiento = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario || !equipo) {
        alert("⚠️ Usuario o equipo no definidos.");
        return;
      }

      // No necesitamos leer de localStorage
      // let lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];

      if (enSeguimiento) {
        // 🔻 Quitar del seguimiento
        // lista = lista.filter((eq) => eq.id !== parseInt(id)); // <-- No necesario
        setEnSeguimiento(false); // Optimistic UI

        // 🔻 LÍNEA ELIMINADA 🔻
        // localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));

        await axios.delete(
          "https://monutinbackend-production.up.railway.app/api/seguimiento",
          {
            data: { usuario_id: usuario.id, equipo_id: equipo.id },
          }
        );

        alert("🗑️ Equipo eliminado del seguimiento.");
      } else {
        // 🔺 Agregar al seguimiento
        // (Los datos del equipo se crean en el backend, no necesitamos pasarlos todos)

        // 🔻 LÍNEAS ELIMINADAS 🔻
        // const nuevoEquipo = { ... };
        // lista.push(nuevoEquipo);
        // localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));

        setEnSeguimiento(true); // Optimistic UI

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
      // Revertir el estado si la API falla
      setEnSeguimiento(!enSeguimiento);
      alert("Error al actualizar el seguimiento del equipo.");
    }
  };

  // 🔹 Generar código QR (sin cambios)
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

  // RENDER (Sin cambios en el JSX)
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
              alt="QR del equipo"
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
              Escanéame para abrir este equipo
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

      {/* Información */}
      <div className="equipo-detalle-info">
        <h3>🔧 Información del Equipo</h3>
        <p>
          <b>Marca:</b> {equipo.marca || "N/A"}
        </p>
        <p>
          <b>Modelo:</b> {equipo.modelo || "N/A"}
        </p>
        <p>
          <b>Serie:</b> {equipo.serie || "N/A"}
        </p>
        <p>
          <b>Servicio:</b> {equipo.servicio || "N/A"}
        </p>
        <p>
          <b>Ubicación:</b> {equipo.ubicacion || "N/A"}
        </p>

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

      {/* 📊 Gráficos */}
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
        <h4>⚖️ Peso (Kg) vs 🌡️ Temp Bebé (°C)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="peso" stroke="green" name="Peso" />
            <Line
              type="monotone"
              dataKey="tempBebe"
              stroke="orange"
              name="Temp Bebé"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}