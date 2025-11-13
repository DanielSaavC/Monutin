import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { inicializarNotificacionesPush } from './pushNotifications';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ========================================
// 🔔 Registrar Service Worker y Push
// ========================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // 1. Registrar Service Worker
      const reg = await navigator.serviceWorker.register(
        `${process.env.PUBLIC_URL}/service-worker.js`
      );
      console.log("✅ Service Worker registrado:", reg.scope);

      // 2. Esperar a que esté activo
      await navigator.serviceWorker.ready;

      // 3. Inicializar notificaciones push
      // Solo si hay usuario logueado
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      
      if (usuario && (usuario.tipo === "biomedico" || usuario.tipo === "tecnico")) {
        console.log("🔔 Inicializando notificaciones push para:", usuario.tipo);
        const exito = await inicializarNotificacionesPush(usuario.id);
        
        if (exito) {
          console.log("✅ Notificaciones push activadas");
        } else {
          console.warn("⚠️ No se pudieron activar las notificaciones");
        }
      }

    } catch (err) {
      console.error("❌ Error con Service Worker:", err);
    }
  });
}

reportWebVitals();