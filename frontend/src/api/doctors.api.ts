import { apiRequest } from "./http";

export type DoctorRecord = {
  id: string;
  employeeId: string;
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
  employee: {
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
  };
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

export function listDoctorManagement(search?: string) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "100",
    status: "ACTIVE",
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

export function createDoctor(payload: Record<string, unknown>) {
  return apiRequest<DoctorRecord>("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDoctor(
  id: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<DoctorRecord>(`/doctors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
