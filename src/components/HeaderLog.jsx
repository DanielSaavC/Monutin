import React from "react";
import { useNavigate } from "react-router-dom";
import "./HeaderLog.css";

export default function HeaderLog() {
  const navigate = useNavigate();

  return (
    <header className="headerlog-container">
      {/* Logo principal clickeable */}
      <img
        src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
        alt="Logo Monutin"
        className="headerlog-logo"
        onClick={() => navigate("/")}
      />

      {/* Navegación */}
      <nav className="headerlog-nav">
        <button className="headerlog-btn" onClick={() => navigate("/login")}>
          Iniciar sesión
        </button>
        <button
          className="headerlog-btn secondary"
          onClick={() => navigate("/registro")}
        >
          Registrarse
        </button>
      </nav>
    </header>
  );
}
