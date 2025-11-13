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
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✅ Bienvenido ${data.user.nombre} ${data.user.apellidopaterno}`);
        localStorage.setItem("usuario", JSON.stringify(data.user));

        // 🔹 Verificar si hay una URL de redirección pendiente
        const redirectPath = localStorage.getItem("redirectAfterLogin");

        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath); // 👉 Redirigir al equipo que venía del QR
        } else {
          // 🔹 Comportamiento normal según tipo de usuario
          switch (data.user.tipo) {
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
        }
      } else {
        alert("❌ " + data.error);
      }
    } catch (error) {
      alert("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="auth-container">
      {/* === COLUMNA IZQUIERDA: FORMULARIO === */}
      <div className="auth-texto">
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

          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>

        <div className="extra-info">
          <p>
            ¿No tienes una cuenta?{" "}
            <button
              onClick={() => navigate("/registro")}
              className="link-btn"
              style={{
                background: "none",
                border: "none",
                color: "#00796B",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>

      {/* === COLUMNA DERECHA: IMAGEN === */}
      <div className="auth-imagen">
        <img src={process.env.PUBLIC_URL + "/images/utin.jpg"} alt="Monutin presentación" />
      </div>
    </div>
  );
}
