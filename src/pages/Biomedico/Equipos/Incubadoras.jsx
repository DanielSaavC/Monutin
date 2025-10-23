// src/pages/Incubadoras.jsx
import React from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import "../Biomedico.css";

export default function Incubadoras() {
  return (
    <div className="menu-container">
      <h2>🍼 Incubadoras</h2>

      <div className="grid-menu">
        <Link to="/incubadoras/1" className="card">Incubadora 1</Link>
        <Link to="/incubadoras/2" className="card">Incubadora 2</Link>
        <Link to="/incubadoras/3" className="card">Incubadora 3</Link>
        <Link to="/incubadoras/4" className="card">Incubadora 4</Link>
      </div>
    </div>
  );
}
