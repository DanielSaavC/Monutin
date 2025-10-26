import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");

  const handleScan = (result) => {
    if (result) {
      setQrData(result);
      setShowScanner(false);

      // Detecta si el QR es un link y lo abre automáticamente
      if (result.startsWith("http://") || result.startsWith("https://")) {
        window.open(result, "_blank");
      } else {
        alert(`📷 Código QR detectado:\n${result}`);
      }
    }
  };

  const handleError = (error) => {
    console.error("Error al escanear:", error);
    alert("❌ No se pudo acceder a la cámara. Verifica los permisos del navegador.");
  };

  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Biomédico</h1>

        <div className="grid-menu">
          <Link to="/equipos" className="card">Equipos</Link>
          <Link to="/verseguimiento" className="card">Seguimiento</Link>
          <Link to="/adquisicion" className="card">Registrar</Link>
          <Link to="/ajustes" className="card">Ajustes</Link>

          {/* === BOTÓN ESCANEAR QR === */}
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

        {/* === ESCÁNER A PANTALLA COMPLETA === */}
        {showScanner && (
          <div className="qr-fullscreen">
            <Scanner
              onDecode={handleScan}
              onError={handleError}
              components={{
                audio: true, // ✅ sonido de confirmación
                tracker: true, // marco visual
              }}
              constraints={{
                facingMode: "environment",
              }}
              className="qr-video-full"
            />
            <button
              className="qr-close-full-btn"
              onClick={() => setShowScanner(false)}
            >
              ✖ Cerrar
            </button>
          </div>
        )}

        {/* === RESULTADO DEL ESCÁNER === */}
        {qrData && (
          <div className="qr-result-container">
            <p className="qr-result">
              📷 Código detectado:
              <br />
              <span className="qr-link">
                {qrData.startsWith("http") ? (
                  <a href={qrData} target="_blank" rel="noopener noreferrer">
                    {qrData}
                  </a>
                ) : (
                  qrData
                )}
              </span>
            </p>
            <button
              className="qr-copy-btn"
              onClick={() => navigator.clipboard.writeText(qrData)}
            >
              Copiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
