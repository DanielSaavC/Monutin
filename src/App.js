import React, { useEffect } from "react";
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
import Quirofano from "./pages/Biomedico/Areas/Quirofano.jsx";
import Uti from "./pages/Biomedico/Areas/Uti.jsx";
import Utin from "./pages/Biomedico/Areas/Utin.jsx";

// --- Hospitales ---
import CNSP from "./pages/Biomedico/Hospitales/CajaNacional.jsx";
import HospitalDelSur from "./pages/Biomedico/Hospitales/HospitalDelSur.jsx";
import HospitalObrero from "./pages/Biomedico/Hospitales/HospitalObrero.jsx";
import HospitalViedma from "./pages/Biomedico/Hospitales/HospitalViedma.jsx";
import HospitalUnivalle from "./pages/Biomedico/Hospitales/HospitalUnivalle.jsx";

// --- Registrar ---
import FichaTecnica from "./pages/Biomedico/Registrar/FichaTecnica.jsx";
import RegEquipo from "./pages/Biomedico/Registrar/RegEquipo.jsx";
import RegistrarEquipo from "./pages/Biomedico/Registrar/RegistrarEquipo.jsx";

// --- Seguimiento ---
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

  // =======================
  // 🔔 NOTIFICACIONES PUSH
  // =======================
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const publicKey =
          "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M";

        try {
          // Solicita permiso al usuario
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("❌ Permiso de notificaciones denegado");
            return;
          }

          // Crear o recuperar suscripción
          const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });

          console.log("✅ Suscripción Push creada:", subscription);

          // Enviar suscripción al backend
          await fetch("https://monutinbackend-production.up.railway.app/api/suscribir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
          });
        } catch (err) {
          console.error("❌ Error al suscribirse al push:", err);
        }
      });
    } else {
      console.warn("⚠️ Este navegador no soporta notificaciones push");
    }
  }, []);

  // Función auxiliar para convertir la clave
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

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
        <Route path="/quirofano" element={<Quirofano />} />
        <Route path="/uti" element={<Uti />} />
        <Route path="/utin" element={<Utin />} />

        {/* ---- HOSPITALES ---- */}
        <Route path="/cnsp" element={<CNSP />} />
        <Route path="/hospitalsur" element={<HospitalDelSur />} />
        <Route path="/hospitalobrero" element={<HospitalObrero />} />
        <Route path="/hospitalviedma" element={<HospitalViedma />} />
        <Route path="/hospitalunivalle" element={<HospitalUnivalle />} />

        {/* ---- REGISTRAR ---- */}
        <Route path="/fichatecnica" element={<FichaTecnica />} />
        <Route path="/registroequipo" element={<RegEquipo />} />
        <Route path="/registraequipo" element={<RegistrarEquipo />} />

        {/* ---- SEGUIMIENTO ---- */}
        <Route path="/verseguimiento" element={<VerSeguimiento />} />
        <Route path="/iniciarseguimiento" element={<IniciarSeguimiento />} />
      </Routes>
    </>
  );
}

export default AppWrapper;
  