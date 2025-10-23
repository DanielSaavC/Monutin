import React from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import "../../../App.css";

export default function Equipos() {
  return (
    <div>
      <Header />
      <div className="menu-container">
        <h2>⚙️ Equipos</h2>

        <div className="grid-menu">
          <Link to="/incubadoras" className="card">
            Incubadoras
          </Link>
          <Link to="/servocunas" className="card">
            Servocunas
          </Link>
          <div className="card">Máquinas de Anestesia</div>
          <Link to="/ventiladores" className="card">
            Ventiladores
          </Link>
        </div>
      </div>
    </div>
  );
}
