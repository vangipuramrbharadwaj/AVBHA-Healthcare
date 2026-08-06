export type OperationTheatreModuleCode = "operation-theatre";

export interface OperationTheatreDashboardSummary {
  date: string;
  totalBookings: number;
  requested: number;
  scheduled: number;
  preOpReady: number;
  inProgress: number;
  recovery: number;
  completed: number;
  cancelled: number;
}
