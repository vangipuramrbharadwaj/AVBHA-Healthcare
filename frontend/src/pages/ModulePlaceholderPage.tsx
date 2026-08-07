import { PageHeader } from "../components/PageHeader";
export function ModulePlaceholderPage({ title, description }: { title: string; description: string }) {
  return <div><PageHeader title={title} description={description}/><div className="empty-state"><div className="empty-state-icon">AV</div><h2>{title} frontend is ready to be connected</h2><p>The route, permission protection, navigation and application shell are active. Functional screens for this module will be added in its frontend phase.</p><div className="phase-tag">Frontend Phase 1 Foundation</div></div></div>;
}
