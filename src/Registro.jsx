import React, { useState } from "react";
import "./App.css";

export default function Registro() {
  const [tipo, setTipo] = useState("natural");
  const [formData, setFormData] = useState({
    nickname: "",
    password: "",
    confirmPassword: "",
    email: "",
    codigo: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);
  };

  return (
    <div className="register-container">
      <h2>📝 Registro</h2>
      <form onSubmit={handleSubmit}>
        <label>Nickname:</label>
        <input
          type="text"
          name="nickname"
          placeholder="Tu usuario"
          required
          value={formData.nickname}
          onChange={handleChange}
        />

        <label>Contraseña:</label>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          required
          value={formData.password}
          onChange={handleChange}
        />

        <label>Confirmar Contraseña:</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <label>Correo electrónico:</label>
        <input
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          required
          value={formData.email}
          onChange={handleChange}
        />

        <label>Selecciona tu perfil:</label>
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
        >
          <option value="natural">Persona natural</option>
          <option value="medico">Médico</option>
          <option value="enfermera">Enfermera</option>
          <option value="tecnico">Técnico</option>
          <option value="biomedico">Biomédico</option>
        </select>

        {tipo !== "natural" && (
          <>
            <label>Código de profesión:</label>
            <input
              type="text"
              name="codigo"
              placeholder="Ingrese su código profesional"
              value={formData.codigo}
              onChange={handleChange}
              required
            />
          </>
        )}

        <button type="submit">Registrarse</button>
      </form>

      <div className="extra-info">
        <p>
          ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
