// src/pages/Incubadoras.jsx
import React from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import "../Biomedico.css";

export default function Ventiladores() {
  return (
    <div className="menu-container">
      <Header /> 
      <h2>🍼 Ventiladores</h2>

      <div className="grid-menu">
        <Link to="/ventiladores/1" className="card">ventilador 1</Link>
        <Link to="/ventiladores/2" className="card">ventilador 2</Link>
        <Link to="/ventiladores/3" className="card">ventilador 3</Link>
        <Link to="/ventiladores/4" className="card">ventilador 4</Link>
      </div>
    </div>
  );
}
