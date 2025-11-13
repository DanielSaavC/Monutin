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
  const [data, setData] = useState([]); // 🔹 Aquí se guardan los datos reales

  // 🔹 Obtener lecturas reales desde Railway
  useEffect(() => {
    const fetchSensores = async () => {
      try {
        const res = await axios.get(
          "https://monutinbackend-production.up.railway.app/api/sensores"
        );

        // Transformar los datos para el gráfico
        const formatted = res.data.map((item, index) => ({
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

        setData(formatted.reverse()); // orden cronológico
      } catch (err) {
        console.error("❌ Error obteniendo sensores:", err);
      }
    };

    fetchSensores();
    const interval = setInterval(fetchSensores, 5000); // 🔁 Actualiza cada 5 segundos
    return () => clearInterval(interval);
  }, []);

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

  // 🔹 Función para activar/desactivar seguimiento
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

  // 🔹 Generar QR (igual)
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

  // 🔹 Render
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

      <div className="seguimiento-boton-container">
        <button
          onClick={toggleSeguimiento}
          className={`btn-seguimiento ${enSeguimiento ? "activo" : ""}`}
        >
          {enSeguimiento ? "👁️ En seguimiento" : "📈 Dar seguimiento"}
        </button>
      </div>

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
