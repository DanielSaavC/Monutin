// ✅ Todos los imports van siempre arriba del archivo
import React from "react";
import Header from "../../../components/Header"; // Ajusta la ruta si es necesario

// ✅ Luego exportas tu componente
export default function Uti() {
  return (
    <div>
      <Header />
      <div className="area-container">
        <h1>Unidad de Terapia Intensiva (UTI)</h1>
        <p>Información sobre los equipos y mantenimiento del área UTI.</p>
      </div>
    </div>
  );
}
