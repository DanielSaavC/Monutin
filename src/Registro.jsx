import React, { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

export default function Registro() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [tipo, setTipo] = useState("natural"); 
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://monutinbackend.onrender.com/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password, tipo }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Usuario registrado con éxito");
        navigate("/login");
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) {
      alert("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <h2>📝 Registro</h2>
      <form onSubmit={handleRegistro}>
        <label htmlFor="username">Usuario:</label>
        <input
          type="text"
          id="username"
          placeholder="Ingresa tu usuario"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="tipo">Tipo de usuario:</label>
        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="natural">Natural</option>
          <option value="medico">Médico</option>
          <option value="enfermera">Enfermera</option>
          <option value="tecnico">Técnico</option>
          <option value="biomedico">Biomédico</option>
        </select>

        <button type="submit" className="secondary-btn">
          Registrar
        </button>
      </form>
    </div>
  );
}
