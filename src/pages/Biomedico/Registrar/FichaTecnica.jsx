import React, { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import axios from "axios";
import "../../../App.css";
import Webcam from "react-webcam";

export default function FichaTecnica() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedor, setProveedor] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    correo: "",
  });

  const [datosTecnicos, setDatosTecnicos] = useState([]);
  const [accesorios, setAccesorios] = useState([]);
  const [observaciones, setObservaciones] = useState([]);

  const [nuevoDato, setNuevoDato] = useState({ funcion: "", info: "" });
  const [nuevoAccesorio, setNuevoAccesorio] = useState({ funcion: "", info: "" });
  const [nuevaObs, setNuevaObs] = useState({ funcion: "", info: "" });

  const [manuales, setManuales] = useState({
    operacion: "",
    instalacion: "",
    servicio: "",
  });

  const [estado, setEstado] = useState({
    nuevo: false,
    bueno: false,
    reparable: false,
    descartable: false,
  });

  const [frecuencia, setFrecuencia] = useState("");
  const [nombreElaboracion, setNombreElaboracion] = useState("");
  const [imagenBase64, setImagenBase64] = useState(null);

  // ==== CÁMARA ====
  const webcamRef = useRef(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);

  const capturarFoto = () => {
    const imagen = webcamRef.current.getScreenshot();
    setImagenBase64(imagen);
    setMostrarCamara(false);
  };

  const handleImageUpload = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => setImagenBase64(lector.result);
      lector.readAsDataURL(archivo);
    }
  };

  // ==== CARGAR PROVEEDORES ====
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/proveedores")
      .then((res) => setProveedores(res.data))
      .catch(() => console.warn("⚠️ No se pudieron cargar los proveedores"));
  }, []);

  const handleProveedorChange = (e) => {
    const selected = proveedores.find((p) => p.nombre === e.target.value);
    if (selected) setProveedor(selected);
  };

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const agregarFila = (tipo) => {
    if (tipo === "datos") {
      if (!nuevoDato.funcion || !nuevoDato.info) return alert("Complete ambos campos.");
      setDatosTecnicos([...datosTecnicos, nuevoDato]);
      setNuevoDato({ funcion: "", info: "" });
    } else if (tipo === "accesorios") {
      if (!nuevoAccesorio.funcion || !nuevoAccesorio.info) return alert("Complete ambos campos.");
      setAccesorios([...accesorios, nuevoAccesorio]);
      setNuevoAccesorio({ funcion: "", info: "" });
    } else if (tipo === "observaciones") {
      if (!nuevaObs.funcion || !nuevaObs.info) return alert("Complete ambos campos.");
      setObservaciones([...observaciones, nuevaObs]);
      setNuevaObs({ funcion: "", info: "" });
    }
  };

const generarFichaPDF = async () => {
  try {
    const payload = {
      proveedor,
      datosTecnicos,
      accesorios,
      observaciones,
      manuales,
      estado,
      frecuencia,
      nombreElaboracion,
      imagenBase64,
    };

    // 💾 1. Guardar ficha técnica en BD
    await axios.post("http://localhost:4000/api/fichatecnica", payload);
    alert("✅ Ficha técnica guardada correctamente en la base de datos.");

    // 🧾 2. (Opcional) Generar PDF
    const response = await axios.post(
      "http://localhost:4000/api/fichatecnica/pdf",
      payload,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ficha_Tecnica.pdf");
    document.body.appendChild(link);
    link.click();

    alert("📄 Ficha técnica generada correctamente");
  } catch (err) {
    console.error("❌ Error al generar ficha técnica:", err);
    alert("❌ Error al guardar o generar la ficha técnica");
  }
};


  // ==== RENDER ====
  return (
    <div className="adquisicion-container">
      <Header />
      <div className="form-card">
        <h1>📋 Ficha Técnica del Equipo</h1>

        {/* === FOTO DEL EQUIPO === */}
        <section>
          <h2>📷 Fotografía del Equipo</h2>

          {imagenBase64 ? (
            <div className="foto-preview-container">
              <img src={imagenBase64} alt="Equipo" className="foto-preview" />
              <div className="foto-buttons">
                <button onClick={() => setImagenBase64(null)}>🗑️ Eliminar</button>
                <button onClick={() => setMostrarCamara(true)}>📸 Tomar otra</button>
              </div>
            </div>
          ) : mostrarCamara ? (
            <div className="camara-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="webcam"
                videoConstraints={{
                  facingMode: "environment",
                }}
              />
              <div className="camara-buttons">
                <button onClick={capturarFoto}>📷 Capturar</button>
                <button onClick={() => setMostrarCamara(false)}>❌ Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="foto-opciones">
              <button type="button" className="btn-camara">
                📷 Tomar Foto
              </button>
              <label className="btn-upload">
                🖼️ Subir Imagen
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

          )}
        </section>

        {/* === DATOS DEL PROVEEDOR === */}
        <section>
          <h2>Proveedor</h2>
          <select onChange={handleProveedorChange} defaultValue="">
            <option value="">Seleccionar proveedor existente o nuevo</option>
            {proveedores.map((p) => (
              <option key={p.nombre} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>

          <input
            name="nombre"
            placeholder="Nombre"
            value={proveedor.nombre}
            onChange={(e) => handleChange(e, setProveedor)}
          />
          <input
            name="direccion"
            placeholder="Dirección"
            value={proveedor.direccion}
            onChange={(e) => handleChange(e, setProveedor)}
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={proveedor.telefono}
            onChange={(e) => handleChange(e, setProveedor)}
          />
          <input
            name="correo"
            placeholder="Correo"
            value={proveedor.correo}
            onChange={(e) => handleChange(e, setProveedor)}
          />
        </section>

        {/* === DATOS TÉCNICOS === */}
        <section>
          <h2>Datos Técnicos</h2>
          <div className="input-group">
            <input
              placeholder="Función"
              name="funcion"
              value={nuevoDato.funcion}
              onChange={(e) => handleChange(e, setNuevoDato)}
            />
            <textarea
              placeholder="Información"
              name="info"
              value={nuevoDato.info}
              onChange={(e) => handleChange(e, setNuevoDato)}
            />
            <button className="btn-add" onClick={() => agregarFila("datos")}>
              ➕ Agregar
            </button>
          </div>
          <ul>
            {datosTecnicos.map((d, i) => (
              <li key={i}>
                <b>{d.funcion}:</b> {d.info}
              </li>
            ))}
          </ul>
        </section>

        {/* === ACCESORIOS === */}
        <section>
          <h2>Accesorios</h2>
          <div className="input-group">
            <input
              placeholder="Función"
              name="funcion"
              value={nuevoAccesorio.funcion}
              onChange={(e) => handleChange(e, setNuevoAccesorio)}
            />
            <textarea
              placeholder="Información"
              name="info"
              value={nuevoAccesorio.info}
              onChange={(e) => handleChange(e, setNuevoAccesorio)}
            />
            <button className="btn-add" onClick={() => agregarFila("accesorios")}>
              ➕ Agregar
            </button>
          </div>
          <ul>
            {accesorios.map((a, i) => (
              <li key={i}>
                <b>{a.funcion}:</b> {a.info}
              </li>
            ))}
          </ul>
        </section>

        {/* === OBSERVACIONES === */}
        <section>
          <h2>Observaciones</h2>
          <div className="input-group">
            <input
              placeholder="Función"
              name="funcion"
              value={nuevaObs.funcion}
              onChange={(e) => handleChange(e, setNuevaObs)}
            />
            <textarea
              placeholder="Información"
              name="info"
              value={nuevaObs.info}
              onChange={(e) => handleChange(e, setNuevaObs)}
            />
            <button className="btn-add" onClick={() => agregarFila("observaciones")}>
              ➕ Agregar
            </button>
          </div>
          <ul>
            {observaciones.map((o, i) => (
              <li key={i}>
                <b>{o.funcion}:</b> {o.info}
              </li>
            ))}
          </ul>
        </section>

        {/* === MANUALES === */}
        <section>
          <h2>📘 Manuales</h2>

          {["operacion", "instalacion", "servicio"].map((key) => (
            <div className="input-row" key={key}>
              <label>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </label>
              <select
                value={manuales[key]}
                onChange={(e) =>
                  setManuales({ ...manuales, [key]: e.target.value })
                }
              >
                <option value="">Seleccione</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          ))}
        </section>

        {/* === ESTADO DEL EQUIPO === */}
        <section>
          <h2>⚙️ Estado del Equipo</h2>

          <div className="check-group">
            {["nuevo", "bueno", "reparable", "descartable"].map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={estado[key]}
                  onChange={(e) =>
                    setEstado({ ...estado, [key]: e.target.checked })
                  }
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
        </section>


        {/* === FRECUENCIA === */}
        <section>
          <h2>Frecuencia de Mantenimiento</h2>
          <input
            placeholder="Ej: Semestral, Anual..."
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
          />
        </section>

        {/* === ELABORACIÓN === */}
        <section>
          <h2>Elaboración</h2>
          <input
            placeholder="Nombre del responsable"
            value={nombreElaboracion}
            onChange={(e) => setNombreElaboracion(e.target.value)}
          />
        </section>

        {/* === BOTÓN FINAL === */}
        <button className="btn-generar" onClick={generarFichaPDF}>
          💾 Guardar y Generar PDF
        </button>

      </div>
    </div>
  );
}
