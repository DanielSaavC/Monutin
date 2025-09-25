import React, { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ Bienvenido " + data.user.nickname);

      // redirección según el tipo de usuario
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

        <button type="submit">Entrar</button>
      </form>

      <button
        type="button"
        className="secondary-btn"
        onClick={() => (window.location.href = "/registro")}
      >
        Registrar
      </button>

      <div className="extra-info">
        <p>
          ¿Olvidaste tu contraseña? <a href="#">Recuperar</a>
        </p>
      </div>
    </div>
  );
}
