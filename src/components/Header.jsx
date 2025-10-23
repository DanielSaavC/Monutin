import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [menuOpen, setMenuOpen] = useState(false);

  // Si no hay usuario, muestra solo el logo principal
  if (!usuario) {
    return (
      <div className="header-container">
        <img
          src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
          alt="Logo Monutin"
          className="header-logo"
          onClick={() => navigate("/")}
        />
      </div>
    );
  }

  // Prefijo según tipo de usuario
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

  // Función para cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <header className="header-container">
      {/* Flecha atrás */}
      <div className="header-back" onClick={() => navigate(-1)}>←</div>

      {/* Logo principal (clickeable) */}
      <img
        src={`${process.env.PUBLIC_URL}/images/Monutin.png`}
        alt="Logo Monutin"
        className="header-logo"
        onClick={() => navigate("/biomedico")}
      />

      {/* Contenedor derecho */}
      <div className="header-right">
        {/* Nombre de usuario */}
        <div className="header-user" onClick={() => navigate("/ajustes")}>
          {prefijo} {usuario.nickname}
        </div>

        {/* Botón hamburguesa visible solo en móvil */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</div>

        {/* Menú desplegable */}
        <nav className={`menu ${menuOpen ? "active" : ""}`}>
          <button onClick={() => navigate("/biomedico")} className="menu-btn">Inicio</button>
          <button onClick={() => navigate("/ajustes")} className="menu-btn">Ajustes</button>
          <button onClick={cerrarSesion} className="menu-btn">Cerrar sesión</button>
        </nav>
      </div>
    </header>
  );
}
