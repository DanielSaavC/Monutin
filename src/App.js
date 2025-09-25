import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Presentacion from "./pages/Presentacion";
import Login from "./Login";
import Registro from "./Registro";
import Natural from "./pages/Natural";
import Medico from "./pages/Medico";
import Enfermera from "./pages/Enfermera";
import Tecnico from "./pages/Tecnico";
import Biomedico from "./pages/Biomedico";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Presentacion />} /> {/* Página principal */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/natural" element={<Natural />} />
        <Route path="/medico" element={<Medico />} />
        <Route path="/enfermera" element={<Enfermera />} />
        <Route path="/tecnico" element={<Tecnico />} />
        <Route path="/biomedico" element={<Biomedico />} />
      </Routes>
    </Router>
  );
}

export default App;
