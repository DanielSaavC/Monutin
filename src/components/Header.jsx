import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [menuOpen, setMenuOpen] = useState(false);

  if (!usuario) {
    return (
      <div className="header-container">
        <h2 className="header-title" onClick={() => navigate("/")}>
          Monutin
        </h2>
      </div>
    );
  }

  // Prefijo según tipo
  let prefijo = "";
  switch (usuario.tipo) {
    case "medico":
      prefijo = "Dr.";
      break;
    case "enfermera":
      prefijo = "Enf.";
      break;
    case "tecnico":
      prefijo = "Tec.";
      break;
    case "biomedico":
      prefijo = "Ing.";
      break;
    default:
      prefijo = "";
  }

  return (
    <div className="header-container">
      <div className="header-back" onClick={() => navigate(-1)}>←</div>
      <h2 className="header-title" onClick={() => navigate("/biomedico")}>
        Monutin
      </h2>

      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</div>

      <nav className={`menu ${menuOpen ? "active" : ""}`}>
        <button onClick={() => navigate("/biomedico")} className="menu-btn">Inicio</button>
        <button onClick={() => navigate("/ajustes")} className="menu-btn">Ajustes</button>
        <button onClick={() => navigate("/")} className="menu-btn">Cerrar sesión</button>
      </nav>
    </div>
  );
}
