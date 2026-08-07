export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type OpdVisitStatus =
  | "REGISTERED"
  | "WAITING"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED";

export interface PatientSummary {
  id: string;
  uhid: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  primaryMobile?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
}

export interface BranchSummary {
  id: string;
  branchCode?: string;
  branchName: string;
}

export interface DepartmentSummary {
  id: string;
  departmentCode?: string;
  departmentName: string;
  branchId?: string | null;
}

export interface DoctorSummary {
  id: string;
  doctorCode?: string | null;
  specialization?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  employee?: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface AppointmentSummary {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  appointmentType?: string;
  visitType?: string;
  priority?: string;
  status: AppointmentStatus;
  chiefComplaint?: string | null;
  patient: PatientSummary;
  doctor: DoctorSummary;
  department?: DepartmentSummary | null;
  branch?: BranchSummary | null;
}

export interface OpdVisitSummary {
  id: string;
  visitNumber: string;
  visitDate: string;
  visitType: string;
  status: OpdVisitStatus | string;
  chiefComplaint?: string | null;
  notes?: string | null;
  patient: PatientSummary;
  doctor: DoctorSummary;
  department?: DepartmentSummary | null;
  branch?: BranchSummary | null;
  appointmentId?: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paged<T> {
  items: T[];
  pagination: Pagination;
}

export interface AppointmentDashboard {
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

export interface CreateOpdVisitInput {
  branchId: string;
  departmentId: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string | null;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string | null;
  notes?: string | null;
}
