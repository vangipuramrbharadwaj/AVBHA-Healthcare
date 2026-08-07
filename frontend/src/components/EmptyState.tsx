import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">＋</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
