import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Componente reutilizable para cada gráfico
const ChartBox = ({ title, data, color }) => (
  <div style={{ flex: 1, padding: "10px" }}>
    <h3 style={{ textAlign: "center" }}>{title}</h3>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function Biomedico() {
  // Generador de datos falsos
  const generateData = (max) =>
    Array.from({ length: 10 }, (_, i) => ({
      time: i,
      value: Math.random() * max,
    }));

  // Configuración de los sensores
  const sensors = [
    { title: "Sensor 1", data: generateData(100), color: "#8884d8" },
    { title: "Sensor 2", data: generateData(50).map(d => ({ ...d, value: d.value + 50 })), color: "#82ca9d" },
    { title: "Sensor 3", data: generateData(200), color: "#ff7300" },
    { title: "Sensor 4", data: generateData(10), color: "#00c49f" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>👨‍⚕️ Panel del Biomédico</h2>
      <p>Aquí irán las opciones exclusivas para médicos.</p>

      {/* Contenedor de 4 cuadros */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {sensors.map((sensor, index) => (
          <ChartBox
            key={index}
            title={sensor.title}
            data={sensor.data}
            color={sensor.color}
          />
        ))}
      </div>
    </div>
  );
}
