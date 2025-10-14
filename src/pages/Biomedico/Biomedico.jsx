import React from "react";
import { Link} from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";

export default function Biomedico() {
  return (
    <div>
      <Header />
      <div className="menu-container">
        <div className="grid-menu">
          <Link to="/equipos" className="card">Equipos</Link>
          <div className="card">Áreas</div>
          <div className="card">Hospitales</div>
          <div className="card">Seguimiento</div>
          <div className="card">Registrar</div>
          <div className="card">Ajustes</div>
        </div>
      </div>
    </div>
  );
}
