import React from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";

export default function Biomedico() {
  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Área Biomédico</h1>

        <div className="grid-menu">
          {/* === SECCIÓN DE EQUIPOS === */}
          <Link to="/equipos" className="card">
            Equipos
          </Link>

          {/* === SECCIÓN DE ÁREAS === */}
          <Link to="/imagenologia" className="card">
            Áreas
          </Link>

          {/* === SECCIÓN DE HOSPITALES === */}
          <Link to="/hospitalviedma" className="card">
            Hospitales
          </Link>

          {/* === SEGUIMIENTO === */}
          <Link to="/verseguimiento" className="card">
            Seguimiento
          </Link>

          {/* === REGISTRO === */}
          <Link to="/adquisicion" className="card">
            Registrar
          </Link>

          {/* === AJUSTES === */}
          <Link to="/ajustes" className="card">
            Ajustes
          </Link>
        </div>
      </div>
    </div>
  );
}
