import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  if (!usuario) {
    // Guardar la URL original antes de ir al login
    localStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}
