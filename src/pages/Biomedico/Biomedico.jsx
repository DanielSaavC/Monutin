import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Control del botón "Atrás" del móvil
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

  // ✅ Detección flexible de formato del QR
  const handleScan = (result) => {
    if (!result) return;

    let value = "";
    // Si devuelve un array con objetos (rawValue)
    if (Array.isArray(result) && result[0]?.rawValue) {
      value = result[0].rawValue;
    }
    // Si devuelve texto plano
    else if (typeof result === "string") {
      value = result;
    }

    if (value) {
      setQrData(value);
      setShowModal(true);
      setCopied(false);
    }
  };

  // ⚠️ Error de cámara
  const handleError = (error) => {
    console.error("Error al escanear:", error);
    alert("❌ No se pudo acceder a la cámara. Verifica los permisos.");
  };

  // 📋 Copiar al portapapeles
  const handleCopy = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 🔗 Abrir link o mostrar texto
  const handleOpen = () => {
    if (qrData.startsWith("http")) {
      window.open(qrData, "_blank");
    } else {
      alert(`Texto detectado:\n${qrData}`);
    }
    setShowModal(false);
    setShowScanner(false);
  };

  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Biomédico</h1>

        <div className="grid-menu">
          <Link to="/equipos" className="card">Equipos</Link>
          <Link to="/verseguimiento" className="card">Seguimiento</Link>
          <Link to="/fichatecnica" className="card">Registrar</Link>

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
              constraints={{ facingMode: "environment" }}
              components={{
                audio: true,
                tracker: true,
              }}
              className="qr-video-full"
            />

            <div className="qr-buttons">
              <button
                className="qr-btn qr-btn-exit"
                onClick={() => setShowScanner(false)}
              >
                ✖ Salir
              </button>
            </div>
          </div>
        )}

        {/* === MODAL DE OPCIONES === */}
        {showModal && (
          <div className="qr-modal-overlay">
            <div className="qr-modal">
              <h2>📷 Código detectado</h2>
              <p className="qr-modal-text">
                {qrData.startsWith("http") ? (
                  <a
                    href={qrData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="qr-link"
                  >
                    {qrData}
                  </a>
                ) : (
                  qrData
                )}
              </p>
              <div className="qr-modal-buttons">
                <button className="qr-modal-btn open" onClick={handleOpen}>
                  🔗 Abrir
                </button>
                <button className="qr-modal-btn copy" onClick={handleCopy}>
                  {copied ? "✅ Copiado" : "💾 Guardar"}
                </button>
                <button
                  className="qr-modal-btn cancel"
                  onClick={() => setShowModal(false)}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
