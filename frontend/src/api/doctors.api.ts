import { apiRequest } from "./http";

export type DoctorRecord = {
  id: string;
  employeeId?: string | null;
  departmentId: string;
  doctorCode: string;
  medicalRegistrationNumber: string;
  registrationCouncil?: string | null;
  qualification: string;
  specialization: string;
  consultationFee?: number | string | null;
  followupFee?: number | string | null;
  emergencyFee?: number | string | null;
  averageConsultationMinutes?: number | null;
  isVisitingConsultant: boolean;
  status: string;

  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  email?: string | null;

  employee?: {
    id: string;
    employeeCode: string;
    title?: string | null;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    mobile: string;
    email?: string | null;
    branchId?: string | null;
    departmentId: string;
    branch?: {
      id: string;
      branchCode: string;
      branchName: string;
    } | null;
  } | null;

  department: {
    id: string;
    departmentCode: string;
    departmentName: string;
  };
};

export type EmployeeOption = {
  id: string;
  employeeCode: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  departmentId: string;
};

export type DepartmentOption = {
  id: string;
  departmentCode: string;
  departmentName: string;
  status: string;
};

export type BranchOption = {
  id: string;
  branchCode: string;
  branchName: string;
  status: string;
};

export type DoctorSchedule = {
  id: string;
  branchId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxAppointments?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
};

export type DoctorScheduleInput = {
  branchId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

export function listDoctorManagement(search?: string) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "100",
  });
  if (search?.trim()) params.set("search", search.trim());

  return apiRequest<{
    items: DoctorRecord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/doctors?${params.toString()}`);
}

export function listEmployeeOptions() {
  return apiRequest<{
    items: EmployeeOption[];
    pagination: unknown;
  }>("/employees?page=1&pageSize=100&status=ACTIVE");
}

export function listDepartmentOptions() {
  return apiRequest<{
    items: DepartmentOption[];
    pagination: unknown;
  }>("/departments?page=1&pageSize=100&status=ACTIVE");
}

export function listBranchOptions() {
  return apiRequest<{
    items: BranchOption[];
    pagination: unknown;
  }>("/branches?page=1&pageSize=100&status=ACTIVE");
}

export function createDoctor(payload: Record<string, unknown>) {
  return apiRequest<DoctorRecord>("/doctors", {
    method: "POST",
    body: payload,
  });
}

export function updateDoctor(
  id: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<DoctorRecord>(`/doctors/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function listDoctorSchedules(doctorId: string) {
  const params = new URLSearchParams({ doctorId });
  return apiRequest<DoctorSchedule[]>(
    `/appointments/schedules?${params.toString()}`,
  );
}

export function createDoctorSchedule(payload: DoctorScheduleInput) {
  return apiRequest<DoctorSchedule>("/appointments/schedules", {
    method: "POST",
    body: payload,
  });
}

export function updateDoctorSchedule(
  id: string,
  payload: Omit<DoctorScheduleInput, "doctorId">,
) {
  return apiRequest<DoctorSchedule>(`/appointments/schedules/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function archiveDoctorSchedule(id: string) {
  return apiRequest<null>(`/appointments/schedules/${id}`, {
    method: "DELETE",
  });
}

export type DoctorAvailableSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string | null;
};

export type DoctorAvailableSlotsResult = {
  doctorId: string;
  branchId: string;
  date: string;
  slots: DoctorAvailableSlot[];
};

export function listDoctorAvailableSlots(
  doctorId: string,
  branchId: string,
  date: string,
) {
  const params = new URLSearchParams({
    doctorId,
    branchId,
    date,
  });

  return apiRequest<DoctorAvailableSlotsResult>(
    `/appointments/available-slots?${params.toString()}`,
  );
}

