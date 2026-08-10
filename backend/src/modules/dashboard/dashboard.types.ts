export interface DashboardMetric {
  key: string;
  label: string;
  value: number | string;
  status: "AVAILABLE";
  route?: string;
  tone?: "BLUE" | "GREEN" | "AMBER" | "RED" | "PURPLE";
  helper?: string;
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

export interface DashboardTodaySummary {
  patientsRegistered: number;
  appointments: number;
  opdVisits: number;
  ipdAdmissions: number;
  discharges: number;
  otCases: number;
  payments: number;
  revenue: number;
}

export interface DashboardClinicalQueues {
  appointmentsWaiting: number;
  opdInProgress: number;
  laboratoryPending: number;
  radiologyPending: number;
  pharmacyPending: number;
  otPending: number;
  dischargePlanned: number;
  billingOutstandingCount: number;
  billingOutstandingAmount: number;
}

export interface DashboardBedSummary {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  blocked: number;
  occupancyPercent: number;
}

export interface DashboardPharmacySummary {
  expiryAlerts: number;
  expiredBatches: number;
  outOfStockBatches: number;
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
  today: DashboardTodaySummary;
  queues: DashboardClinicalQueues;
  beds: DashboardBedSummary;
  pharmacy: DashboardPharmacySummary;
  workforce?: DashboardWorkforceSummary;
  security?: DashboardSecuritySummary;
  quickActions: DashboardQuickAction[];
  notices: string[];
}
