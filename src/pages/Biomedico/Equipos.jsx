// src/pages/Equipos.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Biomedico.css";

export default function Equipos() {
  return (
    <div className="menu-container">
      <h2>⚙️ Equipos</h2>

      <div className="grid-menu">
        <Link to="/incubadoras" className="card">Incubadoras</Link>
        <div className="card">Servocunas</div>
        <div className="card">Máquinas de Anestesia</div>
        <div className="card">Ventiladores</div>
      </div>
    </div>
  );
}
