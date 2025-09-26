import React from "react";

export default function Ajustes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    return <p>⚠️ No hay usuario logueado</p>;
  }

  return (
    <div className="menu-container">
      <h2>⚙️ Ajustes de Usuario</h2>
      <p><b>Nombre:</b> {usuario.nickname}</p>
      <p><b>Email:</b> {usuario.email}</p>
      <p><b>Tipo:</b> {usuario.tipo}</p>
      <button
        onClick={() => {
          localStorage.removeItem("usuario");
          window.location.href = "/login";
        }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}
