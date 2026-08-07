export function StatusBadge({ children, tone = "neutral" }: { children: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
