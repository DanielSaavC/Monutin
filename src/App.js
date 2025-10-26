import React from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// ====== COMPONENTES ======
import Header from "./components/Header";
import HeaderLog from "./components/HeaderLog";

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

// --- Equipos ---
import Incubadoras from "./pages/Biomedico/Equipos/Incubadoras.jsx";
import IncubadoraDetalle from "./pages/Biomedico/Equipos/IncubadoraDetalle.jsx";
import Equipos from "./pages/Biomedico/Equipos/Equipos.jsx";
import Ventilador from "./pages/Biomedico/Equipos/ventiladores.jsx";
import Servocuna from "./pages/Biomedico/Equipos/Servocunas.jsx";

// --- Áreas ---
import Imagenologia from "./pages/Biomedico/Areas/Imagenologia.jsx";
import Quirófano from "./pages/Biomedico/Areas/Quirofano.jsx";
import UTI from "./pages/Biomedico/Areas/Uti.jsx";
import UTIN from "./pages/Biomedico/Areas/Utin.jsx";

// --- Hospitales ---
import CNSP from "./pages/Biomedico/Hospitales/CajaNacional.jsx";
import HospitalDelSur from "./pages/Biomedico/Hospitales/HospitalDelSur.jsx";
import HospitalObrero from "./pages/Biomedico/Hospitales/HospitalObrero.jsx";
import HospitalVietma from "./pages/Biomedico/Hospitales/HospitalVietma.jsx";
import HospitalUnivalle from "./pages/Biomedico/Hospitales/HospitalUnivalle.jsx";
import Hospital from "./pages/Biomedico/Hospitales/Hospital.jsx";

// --- Registrar ---
import AdquisicionDeEquipo from "./pages/Biomedico/Registrar/AdquisicionDeEquipo.jsx";
import RegEquipo from "./pages/Biomedico/Registrar/RegEquipo.jsx";
import RegistrarEquipo from "./pages/Biomedico/Registrar/RegistrarEquipo.jsx";

import VerSeguimiento from "./pages/Biomedico/Seguimiento/VerSeguimiento.jsx";
import IniciarSeguimiento from "./pages/Biomedico/Seguimiento/IniciarSeguimiento.jsx";

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

        {/* ---- EQUIPOS ---- */}
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/incubadoras" element={<Incubadoras />} />
        <Route path="/incubadoras/:id" element={<IncubadoraDetalle />} />
        <Route path="/servocunas" element={<Servocuna />} />
        <Route path="/servocunas/:id" element={<IncubadoraDetalle />} />
        <Route path="/ventiladores" element={<Ventilador />} />
        <Route path="/ventiladores/:id" element={<IncubadoraDetalle />} />

        {/* ---- ÁREAS ---- */}
        <Route path="/imagenologia" element={<Imagenologia />} />
        <Route path="/quirofano" element={<Quirófano />} />
        <Route path="/uti" element={<UTI />} />
        <Route path="/utin" element={<UTIN />} />

        {/* ---- HOSPITALES ---- */}
        <Route path="/cnsp" element={<CNSP />} />
        <Route path="/hospitalsur" element={<HospitalDelSur />} />
        <Route path="/hospitalobrero" element={<HospitalObrero />} />
        <Route path="/hospitalviedma" element={<HospitalVietma />} />
        <Route path="/hospitalunivalle" element={<HospitalUnivalle />} />
        <Route path="/hospitalmixto" element={<Hospital />} />

        {/* ---- REGISTRAR ---- */}
        <Route path="/adquisicion" element={<AdquisicionDeEquipo />} />
        <Route path="/registroequipo" element={<RegEquipo />} />
        <Route path="/registraequipo" element={<RegistrarEquipo />} />
        <Route path="/Verseguimiento" element={<VerSeguimiento />} />
      </Routes>
    </>
  );
}

export default AppWrapper;
