import { apiRequest } from "./http";
import type {
  AppointmentDashboard,
  AppointmentSummary,
  Paged,
} from "../types/reception-opd";

export type AppointmentType =
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "PROCEDURE"
  | "HEALTH_CHECK"
  | "VACCINATION"
  | "TELECONSULTATION"
  | "EMERGENCY"
  | "OTHER";

export type AppointmentVisitType = "NEW" | "FOLLOW_UP" | "REVIEW";
export type AppointmentPriority = "NORMAL" | "URGENT" | "EMERGENCY";

export interface CreateAppointmentInput {
  branchId: string;
  departmentId: string;
  patientId?: string;
  guestName?: string;
  guestMobile?: string;
  guestGender?: string;
  guestDateOfBirth?: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  visitType: AppointmentVisitType;
  priority: AppointmentPriority;
  status: "BOOKED";
  chiefComplaint?: string | null;
  reason?: string | null;
  notes?: string | null;
  source?: string | null;
  referredBy?: string | null;
  confirmationMode?: string | null;
}

export interface RescheduleAppointmentInput {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}

export type UpdateAppointmentInput = Partial<
  Omit<
    CreateAppointmentInput,
    "status" | "guestGender" | "guestDateOfBirth"
  >
> & {
  patientId?: string | null;
  guestGender?: string | null;
  guestDateOfBirth?: string | null;
  status?:
    | "BOOKED"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "RESCHEDULED";
};

function qs(
  input: Record<string, string | number | undefined | null>,
): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function listAppointments(input: {
  page?: number;
  pageSize?: number;
  search?: string | undefined;
  status?: string | undefined;
  appointmentType?: string | undefined;
  branchId?: string | undefined;
  departmentId?: string | undefined;
  doctorId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
} = {}) {
  return apiRequest<Paged<AppointmentSummary>>(
    `/appointments${qs({
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 50,
      search: input.search,
      status: input.status,
      appointmentType: input.appointmentType,
      branchId: input.branchId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      sortOrder: input.sortOrder ?? "asc",
    })}`,
  );
}

export function getAppointmentDashboard(date: string) {
  return apiRequest<AppointmentDashboard>(
    `/appointments/dashboard${qs({ date })}`,
  );
}

export function createAppointment(input: CreateAppointmentInput) {
  return apiRequest<AppointmentSummary>("/appointments", {
    method: "POST",
    body: input,
  });
}

export function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
) {
  return apiRequest<AppointmentSummary>(`/appointments/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateAppointmentStatus(
  id: string,
  status:
    | "BOOKED"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "NO_SHOW",
) {
  return apiRequest<AppointmentSummary>(`/appointments/${id}`, {
    method: "PATCH",
    body: { status },
  });
}

export function cancelAppointment(
  id: string,
  cancellationReason: string,
) {
  return apiRequest<AppointmentSummary>(
    `/appointments/${id}/cancel`,
    {
      method: "PATCH",
      body: { cancellationReason },
    },
  );
}

export function rescheduleAppointment(
  id: string,
  input: RescheduleAppointmentInput,
) {
  return apiRequest<AppointmentSummary>(
    `/appointments/${id}/reschedule`,
    {
      method: "POST",
      body: input,
    },
  );
}


export function linkAppointmentPatient(
  appointmentId: string,
  patientId: string,
) {
  return apiRequest<AppointmentSummary>(`/appointments/${appointmentId}`, {
    method: "PATCH",
    body: { patientId },
  });
}
