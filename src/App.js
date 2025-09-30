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
import Biomedico from "./pages/Biomedico/Biomedico";
import Equipos from "./pages/Biomedico/Equipos";
import Incubadoras from "./pages/Biomedico/Incubadoras";
import IncubadoraDetalle from "./pages/Biomedico/IncubadoraDetalle";

function App() {
  return (
    <Router basename="/Monutin">
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
      </Routes>
    </Router>
  );
}

export default App;
