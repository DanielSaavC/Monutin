import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Registro from "./Registro";
import Natural from "./Natural";
import Medico from "./Medico";
import Enfermera from "./Enfermera";
import Tecnico from "./Tecnico";
import Biomedico from "./Biomedico";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
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
