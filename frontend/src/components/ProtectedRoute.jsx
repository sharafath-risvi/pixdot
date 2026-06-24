import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ role, children, redirectTo = "/login" }) {
  const { isAuthenticated, role: currentRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`${redirectTo}?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role && currentRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
