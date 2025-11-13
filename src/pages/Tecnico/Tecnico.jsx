import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/Header";

export default function Tecnico() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: "",
    repuestos: "",
    observaciones: "",
    tipo: "preventivo",
  });

  // Cargar equipos delegados
  useEffect(() => {
    if (usuario) {
      axios
        .get(`https://monutinbackend-production.up.railway.app/api/delegaciones/${usuario.id}`)
        .then((res) => setEquipos(res.data))
        .catch((err) => console.error("Error al cargar delegaciones:", err));
    }
  }, [usuario]);

  const handleSubmit = async () => {
    try {
      await axios.post("https://monutinbackend-production.up.railway.app/api/mantenimientos", {
        equipo_id: equipoSeleccionado.equipo_id,
        tecnico_id: usuario.id,
        descripcion: formData.descripcion,
        repuestos: formData.repuestos,
        observaciones: formData.observaciones,
        tipo: formData.tipo,
      });

      alert("✅ Mantenimiento registrado correctamente.");
      setMostrarFormulario(false);
      setEquipoSeleccionado(null);
    } catch (err) {
      alert("❌ Error al registrar mantenimiento: " + err.message);
    }
  };

  return (
    <div>
      <Header />
      <h2>👨‍🔧 Panel del Técnico</h2>

      {/* LISTA DE EQUIPOS */}
      <div className="lista-equipos">
        {equipos.length === 0 ? (
          <p>No tienes equipos delegados actualmente.</p>
        ) : (
          equipos.map((eq) => (
            <div
              key={eq.equipo_id}
              className="equipo-card"
              onClick={() => setEquipoSeleccionado(eq)}
            >
              <h4>{eq.nombre_equipo}</h4>
              <p>Marca: {eq.marca}</p>
              <p>Modelo: {eq.modelo}</p>
            </div>
          ))
        )}
      </div>

      {/* DETALLE DEL EQUIPO */}
      {equipoSeleccionado && !mostrarFormulario && (
        <div className="detalle-equipo">
          <h3>🔧 {equipoSeleccionado.nombre_equipo}</h3>
          <p><strong>Problema:</strong> {equipoSeleccionado.descripcion || "Sin descripción"}</p>
          <button onClick={() => setMostrarFormulario(true)}>🧾 Marcar como reparado</button>
          <button onClick={() => setEquipoSeleccionado(null)}>❌ Cerrar</button>
        </div>
      )}

      {/* FORMULARIO DE MANTENIMIENTO */}
      {mostrarFormulario && (
        <div className="modal">
          <div className="modal-content">
            <h3>🧾 Registrar Mantenimiento</h3>
            <label>Descripción del trabajo:</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
            <label>Repuestos utilizados:</label>
            <input
              value={formData.repuestos}
              onChange={(e) => setFormData({ ...formData, repuestos: e.target.value })}
            />
            <label>Observaciones:</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
            <label>Tipo de mantenimiento:</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="predictivo">Predictivo</option>
            </select>

            <div className="botones-modal">
              <button onClick={handleSubmit}>✅ Guardar</button>
              <button onClick={() => setMostrarFormulario(false)}>❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
