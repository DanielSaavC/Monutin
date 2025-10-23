import React from "react";
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
import "../../../App.css";
export default function IncubadoraDetalle() {
  const { id } = useParams(); // Incuba 1, 2, 3, 4

  // 🔹 Datos simulados (luego reemplazas con tus sensores vía API/MQTT)
  const data = Array.from({ length: 10 }, (_, i) => ({
    time: i,
    temp: 36 + Math.random(),            // temperatura externa
    humedad: 40 + Math.random() * 10,    // % humedad
    peso: 3 + Math.random() * 0.5,       // peso del bebé
    tempBebe: 36.5 + Math.random() * 0.5 // temperatura interna bebé
  }));

  return (

    <div className="menu-container">
      <Header /> 
      <h2>📊 Incubadora {id}</h2>

      {/* Primer gráfico */}
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

      {/* Segundo gráfico */}
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
