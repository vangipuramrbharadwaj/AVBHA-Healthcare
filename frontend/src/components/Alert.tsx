import type { ReactNode } from "react";
export function Alert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" | "warning" }) {
  return <div className={`alert alert-${tone}`} role="alert">{children}</div>;
}
