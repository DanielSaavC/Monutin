import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css"; // tu archivo de estilos

export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    return (
      <div className="header-container">
        <h2 className="header-title" onClick={() => navigate("/")}>
          Monutin
        </h2>
      </div>
    );
  }

  // === Prefijo según tipo de usuario ===
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
      {/* Flecha para volver atrás */}
      <div
        className="header-back"
        title="Regresar a la página anterior"
        onClick={() => navigate(-1)}
      >
        ←
      </div>

      {/* Título principal */}
      <h2 className="header-title" onClick={() => navigate("/biomedico")}>
        Monutin
      </h2>

      {/* Usuario */}
      <div className="header-user" onClick={() => navigate("/ajustes")}>
        {prefijo} {usuario.nickname}
      </div>
    </div>
  );
}
