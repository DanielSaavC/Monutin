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

export default function VentiladorDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [enSeguimiento, setEnSeguimiento] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  // 🔹 Datos simulados de sensores
  const data = Array.from({ length: 10 }, (_, i) => ({
    time: i,
    flujo: 20 + Math.random() * 5, // flujo de aire (L/min)
    presion: 30 + Math.random() * 5, // presión (cmH₂O)
    volumen: 500 + Math.random() * 50, // volumen tidal (mL)
    oxigeno: 90 + Math.random() * 5, // saturación O₂ (%)
  }));

  // 🔹 Obtener datos del backend
  useEffect(() => {
    axios
      .get("https://monutinbackend.onrender.comp/api/equipos")
      .then((res) => {
        const encontrado = res.data.find((eq) => eq.id === parseInt(id));
        setEquipo(encontrado || null);
      })
      .catch((err) => console.error("❌ Error al cargar ventilador:", err));
  }, [id]);

  // 🔹 Verificar sesión
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      localStorage.setItem("redirectAfterLogin", window.location.hash);
      navigate("/login");
    }
  }, [navigate]);

  // 🔹 Verificar si ya está en seguimiento
  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];
    const existe = lista.some((eq) => eq.id === parseInt(id));
    setEnSeguimiento(existe);
  }, [id]);

  // 🔹 Agregar o quitar del seguimiento
  const toggleSeguimiento = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario || !equipo) {
        alert("⚠️ Usuario o equipo no definidos.");
        return;
      }

      let lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];

      if (enSeguimiento) {
        // 🔻 Quitar del seguimiento
        lista = lista.filter((eq) => eq.id !== parseInt(id));
        setEnSeguimiento(false);
        localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));

        await axios.delete("https://monutinbackend.onrender.com/api/seguimiento", {
          data: { usuario_id: usuario.id, equipo_id: equipo.id },
        });

        alert("🗑️ Ventilador eliminado del seguimiento.");
      } else {
        // 🔺 Agregar al seguimiento
        const nuevoEquipo = {
          id: parseInt(id),
          nombre: equipo.nombre_equipo,
          marca: equipo.marca,
          modelo: equipo.modelo,
          ubicacion: equipo.ubicacion,
          tipo: "ventilador",
          estado: "bueno",
        };

        lista.push(nuevoEquipo);
        localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));
        setEnSeguimiento(true);

        await axios.post("https://monutinbackend.onrender.com/api/seguimiento", {
          usuario_id: usuario.id,
          equipo_id: equipo.id,
        });

        alert("✅ Ventilador agregado al seguimiento.");
      }
    } catch (error) {
      console.error("❌ Error en seguimiento:", error);
      alert("Hubo un error al actualizar el seguimiento del ventilador.");
    }
  };

  // 🔹 Generar y descargar código QR
  const generarQR = async () => {
    try {
      const url = `https://danielsaavc.github.io/Monutin/#/ventiladores/${id}`;
      const qr = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        width: 350,
        color: { dark: "#00796B", light: "#FFFFFF" },
      });

      setQrImage(qr);

      const link = document.createElement("a");
      link.href = qr;
      link.download = `QR_Ventilador_${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("❌ Error al generar QR:", err);
      alert("Error al generar el código QR.");
    }
  };

  if (!equipo)
    return (
      <div className="menu-container">
        <Header />
        <h2>💨 Cargando datos del ventilador...</h2>
      </div>
    );

  return (
    <div className="menu-container">
      <Header />
      <h2>💨 {equipo.nombre_equipo || `Ventilador ${id}`}</h2>

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
              alt="QR del ventilador"
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
              Escanéame para abrir este ventilador
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
        <h3>🔧 Información del Ventilador</h3>
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

      {/* 📊 Gráficos simulados */}
      <div className="chart-box">
        <h4>🌬️ Flujo (L/min) vs 💨 Presión (cmH₂O)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="flujo" stroke="blue" name="Flujo" />
            <Line type="monotone" dataKey="presion" stroke="red" name="Presión" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-box">
        <h4>🫁 Volumen Tidal (mL) vs O₂ (%)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="volumen" stroke="green" name="Volumen" />
            <Line type="monotone" dataKey="oxigeno" stroke="orange" name="O₂" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
