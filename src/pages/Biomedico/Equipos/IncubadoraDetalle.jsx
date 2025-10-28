import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import "../../../App.css";

export default function IncubadoraDetalle() {
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [enSeguimiento, setEnSeguimiento] = useState(false);

  // 🔹 Datos simulados de sensores (luego reemplazas con tu API/MQTT)
  const data = Array.from({ length: 10 }, (_, i) => ({
    time: i,
    temp: 36 + Math.random(),
    humedad: 40 + Math.random() * 10,
    peso: 3 + Math.random() * 0.5,
    tempBebe: 36.5 + Math.random() * 0.5,
  }));

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

  // 🔹 Verificar si ya está en seguimiento
  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];
    const existe = lista.some((eq) => eq.id === parseInt(id));
    setEnSeguimiento(existe);
  }, [id]);

  // 🔹 Función para agregar o quitar del seguimiento
  const toggleSeguimiento = () => {
    let lista = JSON.parse(localStorage.getItem("equipos_en_seguimiento")) || [];

    if (enSeguimiento) {
      // Quitar del seguimiento
      lista = lista.filter((eq) => eq.id !== parseInt(id));
      setEnSeguimiento(false);
    } else {
      // Agregar con toda la información disponible
      const nuevoEquipo = {
        id: parseInt(id),
        nombre: equipo.nombre_equipo || `Incubadora ${id}`,
        marca: equipo.marca || "N/A",
        modelo: equipo.modelo || "N/A",
        ubicacion: equipo.ubicacion || "N/A",
        tipo: "incubadora",
        imagen: equipo.imagen_base64 || null,
        accesorios: equipo.accesorios || [],
        datos_tecnicos: equipo.datos_tecnicos || [],
        sensores: data, // se guarda el dataset actual
      };
      lista.push(nuevoEquipo);
      setEnSeguimiento(true);
    }

    localStorage.setItem("equipos_en_seguimiento", JSON.stringify(lista));
  };

  if (!equipo) {
    return (
      <div className="menu-container">
        <Header />
        <h2>📊 Cargando datos de la incubadora...</h2>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <Header />
      <h2>📊 {equipo.nombre_equipo || `Incubadora ${id}`}</h2>

      {/* 📈 BOTÓN DE SEGUIMIENTO */}
      <div className="seguimiento-boton-container">
  <button
    onClick={toggleSeguimiento}
    className={`btn-seguimiento ${enSeguimiento ? "activo" : ""}`}
  >
    {enSeguimiento ? "👁️ En seguimiento" : "📈 Dar seguimiento"}
  </button>
</div>

      {/* 📸 Imagen del equipo */}
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

      {/* 📋 Información técnica */}
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

      {/* === Gráficos de sensores === */}
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
