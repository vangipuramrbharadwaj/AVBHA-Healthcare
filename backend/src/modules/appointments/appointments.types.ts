export interface AppointmentDashboardSummary {
  date: string;
  total: number;
  booked: number;
  confirmed: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  rescheduled: number;
}
