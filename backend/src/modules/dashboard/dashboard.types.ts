export interface DashboardMetric {
  key: string;
  label: string;
  value: number | null;
  status: "AVAILABLE" | "MODULE_NOT_IMPLEMENTED";
  route?: string;
}

export interface DashboardQuickAction {
  key: string;
  label: string;
  route: string;
  requiredPermission: string;
}

export interface DashboardWorkforceSummary {
  departments: number;
  employees: number;
  doctors: number;
  activeUsers: number;
}

export interface DashboardSecuritySummary {
  activeSessions: number;
  failedLoginsToday: number;
  criticalEventsToday: number;
}

export interface DashboardResponse {
  generatedAt: string;
  hospital: {
    id: string;
    code: string;
    name: string;
  };
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    roles: string[];
  };
  metrics: DashboardMetric[];
  workforce?: DashboardWorkforceSummary;
  security?: DashboardSecuritySummary;
  quickActions: DashboardQuickAction[];
  notices: string[];
}
