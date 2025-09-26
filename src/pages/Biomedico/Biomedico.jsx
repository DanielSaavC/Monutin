import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../App.css";

export default function Biomedico() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    return <p>⚠️ No hay usuario logueado</p>;
  }

  // Asignar prefijo según el tipo
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

  const handleUserClick = () => {
    navigate("/ajustes");
  };

  return (
    <div className="menu-container">
      <h2>
        Monitoreo -{" "}
        <span
          style={{ cursor: "pointer", color: "blue" }}
          onClick={handleUserClick}
        >
          {prefijo} {usuario.nickname}
        </span>
      </h2>

      <div className="grid-menu">
        <Link to="/equipos" className="card">Equipos</Link>
        <div className="card">Áreas</div>
        <div className="card">Hospitales</div>
        <div className="card">Seguimiento</div>
        <div className="card">Registrar</div>
        <div className="card">Ajustes</div>
      </div>
    </div>
  );
}
