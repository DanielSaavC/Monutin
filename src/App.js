import React from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// ====== COMPONENTES ======
import Header from "./components/Header";       // Header cuando el usuario está logueado
import HeaderLog from "./components/HeaderLog"; // Header para login/registro

// ====== PÁGINAS PRINCIPALES ======
import Presentacion from "./pages/Presentacion";
import Login from "./Login";
import Registro from "./Registro";
import Ajustes from "./pages/Ajustes";

// ====== ROLES ======
import Natural from "./pages/Natural/Natural";
import Medico from "./pages/Medico/Medico";
import Enfermera from "./pages/Enfermera/Enfermera";
import Tecnico from "./pages/Tecnico/Tecnico";

// ====== BIOMÉDICO ======
import Biomedico from "./pages/Biomedico/Biomedico.jsx";
import Incubadoras from "./pages/Biomedico/Equipos/Incubadoras.jsx";
import IncubadoraDetalle from "./pages/Biomedico/Equipos/IncubadoraDetalle.jsx";
import Equipos from "./pages/Biomedico/Equipos/Equipos.jsx";
import Ventilador from "./pages/Biomedico/Equipos/ventiladores.jsx";
import Servocuna from "./pages/Biomedico/Equipos/Servocunas.jsx";

// =============================
// COMPONENTE PRINCIPAL
// =============================
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  // Rutas públicas (sin login)
  const publicPaths = ["/", "/login", "/registro"];
  const isPublic = publicPaths.includes(location.pathname.toLowerCase());

  return (
    <>
      {/* === Header dinámico según ruta === */}
      {isPublic ? <HeaderLog /> : <Header />}

      {/* === RUTAS === */}
      <Routes>
        {/* === PÚBLICAS === */}
        <Route path="/" element={<Presentacion />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* === PRIVADAS === */}
        <Route path="/ajustes" element={<Ajustes />} />

        {/* === ROLES === */}
        <Route path="/natural" element={<Natural />} />
        <Route path="/medico" element={<Medico />} />
        <Route path="/enfermera" element={<Enfermera />} />
        <Route path="/tecnico" element={<Tecnico />} />

        {/* === BIOMÉDICO === */}
        <Route path="/biomedico" element={<Biomedico />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/incubadoras" element={<Incubadoras />} />
        <Route path="/incubadoras/:id" element={<IncubadoraDetalle />} />
        <Route path="/servocunas" element={<Servocuna />} />
        <Route path="/servocunas/:id" element={<IncubadoraDetalle />} />
        <Route path="/ventiladores" element={<Ventilador />} />
        <Route path="/ventiladores/:id" element={<IncubadoraDetalle />} />
      </Routes>
    </>
  );
}

export default AppWrapper;
