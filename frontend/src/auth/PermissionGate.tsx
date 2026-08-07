import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny } = useAuth();
  const allowed = permission
    ? can(permission)
    : anyOf
      ? canAny(...anyOf)
      : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
