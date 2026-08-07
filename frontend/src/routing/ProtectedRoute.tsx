import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute() {
  const { authenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) return <div className="full-screen-center"><Spinner label="Restoring secure session…" /></div>;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
