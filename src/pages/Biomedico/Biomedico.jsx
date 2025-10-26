import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);

  // 🔒 Evita que el botón "atrás" del móvil cierre toda la web cuando está activo el escáner
  useEffect(() => {
    const handleBack = (e) => {
      if (showScanner) {
        e.preventDefault();
        setShowScanner(false);
        window.history.pushState(null, "", window.location.href);
      }
    };

    if (showScanner) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handleBack);
    }

    return () => window.removeEventListener("popstate", handleBack);
  }, [showScanner]);

  // ✅ Detecta código QR
  const handleScan = (result) => {
    if (result) {
      setQrData(result);
      setCopied(false); // reinicia estado del botón
    }
  };

  // ⚠️ Maneja errores de cámara
  const handleError = (error) => {
    console.error("Error al escanear:", error);
    alert("❌ No se pudo acceder a la cámara. Verifica los permisos del navegador.");
  };

  // 📋 Copiar al portapapeles
  const handleCopy = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      setCopied(true);
    }
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
                audio: true,
                tracker: true,
              }}
              constraints={{
                facingMode: "environment",
              }}
              className="qr-video-full"
            />

            {/* === BOTONES DENTRO DEL ESCÁNER === */}
            <div className="qr-buttons">
              <button
                className="qr-btn qr-btn-exit"
                onClick={() => setShowScanner(false)}
              >
                ✖ Salir
              </button>

              <button
                className="qr-btn qr-btn-copy"
                onClick={handleCopy}
                disabled={!qrData}
              >
                {copied ? "✅ Copiado" : "💾 Guardar Link"}
              </button>
            </div>

            {/* === MOSTRAR RESULTADO ESCANEADO === */}
            {qrData && (
              <div className="qr-floating-text">
                {qrData.startsWith("http") ? (
                  <a
                    href={qrData}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#00BFA6" }}
                  >
                    {qrData}
                  </a>
                ) : (
                  qrData
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
