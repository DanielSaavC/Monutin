import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import { useNavigate } from "react-router-dom"; // 🔹 Importar
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
import QRCode from "qrcode"; // 🆕
import "../../../App.css";

export default function ServocunaDetalle() {
      const navigate = useNavigate(); 
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [enSeguimiento, setEnSeguimiento] = useState(false);
  const [qrImage, setQrImage] = useState(null); // 🆕 estado QR

  // 🔹 Datos simulados (por ahora)
  const data = Array.from({ length: 10 }, (_, i) => ({
    time: i,
    temp: 36 + Math.random(),
    humedad: 40 + Math.random() * 10,
    peso: 3 + Math.random() * 0.5,
    tempBebe: 36.5 + Math.random() * 0.5,
  }));

  // 🔹 Cargar datos reales del equipo
  useEffect(() => {
    axios
      .get("https://monutinbackend-production.up.railway.app/api/equipos")
      .then((res) => {
        const encontrado = res.data.find((eq) => eq.id === parseInt(id));
        setEquipo(encontrado || null);
      })
      .catch((err) => console.error("❌ Error al cargar servocuna:", err));
  }, [id]);
useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      // Guardar la ruta actual para redirigir luego del login
      localStorage.setItem("redirectAfterLogin", window.location.hash);
      navigate("/login");
    }
  }, [navigate]);
  // 🔹 Verificar si ya está en seguimiento
  useEffect(() => {
    const lista =
      JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];
    const existe = lista.some((eq) => eq.id === parseInt(id));
    setEnSeguimiento(existe);
  }, [id]);

  // 🔹 Agregar o quitar del seguimiento
const toggleSeguimiento = async () => {
  let lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];

  if (enSeguimiento) {
    // 🔸 Quitar equipo del seguimiento local
    lista = lista.filter((eq) => eq.id !== parseInt(id));
    setEnSeguimiento(false);

    // 🔸 Quitar también del backend
    await axios.delete(`https://monutinbackend-production.up.railway.app/api/seguimiento/${id}`);
  } else {
    // 🔹 Crear objeto del nuevo equipo
    const nuevoEquipo = {
      id: parseInt(id),
      nombre: equipo.nombre_equipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      ubicacion: equipo.ubicacion,
      tipo: "incubadora",
    };

    lista.push(nuevoEquipo);
    setEnSeguimiento(true);

    // 🔹 Guardar en backend
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    await axios.post("https://monutinbackend-production.up.railway.app/api/seguimiento", {
      usuario_id: usuario.id,
      equipo_id: equipo.id,
    });
  }

  // 🔄 Actualizar almacenamiento local
  localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));
};


  // 🆕 === GENERAR Y DESCARGAR CÓDIGO QR ===
  const generarQR = async () => {
    try {
      // URL del equipo actual (producción)
      const url = `https://danielsaavc.github.io/Monutin/#/servocunas/${id}`;

      // Generar QR en base64 (PNG)
      const qr = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        width: 350,
        color: { dark: "#00796B", light: "#FFFFFF" },
      });

      setQrImage(qr);

      // 🔽 Descargar automáticamente el QR
      const link = document.createElement("a");
      link.href = qr;
      link.download = `QR_Servocuna_${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ QR generado y descargado:", url);
    } catch (err) {
      console.error("❌ Error al generar QR:", err);
      alert("Error al generar el código QR.");
    }
  };

  if (!equipo) {
    return (
      <div className="menu-container">
        <Header />
        <h2>🛏️ Cargando datos de la servocuna...</h2>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <Header />
      <h2>🛏️ {equipo.nombre_equipo || `Servocuna ${id}`}</h2>

      {/* 📈 Botón de seguimiento */}
      <div className="seguimiento-boton-container">
        <button
          onClick={toggleSeguimiento}
          className={`btn-seguimiento ${enSeguimiento ? "activo" : ""}`}
        >
          {enSeguimiento ? "👁️ En seguimiento" : "📈 Dar seguimiento"}
        </button>
      </div>

      {/* 🆕 Botón Generar QR */}
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

        {/* Mostrar QR si existe */}
        {qrImage && (
          <div style={{ marginTop: "20px" }}>
            <img
              src={qrImage}
              alt="QR de la servocuna"
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
              Escanéame para abrir esta servocuna
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
        <h3>🔧 Información del Equipo</h3>
        <p><b>Marca:</b> {equipo.marca || "N/A"}</p>
        <p><b>Modelo:</b> {equipo.modelo || "N/A"}</p>
        <p><b>Serie:</b> {equipo.serie || "N/A"}</p>
        <p><b>Servicio:</b> {equipo.servicio || "N/A"}</p>
        <p><b>Ubicación:</b> {equipo.ubicacion || "N/A"}</p>

        <h3>🧩 Accesorios</h3>
        {equipo.accesorios && equipo.accesorios.length > 0 ? (
          <ul>
            {equipo.accesorios.map((acc, i) => (
              <li key={i}>
                <b>{acc.funcion}:</b> {acc.info}
              </li>
            ))}
          </ul>
        ) : (
          <p>No se registraron accesorios.</p>
        )}

        <h3>⚙️ Datos Técnicos</h3>
        {equipo.datos_tecnicos && equipo.datos_tecnicos.length > 0 ? (
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

      {/* === Gráficos simulados === */}
      <div className="chart-box">
        <h4>🌡️ Temp Externa (°C) vs 💧 Humedad (%)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="red" name="Temp Ext" />
            <Line type="monotone" dataKey="humedad" stroke="blue" name="Humedad" />
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
            <Line type="monotone" dataKey="tempBebe" stroke="orange" name="Temp Bebé" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
