import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import Header from "../../components/Header";
import QrReader from "react-qr-reader-es6";

export default function Biomedico() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrData, setQrData] = useState("");

  const handleScan = (data) => {
    if (data) {
      setQrData(data?.text || data);
      setShowScanner(false); // Cierra el escáner después de leer
      alert(`Código QR detectado:\n${data?.text || data}`);
    }
  };

  const handleError = (err) => {
    console.error("Error al escanear:", err);
    alert("No se pudo acceder a la cámara. Revisa los permisos.");
  };

  return (
    <div>
      <Header />
      <div className="menu-container">
        <h1 className="titulo-seccion">Biomédico</h1>

        <div className="grid-menu">
          {/* === SECCIÓN DE EQUIPOS === */}
          <Link to="/equipos" className="card">Equipos</Link>
          {/* ===<Link to="/imagenologia" className="card">Áreas</Link>=== */} 
          {/* ===<Link to="/hospitalviedma" className="card">Hospitales</Link>=== */}
          <Link to="/verseguimiento" className="card">Seguimiento</Link>
          <Link to="/adquisicion" className="card">Registrar</Link>
          <Link to="/ajustes" className="card">Ajustes</Link>

          {/* === NUEVO BOTÓN DE ESCANEO === */}
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

        {/* === ESCÁNER QR === */}
        {showScanner && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <QrReader
              onResult={(result, error) => {
                if (!!result) handleScan(result);
                if (!!error) console.log(error);
              }}
              constraints={{ facingMode: "environment" }}
              style={{ width: "300px", borderRadius: "10px" }}
            />
            <button
              onClick={() => setShowScanner(false)}
              style={{
                marginTop: "10px",
                background: "#ff5252",
                color: "#fff",
                border: "none",
                padding: "10px 15px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cerrar cámara
            </button>
          </div>
        )}

        {qrData && (
          <p
            style={{
              marginTop: "20px",
              color: "#00796B",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            📷 Código detectado: {qrData}
          </p>
        )}
      </div>
    </div>
  );
}
