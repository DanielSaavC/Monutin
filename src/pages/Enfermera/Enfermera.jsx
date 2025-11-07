import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import axios from "axios";

export default function Enfermera() {
  const [equipos, setEquipos] = useState([]);
  const [equipo, setEquipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false);

  // ✅ Cargar equipos disponibles
  useEffect(() => {
    axios.get("https://monutinbackend-production.up.railway.app/api/equipos")
      .then(res => setEquipos(res.data))
      .catch(() => setEquipos([]));
  }, []);

  // ✅ Enviar reporte al backend
const enviarReporte = async () => {
  if (!equipo || !descripcion) {
    return setMensaje("⚠️ Complete todos los campos.");
  }

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // 🔹 PASO 1: Crear FormData (no JSON)
  const formData = new FormData();
  formData.append("id_enfermera", usuario.id);
  formData.append("nombre_enfermera", usuario.nombre);
  formData.append("equipo", equipo);
  formData.append("descripcion", descripcion);
  
  // 🔹 PASO 2: Agregar el archivo tal cual (no base64)
  if (foto) {
    formData.append("foto", foto); // ⬅️ archivo File original
  }

  try {
    await axios.post(
      "https://monutinbackend-production.up.railway.app/api/reportes",
      formData,
      {
        // 🔹 PASO 3: Cabecera correcta
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    setMensaje("✅ Reporte enviado correctamente.");
    // Limpiar formulario
    setEquipo("");
    setDescripcion("");
    setFoto(null);
    document.querySelector('input[type="file"]').value = "";
    
  } catch (error) {
    console.error("❌ Error:", error);
    setMensaje("❌ Error al enviar el reporte.");
  }
};
// Función auxiliar
const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});


  // ✅ Consultar reportes anteriores
  const cargarHistorial = async () => {
    const id = localStorage.getItem("id_usuario");
    const res = await axios.get(`https://monutinbackend-production.up.railway.app/api/reportes/enfermera/${id}`);
    setHistorial(res.data);
    setVerHistorial(true);
  };

  return (
    <div className="panel-enfermera">
      <Header />
      <div className="contenido">
        <h2>🩺 Panel de Enfermera</h2>

        <div className="acciones">
          <button onClick={() => setVerHistorial(false)}>➕ Nuevo Reporte</button>
          <button onClick={cargarHistorial}>📜 Ver Historial</button>
        </div>

        {!verHistorial ? (
          <div className="form-reporte">
            <h3>📋 Crear nuevo reporte</h3>
              <select value={equipo} onChange={e => setEquipo(e.target.value)}>
                <option value="">Seleccione un equipo</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.nombre_equipo}>
                    {eq.nombre_equipo} — {eq.marca} {eq.modelo}
                  </option>
                ))}
              </select>

            <textarea
              placeholder="Describa el problema (ej: cable pelado, pantalla dañada...)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={e => setFoto(e.target.files[0])}
            />

            <button onClick={enviarReporte}>🚀 Enviar reporte</button>
            {mensaje && <p className="mensaje">{mensaje}</p>}
          </div>
        ) : (
          <div className="historial">
            <h3>📜 Mis reportes enviados</h3>
            {historial.length === 0 ? (
              <p>No hay reportes aún.</p>
            ) : (
              historial.map(rep => (
                <div key={rep.id} className="reporte-item">
                  <p><strong>Equipo:</strong> {rep.equipo}</p>
                  <p><strong>Descripción:</strong> {rep.descripcion}</p>
                  <p><strong>Fecha:</strong> {rep.fecha}</p>
                  {rep.foto && <img src={rep.foto} alt="reporte" className="foto-reporte" />}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
