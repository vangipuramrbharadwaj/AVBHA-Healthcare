import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

export function PermissionRoute({ permission, anyOf, children }: { permission?: string; anyOf?: string[]; children: ReactNode }) {
  const { can, canAny } = useAuth();
  const allowed = permission ? can(permission) : anyOf ? canAny(...anyOf) : true;
  return allowed ? <>{children}</> : <Navigate to="/403" replace />;
}
