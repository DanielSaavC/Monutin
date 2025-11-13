import React, { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import axios from "axios";
import Webcam from "react-webcam";
import "../../../App.css";

export default function FichaTecnica() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedor, setProveedor] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    correo: "",
  });
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [codigo, setCodigo] = useState("");
  const [servicio, setServicio] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [garantia, setGarantia] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [fechaCompra, setFechaCompra] = useState("");

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

  const [mostrarCamara, setMostrarCamara] = useState(false);
  const webcamRef = useRef(null);

  // === CARGAR PROVEEDORES ===
  useEffect(() => {
    axios
      .get("https://monutinbackend-production.up.railway.app/api/proveedores")
      .then((res) => setProveedores(res.data))
      .catch((err) => console.warn("⚠️ No se pudieron cargar los proveedores", err));
  }, []);

  // === MANEJO DE FOTO ===
  const abrirCamara = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setMostrarCamara(true);
    } catch (error) {
      alert("❌ No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const capturarFoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImagenBase64(imageSrc);
      setMostrarCamara(false);
    } else {
      alert("⚠️ No se pudo capturar la imagen");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagenBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProveedorChange = (e) => {
    const selected = proveedores.find((p) => p.nombre === e.target.value);
    if (selected) setProveedor(selected);
  };

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const agregarFila = (tipo) => {
    const check = (obj) => obj.funcion && obj.info;
    if (tipo === "datos" && check(nuevoDato)) {
      setDatosTecnicos([...datosTecnicos, nuevoDato]);
      setNuevoDato({ funcion: "", info: "" });
    } else if (tipo === "accesorios" && check(nuevoAccesorio)) {
      setAccesorios([...accesorios, nuevoAccesorio]);
      setNuevoAccesorio({ funcion: "", info: "" });
    } else if (tipo === "observaciones" && check(nuevaObs)) {
      setObservaciones([...observaciones, nuevaObs]);
      setNuevaObs({ funcion: "", info: "" });
    } else {
      alert("⚠️ Complete ambos campos antes de agregar.");
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
      nombreEquipo,
      marca,
      modelo,
      serie,
      codigo,
      servicio,
      ubicacion,
      garantia,
      procedencia,
      fechaCompra
    };

    // 1️⃣ Guardar ficha
    const res = await axios.post(
      "https://monutinbackend-production.up.railway.app/api/fichatecnica",
      payload
    );

    const fichaId = res.data.id;
    alert("✅ Ficha guardada con ID: " + fichaId);

    // 2️⃣ Generar PDF (llamando al endpoint correcto)
    const pdfRes = await axios.get(
      `https://monutinbackend-production.up.railway.app/api/fichatecnica/${fichaId}/pdf`,
      { responseType: "blob" }
    );

    // 3️⃣ Descargar el PDF
    const url = URL.createObjectURL(new Blob([pdfRes.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ficha_Tecnica_${fichaId}.pdf`;
    link.click();
  } catch (error) {
    console.error("❌ Error al guardar/generar ficha:", error);
    alert("❌ Error al guardar o generar la ficha técnica.");
  }
};


  return (
    <div className="adquisicion-container">
      <Header />
      <div className="form-card">
        <h1>📋 Ficha Técnica del Equipo</h1>

        {/* === FOTO === */}
        <section>
          <h2>📷 Fotografía</h2>
          {imagenBase64 ? (
            <div className="foto-preview-container">
              <img src={imagenBase64} alt="Equipo" className="foto-preview" />
              <div className="foto-buttons">
                <button onClick={() => setImagenBase64(null)}>🗑️ Eliminar</button>
                <button onClick={abrirCamara}>📸 Nueva Foto</button>
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
                  facingMode: { exact: "environment" }, // ✅ fuerza cámara trasera
                }}
              />

              <div className="camara-buttons">
                <button onClick={capturarFoto}>📷 Capturar</button>
                <button onClick={() => setMostrarCamara(false)}>❌ Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="foto-opciones">
              <button className="btn-camara" onClick={abrirCamara}>
                <span>📷 Tomar Foto</span>
              </button>
              <label className="btn-upload">
                <span>🖼️ Subir Imagen</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}
        </section>
        {/* === DATOS GENERALES DEL EQUIPO === */}
        <section>
          <h2>Datos Generales del Equipo</h2>

          <input
            placeholder="Nombre del Equipo"
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
          />
          <input
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />
          <input
            placeholder="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          />
          <input
            placeholder="Serie"
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
          />
          <input
            placeholder="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <input
            placeholder="Servicio"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
          />
          <input
            placeholder="Ubicación"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
          <input
            placeholder="Garantía"
            value={garantia}
            onChange={(e) => setGarantia(e.target.value)}
          />
          <input
            placeholder="Procedencia"
            value={procedencia}
            onChange={(e) => setProcedencia(e.target.value)}
          />
          <label>Fecha de Compra:</label>
          <input
            type="date"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
          />
        </section>

        {/* === PROVEEDOR === */}
        <section>
          <h2>Proveedor</h2>
          <select onChange={handleProveedorChange}>
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>

          {["nombre", "direccion", "telefono", "correo"].map((campo) => (
            <input
              key={campo}
              name={campo}
              placeholder={campo.toUpperCase()}
              value={proveedor[campo]}
              onChange={(e) => handleChange(e, setProveedor)}
            />
          ))}
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
