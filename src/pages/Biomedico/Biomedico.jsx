import React from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";

export default function Biomedico() {
  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Biomédico</h1>

        <div className="grid-menu">
          {/* === SECCIÓN DE EQUIPOS === */}
          <Link to="/equipos" className="card">Equipos</Link>
          <Link to="/imagenologia" className="card">Áreas</Link>
          <Link to="/hospitalviedma" className="card">Hospitales</Link>
          <Link to="/verseguimiento" className="card">Seguimiento</Link>
          <Link to="/adquisicion" className="card">Registrar</Link>
          <Link to="/ajustes" className="card">Ajustes</Link>
        </div>
      </div>
    </div>
  );
}
