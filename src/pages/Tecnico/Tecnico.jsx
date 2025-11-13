import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Header from "../../components/Header";

// Define la URL base de tu API en un solo lugar
const API_BASE_URL = "https://monutinbackend-production.up.railway.app/api";

// Estado inicial del formulario para resetearlo fácilmente
const initialFormState = {
  descripcion: "",
  repuestos: "",
  observaciones: "",
  tipo: "preventivo",
};

export default function Tecnico() {
  // --- ESTADO DEL COMPONENTE ---
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // Estados para una mejor UX (Experiencia de Usuario)
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Obtener el usuario de localStorage de forma segura
  const usuario = useMemo(
    () => JSON.parse(localStorage.getItem("usuario") || "null"),
    []
  );

  // --- EFECTOS (CARGA DE DATOS) ---
  useEffect(() => {
    if (!usuario || !usuario.id) {
      setError("No se pudo identificar al usuario. Por favor, inicie sesión.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Limpiar errores previos

    axios
      .get(`${API_BASE_URL}/delegaciones/${usuario.id}`)
      .then((res) => {
        setEquipos(res.data);
      })
      .catch((err) => {
        console.error("Error al cargar delegaciones:", err);
        setError("No se pudieron cargar los equipos asignados.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [usuario]); // Depende del objeto 'usuario'

  // --- MANEJADORES DE EVENTOS ---

  // Manejador genérico para todos los inputs del formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir recarga de la página
    if (!selectedEquipo || !usuario) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      equipo_id: selectedEquipo.equipo_id,
      tecnico_id: usuario.id,
      ...formData,
    };

    try {
      await axios.post(`${API_BASE_URL}/mantenimientos`, payload);

      alert("✅ Mantenimiento registrado correctamente.");

      // Limpiar y cerrar
      setIsFormVisible(false);
      setSelectedEquipo(null);
      setFormData(initialFormState);
    } catch (err) {
      console.error("Error al registrar mantenimiento:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Error desconocido";
      setError(`Error al registrar: ${errorMsg}`);
      alert(`❌ Error al registrar mantenimiento: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNCIONES DE RENDERIZADO (Lógica de UI) ---

  // Muestra el estado de carga
  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="container">
          <h2>Equipos Delegados</h2>
          <p>Cargando equipos...</p>
        </div>
      </div>
    );
  }

  // Muestra si hay un error de carga
  if (error && !isLoading) {
    return (
      <div>
        <Header />
        <div className="container">
          <h2>Equipos Delegados</h2>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div>
      <Header />
      <div className="container"> {/* (Recomendado) Añadir un contenedor */}
        <h2>Equipos Delegados</h2>

        {/* LISTA DE EQUIPOS */}
        <div className="lista-equipos">
          {equipos.length === 0 ? (
            <p>No tienes equipos delegados actualmente.</p>
          ) : (
            equipos.map((eq) => (
              <div
                key={eq.equipo_id}
                className="equipo-card"
                onClick={() => setSelectedEquipo(eq)}
              >
                <h4>{eq.nombre_equipo}</h4>
                <p>Marca: {eq.marca}</p>
                <p>Modelo: {eq.modelo}</p>
              </div>
            ))
          )}
        </div>

        {/* DETALLE DEL EQUIPO (MODAL/VISTA) */}
        {selectedEquipo && !isFormVisible && (
          <div className="detalle-equipo">
            <h3>🔧 {selectedEquipo.nombre_equipo}</h3>
            <p>
              <strong>Problema:</strong>{" "}
              {selectedEquipo.descripcion || "Sin descripción"}
            </p>
            <button onClick={() => setIsFormVisible(true)}>
              🧾 Marcar como reparado
            </button>
            <button onClick={() => setSelectedEquipo(null)}>❌ Cerrar</button>
          </div>
        )}

        {/* FORMULARIO DE MANTENIMIENTO (MODAL) */}
        {isFormVisible && selectedEquipo && (
          <div className="modal">
            <form className="modal-content" onSubmit={handleSubmit}>
              <h3>🧾 Registrar Mantenimiento</h3>
              
              <label htmlFor="descripcion">Descripción del trabajo:</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleFormChange}
                required
              />

              <label htmlFor="repuestos">Repuestos utilizados:</label>
              <input
                id="repuestos"
                name="repuestos"
                value={formData.repuestos}
                onChange={handleFormChange}
              />

              <label htmlFor="observaciones">Observaciones:</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleFormChange}
              />

              <label htmlFor="tipo">Tipo de mantenimiento:</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleFormChange}
              >
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="predictivo">Predictivo</option>
              </select>

              <div className="botones-modal">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "✅ Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  disabled={isSubmitting}
                >
                  ❌ Cancelar
                </button>
              </div>
              
              {/* Muestra un error si falla el envío del formulario */}
              {error && <p className="error-message">{error}</p>}

            </form>
          </div>
        )}
      </div>
    </div>
  );
}