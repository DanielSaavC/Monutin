import React, { useEffect } from "react";
import mqtt from "mqtt";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Presentacion() {
  const navigate = useNavigate();

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9001"); // luego cambiamos a wss
    client.on("connect", () => console.log("✅ Conectado a MQTT"));
    client.on("error", (err) => console.error("❌ Error MQTT:", err));
    return () => client.end();
  }, []);

  return (
    <div className="presentacion-container">
      <div className="presentacion-card">
        <h1>Bienvenido a Monutin</h1>
        <p>Tu mejor herramienta para hacer seguimiento de equipos medicos.</p>
        <button
          className="btn-primary"
          onClick={() => navigate("/login")} // 👈 usar navigate()
        >
          Ir al Login
        </button>
      </div>
    </div>
  );
}
