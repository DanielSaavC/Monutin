import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "./api";
import "./App.css";

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellidopaterno: "",
    apellidomaterno: "",
    usuario: "", // antes nickname
    password: "",
    confirmPassword: "",
    email: "",
    tipo: "natural",
    codigo: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("❌ Las contraseñas no coinciden");
      return;
    }

    const usuario = {
      nombre: formData.nombre,
      apellidopaterno: formData.apellidopaterno,
      apellidomaterno: formData.apellidomaterno,
      usuario: formData.usuario,
      password: formData.password,
      email: formData.email,
      tipo: formData.tipo,
      codigo: formData.tipo !== "natural" ? formData.codigo : null,
    };

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ " + data.message);
        navigate("/login");
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) {
      alert("⚠️ Error de conexión con el servidor");
    }
  };

  return (
<div className="auth-container">
  <div className="auth-texto">
    <h2>📝 Registro</h2>
    <form onSubmit={handleSubmit}>
        <label>Nombre:</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />

        <label>Apellido Paterno:</label>
        <input
          type="text"
          name="apellidopaterno"
          value={formData.apellidopaterno}
          onChange={handleChange}
          required
        />

        <label>Apellido Materno:</label>
        <input
          type="text"
          name="apellidomaterno"
          value={formData.apellidomaterno}
          onChange={handleChange}
          required
        />

        <label>Usuario:</label>
        <input
          type="text"
          name="usuario"
          placeholder="Tu usuario"
          value={formData.usuario}
          onChange={handleChange}
          required
        />

        <label>Contraseña:</label>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label>Confirmar Contraseña:</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <label>Correo electrónico:</label>
        <input
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Selecciona tu perfil:</label>
        <select
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          required
        >
          <option value="natural">Persona natural</option>
          <option value="medico">Médico</option>
          <option value="enfermera">Enfermera</option>
          <option value="tecnico">Técnico</option>
          <option value="biomedico">Biomédico</option>
        </select>

        {formData.tipo !== "natural" && (
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

         <button type="submit" className="btn-primary">Registrarse</button>
    </form>
    <div className="extra-info">
      <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  </div>

  <div className="auth-imagen">
    <img src={process.env.PUBLIC_URL + "/images/terapiaintermedia.jpg"} alt="Monutin presentación" />
  </div>
</div>
  );
}
