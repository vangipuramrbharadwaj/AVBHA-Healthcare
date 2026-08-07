export interface DashboardMetric {
  key: string;
  label: string;
  value: number | string | null;
  status?: string;
  route?: string;
}
export interface QuickAction {
  key: string;
  label: string;
  route: string;
  requiredPermission: string;
}
export interface DashboardResponse {
  generatedAt: string;
  hospital: { id: string; code: string; name: string };
  branch: { id: string; code: string; name: string } | null;
  user: { id: string; name: string; roles: string[] };
  metrics: DashboardMetric[];
  quickActions: QuickAction[];
  notices: string[];
  workforce?: unknown;
  security?: unknown;
}
