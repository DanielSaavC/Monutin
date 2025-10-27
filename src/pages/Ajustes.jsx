import React, { useState } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

export default function Ajustes() {
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  const [usuario, setUsuario] = useState(usuarioGuardado);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...usuario });
  const [cargando, setCargando] = useState(false);

  if (!usuario) {
    return <p>⚠️ No hay usuario logueado</p>;
  }

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

// Guardar cambios (UPDATE)
const handleGuardar = async () => {
  setCargando(true);
  try {
    const dataToSend = { ...formData };
    if (!dataToSend.password || dataToSend.password.trim() === "") {
      delete dataToSend.password; // No enviar contraseña vacía
    }
    const response = await fetch(`${API_URL}/updateUser/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ Datos actualizados correctamente");
      localStorage.setItem("usuario", JSON.stringify({ ...formData, password: undefined }));
      setUsuario({ ...formData, password: undefined });
      setEditando(false);
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (err) {
    alert("⚠️ Error de conexión con el servidor");
  } finally {
    setCargando(false);
  }
};


  // Eliminar cuenta (DELETE)
  const handleEliminar = async () => {
    const confirmar = window.confirm("⚠️ ¿Seguro que deseas eliminar tu cuenta?");
    if (!confirmar) return;

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/deleteUser/${usuario.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("🗑️ Cuenta eliminada correctamente");
        localStorage.removeItem("usuario");
        window.location.href = "/";
      } else {
        const data = await response.json();
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("⚠️ Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  // Cerrar sesión (idéntico al header)
  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/"; // ✅ fuerza recarga completa (compatible con HashRouter)
  };
  return (
    <div className="menu-container">
      <Header />
      <h2>⚙️ Ajustes de Usuario</h2>

      {!editando ? (
        <div className="ajustes-card">
          <p><b>Nombre:</b> {usuario.nombre}</p>
          <p><b>Apellido Paterno:</b> {usuario.apellidopaterno}</p>
          <p><b>Apellido Materno:</b> {usuario.apellidomaterno}</p>
          <p><b>Usuario:</b> {usuario.usuario}</p>
          <p><b>Email:</b> {usuario.email}</p>
          <p><b>Tipo:</b> {usuario.tipo}</p>

          <div className="ajustes-btns">
            <button onClick={() => setEditando(true)}>✏️ Editar datos</button>
            <button onClick={handleEliminar} className="delete-btn">🗑️ Eliminar cuenta</button>
            <button onClick={cerrarSesion} className="secondary-btn">🚪 Cerrar sesión</button>
          </div>
        </div>
      ) : (
        <div className="ajustes-card">
              <h3>🛠️ Editar información</h3>

              <label>Nombre:</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange} />

              <label>Apellido paterno:</label>
              <input name="apellidopaterno" value={formData.apellidopaterno} onChange={handleChange} />

              <label>Apellido materno:</label>
              <input name="apellidomaterno" value={formData.apellidomaterno} onChange={handleChange} />

              <label>Usuario:</label>
              <input name="usuario" value={formData.usuario} onChange={handleChange} />

              <label>Correo electrónico:</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} />

              <label>Nueva contraseña (opcional):</label>
              <input name="password" type="password" placeholder="••••••" onChange={handleChange} />

          <div className="ajustes-btns">
              <button onClick={handleGuardar} disabled={cargando || !formData.nombre}>
                {cargando ? "Guardando..." : "💾 Guardar cambios"}
              </button>
            <button onClick={() => setEditando(false)} className="secondary-btn">
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
