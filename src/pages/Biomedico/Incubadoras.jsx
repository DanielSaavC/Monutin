// src/pages/Incubadoras.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Biomedico.css";

export default function Incubadoras() {
  return (
    <div className="menu-container">
      <h2>🍼 Incubadoras</h2>

      <div className="grid-menu">
        <Link to="/incubadoras/1" className="card">Incuba 1</Link>
        <Link to="/incubadoras/2" className="card">Incuba 2</Link>
        <Link to="/incubadoras/3" className="card">Incuba 3</Link>
        <Link to="/incubadoras/4" className="card">Incuba 4</Link>
      </div>
    </div>
  );
}
