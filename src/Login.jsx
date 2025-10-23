import React, { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }), // 👈 backend espera "usuario"
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Bienvenido " + data.user.nombre + " " + data.user.apellidopaterno);
        localStorage.setItem("usuario", JSON.stringify(data.user));

        // Redirección según tipo
        switch (data.user.tipo) {
          case "natural":
            navigate("/natural");
            break;
          case "medico":
            navigate("/medico");
            break;
          case "enfermera":
            navigate("/enfermera");
            break;
          case "tecnico":
            navigate("/tecnico");
            break;
          case "biomedico":
            navigate("/biomedico");
            break;
          default:
            navigate("/");
        }
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) {
      alert("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <h2>🔐 Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <label htmlFor="usuario">Usuario:</label>
        <input
          type="text"
          id="usuario"
          placeholder="Ingresa tu usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
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

        <button type="submit" className="secondary-btn">
          Entrar
        </button>
      </form>

      <button
        type="button"
        className="secondary-btn"
        onClick={() => navigate("/registro")}
      >
        Registrar
      </button>
    </div>
  );
}
