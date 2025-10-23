// src/pages/Incubadoras.jsx
import React from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import "../Biomedico.css";

export default function Servocunas() {
  return (
    <div className="menu-container">
      <Header /> 
      <h2>🍼 Servocunas</h2>

      <div className="grid-menu">
        <Link to="/servocunas/1" className="card">Servocuna 1</Link>
        <Link to="/servocunas/2" className="card">Servocuna 2</Link>
        <Link to="/servocunas/3" className="card">Servocuna 3</Link>
        <Link to="/servocunas/4" className="card">Servocuna 4</Link>
      </div>
    </div>
  );
}
