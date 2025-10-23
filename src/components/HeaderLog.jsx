import React from "react";
import { useNavigate } from "react-router-dom";
import "./HeaderLog.css";

export default function HeaderLog() {
  const navigate = useNavigate();

  return (
    <header className="headerlog-container">
      {/* Logo o título */}
      <h1 className="headerlog-title" onClick={() => navigate("/")}>
        Monutin
      </h1>

      {/* Navegación */}
      <nav className="headerlog-nav">
        <button className="headerlog-btn" onClick={() => navigate("/login")}>
          Iniciar sesión
        </button>
        <button className="headerlog-btn secondary" onClick={() => navigate("/registro")}>
          Registrarse
        </button>
      </nav>
    </header>
  );
}
