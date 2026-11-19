import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Wrap a route element to require a session with one of `roles`. */
export default function ProtectedRoute({ roles, children }) {
  const { user, role, ready } = useAuth();

  if (!ready) return null; // avoid a flash-redirect while localStorage loads
  if (!user || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
