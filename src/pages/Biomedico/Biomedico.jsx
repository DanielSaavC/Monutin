import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import { QrScanner } from "@yudiel/react-qr-scanner";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");

  const handleScan = (result) => {
    if (result && result[0]?.rawValue) {
      const value = result[0].rawValue;
      setQrData(value);
      setShowScanner(false);
      alert(`✅ Código QR detectado:\n${value}`);
    }
  };

  const handleError = (error) => {
    console.error("Error al escanear:", error);
    alert("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
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

          {/* BOTÓN DE ESCANEO QR */}
          <button
            className="card"
            style={{
              backgroundColor: "#00BFA6",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setShowScanner(true)}
          >
            Escanear QR
          </button>
        </div>

        {/* ESCÁNER QR */}
        {showScanner && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#e0f2f1",
              padding: "20px",
              borderRadius: "15px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            <QrScanner
              onDecode={handleScan}
              onError={handleError}
              constraints={{
                facingMode: "environment", // cámara trasera en móviles
              }}
              style={{
                width: "320px",
                borderRadius: "10px",
                border: "4px solid #00BFA6",
              }}
            />
            <button
              onClick={() => setShowScanner(false)}
              style={{
                marginTop: "15px",
                background: "#ff5252",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Cerrar cámara
            </button>
          </div>
        )}

        {/* RESULTADO */}
        {qrData && (
          <p
            style={{
              marginTop: "20px",
              color: "#00796B",
              fontWeight: "bold",
              textAlign: "center",
              background: "#b2dfdb",
              padding: "10px 20px",
              borderRadius: "10px",
              display: "inline-block",
            }}
          >
            📷 Código detectado: {qrData}
          </p>
        )}
      </div>
    </div>
  );
}
