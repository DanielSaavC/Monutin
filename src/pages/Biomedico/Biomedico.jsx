import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");

  // ✅ Cuando se detecta un código QR
  const handleScan = (result) => {
    if (result) {
      setQrData(result);
      setShowScanner(false);
      alert(`✅ Código QR detectado:\n${result}`);
    }
  };

  // ⚠️ Si ocurre un error al usar la cámara
  const handleError = (error) => {
    console.error("Error al escanear:", error);
    alert("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
  };

  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Biomédico</h1>

        <div className="grid-menu">
          {/* === Opciones principales === */}
          <Link to="/equipos" className="card">
            Equipos
          </Link>
          <Link to="/verseguimiento" className="card">
            Seguimiento
          </Link>
          <Link to="/adquisicion" className="card">
            Registrar
          </Link>
          <Link to="/ajustes" className="card">
            Ajustes
          </Link>

          {/* === Botón Escanear QR === */}
          <button
            className="card"
            style={{
              backgroundColor: "#00BFA6",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => setShowScanner(true)}
          >
            Escanear QR
          </button>
        </div>

        {/* === Contenedor del escáner === */}
        {showScanner && (
          <div className="qr-scanner-container">
            <Scanner
              onDecode={handleScan}
              onError={handleError}
              components={{
                audio: false, // desactiva sonido de confirmación
                tracker: true, // muestra marco de escaneo
              }}
              constraints={{
                facingMode: "environment", // usa cámara trasera
              }}
              className="qr-video"
            />

            <button
              className="qr-close-btn"
              onClick={() => setShowScanner(false)}
            >
              Cerrar cámara
            </button>
          </div>
        )}

        {/* === Resultado del escaneo === */}
        {qrData && (
          <p className="qr-result">
            📷 Código detectado: {qrData}
          </p>
        )}
      </div>
    </div>
  );
}
