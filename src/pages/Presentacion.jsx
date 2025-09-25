import React, { useEffect } from "react";
import mqtt from "mqtt";
import "../App.css";

export default function Presentacion() {
  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9001"); // luego cambiamos a wss
    client.on("connect", () => console.log("✅ Conectado a MQTT"));
    client.on("error", (err) => console.error("❌ Error MQTT:", err));
    return () => client.end();
  }, []);

  return (
    <div className="presentacion-container">
      <div className="presentacion-card">
        <h1>👶 Bienvenido al Sistema</h1>
        <p>Conexión al simulador establecida en segundo plano.</p>
        <button
          className="btn-primary"
          onClick={() => (window.location.href = "/login")}
        >
          Ir al Login
        </button>
      </div>
    </div>
  );
}
