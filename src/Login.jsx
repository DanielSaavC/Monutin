import React from "react";
import "./App.css";

export default function Login() {
  return (
    <div className="login-container">
      <h2>🔐 Iniciar sesión</h2>
      <form>
        <label htmlFor="username">Usuario:</label>
        <input type="text" id="username" placeholder="Ingresa tu usuario" />

        <label htmlFor="password">Contraseña:</label>
        <input type="password" id="password" placeholder="••••••••" />

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
