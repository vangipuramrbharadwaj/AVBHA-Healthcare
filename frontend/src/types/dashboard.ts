export interface DashboardMetric {
  key: string;
  label: string;
  value: number | string;
  status: "AVAILABLE";
  route?: string;
  tone?: "BLUE" | "GREEN" | "AMBER" | "RED" | "PURPLE";
  helper?: string;
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
  today: {
    patientsRegistered: number;
    appointments: number;
    opdVisits: number;
    ipdAdmissions: number;
    discharges: number;
    otCases: number;
    payments: number;
    revenue: number;
  };
  queues: {
    appointmentsWaiting: number;
    opdInProgress: number;
    laboratoryPending: number;
    radiologyPending: number;
    pharmacyPending: number;
    otPending: number;
    dischargePlanned: number;
    billingOutstandingCount: number;
    billingOutstandingAmount: number;
  };
  beds: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
    blocked: number;
    occupancyPercent: number;
  };
  pharmacy: {
    expiryAlerts: number;
    expiredBatches: number;
    outOfStockBatches: number;
  };
  quickActions: QuickAction[];
  notices: string[];
  workforce?: {
    departments: number;
    employees: number;
    doctors: number;
    activeUsers: number;
  };
  security?: {
    activeSessions: number;
    failedLoginsToday: number;
    criticalEventsToday: number;
  };
}
