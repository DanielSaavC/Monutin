import { HashRouter as Router, Routes, Route } from "react-router-dom"; 

// páginas principales
import Presentacion from "./pages/Presentacion";
import Login from "./Login";
import Registro from "./Registro";
import Ajustes from "./pages/Ajustes";

// roles
import Natural from "./pages/Natural/Natural";
import Medico from "./pages/Medico/Medico";
import Enfermera from "./pages/Enfermera/Enfermera";
import Tecnico from "./pages/Tecnico/Tecnico";

// biomédico
import Biomedico from './pages/Biomedico/Biomedico.jsx';
import Incubadoras from './pages/Biomedico/Equipos/Incubadoras.jsx';
import IncubadoraDetalle from './pages/Biomedico/Equipos/IncubadoraDetalle.jsx';
import Equipos from './pages/Biomedico/Equipos/Equipos.jsx';
import Ventilador from './pages/Biomedico/Equipos/ventiladores.jsx';
import Servocuna from './pages/Biomedico/Equipos/Servocunas.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Presentacion />} />

        {/* login y registro */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/ajustes" element={<Ajustes />} />

        {/* roles */}
        <Route path="/natural" element={<Natural />} />
        <Route path="/medico" element={<Medico />} />
        <Route path="/enfermera" element={<Enfermera />} />
        <Route path="/tecnico" element={<Tecnico />} />

        {/* biomédico */}
        <Route path="/biomedico" element={<Biomedico />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/incubadoras" element={<Incubadoras />} />
        <Route path="/incubadoras/:id" element={<IncubadoraDetalle />} />
        <Route path="/servocunas" element={<Servocuna/>} />
        <Route path="/servocunas/:id" element={<IncubadoraDetalle />} />
        <Route path="/ventiladores" element={<Ventilador />} />
        <Route path="/ventiladores/:id" element={<IncubadoraDetalle />} />
      </Routes>
    </Router>
  );
}

export default App;
