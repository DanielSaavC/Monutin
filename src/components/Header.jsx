import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [menuOpen, setMenuOpen] = useState(false);


  // Si no hay usuario, muestra solo el título
  if (!usuario) {
    return (
      <div className="header-container">
        <h2 className="header-title" onClick={() => navigate("/")}>
          Monutin
        </h2>
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
      {/* Título principal */}
      <h2 className="header-title" onClick={() => navigate("/biomedico")}>
        Monutin
      </h2>

      {/* Contenedor derecho */}
      <div className="header-right">
        {/* Nombre de usuario (solo visible en pantallas grandes) */}
        <div className="header-user" onClick={() => navigate("/ajustes")}>
          {prefijo} {usuario.nickname}
        </div>

        {/* Botón hamburguesa visible solo en móvil */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</div>
        {/* Menú desplegable */}
        <nav className={`menu ${menuOpen ? "active" : ""}`}>
        <button onClick={() => navigate("/biomedico")} className="menu-btn">Inicio</button>
        <button onClick={() => navigate("/ajustes")} className="menu-btn">Ajustes</button>
        <button onClick={() => navigate("/")} className="menu-btn">Cerrar sesión</button>
      </nav>
      </div>
    </header>
  );
}