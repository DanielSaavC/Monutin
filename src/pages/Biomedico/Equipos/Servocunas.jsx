import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import axios from "axios";
import "../../../App.css";

export default function Servocunas() {
  const [servocunas, setServocunas] = useState([]);

  useEffect(() => {
    axios
      .get("https://monutinbackend-production.up.railway.app/api/equipos")
      .then((res) => {
        const filtradas = res.data.filter((eq) => {
          const texto = `${eq.nombre_equipo} ${eq.marca} ${eq.modelo}`.toLowerCase();
          return texto.includes( "servocuna",
            "servo cuna",
            "cuna térmica",
            "cuna de calor",
            "cuna radiante",);
        });
        setServocunas(filtradas);
      })
      .catch((err) => console.error("❌ Error al cargar servocunas:", err));
  }, []);

  return (
    <div className="menu-container">
      <Header />
      <h2>🛏️ Servocunas</h2>

      <div className="grid-menu">
        {servocunas.length === 0 ? (
          <p style={{ color: "#00796b", marginTop: "40px" }}>
            No hay servocunas registradas.
          </p>
        ) : (
          servocunas.map((eq) => (
            <Link
              key={eq.id}
              to={`/servocunas/${eq.id}`}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {eq.imagen_base64 ? (
                <img
                  src={eq.imagen_base64}
                  alt={eq.nombre_equipo}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "10px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    background: "#e0f2f1",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.5em",
                    color: "#00bfa6",
                  }}
                >
                  🛏️
                </div>
              )}
              <span style={{ fontWeight: "bold", color: "#00796b" }}>
                {eq.nombre_equipo}
              </span>
              <span>{eq.marca}</span>
              <span style={{ fontSize: "0.9em", color: "#555" }}>
                {eq.serie}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
