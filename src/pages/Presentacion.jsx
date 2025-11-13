import React, { useEffect } from "react";
import mqtt from "mqtt";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Presentacion() {
  const navigate = useNavigate();

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9001"); // luego cambiar a wss
    client.on("connect", () => console.log("✅ Conectado a MQTT"));
    client.on("error", (err) => console.error("❌ Error MQTT:", err));
    return () => client.end();
  }, []);

  return (
    <div className="presentacion-container">
      {/* === COLUMNA IZQUIERDA === */}
      <div className="presentacion-texto">
        <h1>Bienvenido a Monutin</h1>
        <p>
          La plataforma integral para la gestión y seguimiento inteligente de
          equipos médicos hospitalarios. Supervisa, analiza y organiza el
          mantenimiento.
        </p>
        <button
          className="btn-primary"
          onClick={() => navigate("/login")}
        >
          Ir al Login
        </button>
      </div>

      {/* === COLUMNA DERECHA (IMAGEN) === */}
      <div className="presentacion-imagen">
        <img src={process.env.PUBLIC_URL + "/images/utin2.png"} alt="Monutin presentación" />
      </div>
    </div>
  );
}
