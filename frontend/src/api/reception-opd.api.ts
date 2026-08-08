import { apiRequest } from "./http";
import type {
  AppointmentDashboard,
  AppointmentSummary,
  BranchSummary,
  CreateOpdVisitInput,
  DepartmentSummary,
  DoctorSummary,
  OpdVisitSummary,
  Paged,
  PatientSummary,
} from "../types/reception-opd";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type ReceptionDoctor = {
  id: string;
  departmentId: string;
  doctorCode: string;
  specialization: string;
  averageConsultationMinutes?: number | null;
  status: string;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  email?: string | null;
  employee?: {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    mobile?: string | null;
  } | null;
  department?: {
    id: string;
    departmentCode?: string;
    departmentName: string;
  } | null;
};

export type ReceptionDoctorSchedule = {
  id: string;
  branchId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
};

export type ReceptionDoctorSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string | null;
};

export type ReceptionDoctorSlotsResult = {
  doctorId: string;
  branchId: string;
  date: string;
  slots: ReceptionDoctorSlot[];
};

function unwrap<T>(value: ApiEnvelope<T> | T): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in (value as Record<string, unknown>)
  ) {
    return (value as ApiEnvelope<T>).data as T;
  }
  return value as T;
}

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

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export async function searchPatients(
  search: string,
  pageSize = 15,
): Promise<PatientSummary[]> {
  const raw = await apiRequest<unknown>(
    `/patients${qs({
      search: search.trim() || undefined,
      page: 1,
      pageSize,
      status: "ACTIVE",
    })}`,
  );

  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function listBranches(): Promise<BranchSummary[]> {
  const raw = await apiRequest<unknown>(
    `/branches${qs({ page: 1, pageSize: 100, status: "ACTIVE" })}`,
  );
  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function listDepartments(
  branchId?: string,
): Promise<DepartmentSummary[]> {
  const raw = await apiRequest<unknown>(
    `/departments${qs({
      page: 1,
      pageSize: 100,
      status: "ACTIVE",
      branchId,
    })}`,
  );
  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function listDoctors(
  departmentId?: string,
  branchId?: string,
): Promise<DoctorSummary[]> {
  const raw = await apiRequest<unknown>(
    `/doctors${qs({
      page: 1,
      pageSize: 100,
      status: "ACTIVE",
      departmentId,
      branchId,
    })}`,
  );
  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}


export async function listReceptionDoctors(): Promise<ReceptionDoctor[]> {
  const raw = await apiRequest<unknown>(
    `/doctors${qs({ page: 1, pageSize: 100, status: "ACTIVE" })}`,
  );
  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function listReceptionDoctorSchedules(
  doctorId: string,
  branchId?: string,
): Promise<ReceptionDoctorSchedule[]> {
  const raw = await apiRequest<unknown>(
    `/appointments/schedules${qs({ doctorId, branchId })}`,
  );
  const data = unwrap<any>(raw);
  return Array.isArray(data) ? data : [];
}

export async function getReceptionDoctorAvailableSlots(
  doctorId: string,
  branchId: string,
  date: string,
): Promise<ReceptionDoctorSlotsResult> {
  const raw = await apiRequest<unknown>(
    `/appointments/available-slots${qs({ doctorId, branchId, date })}`,
  );
  return unwrap<ReceptionDoctorSlotsResult>(raw as any);
}

export async function listAppointments(input: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paged<AppointmentSummary>> {
  const raw = await apiRequest<unknown>(
    `/appointments${qs({
      search: input.search,
      status: input.status,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 50,
      sortOrder: "asc",
    })}`,
  );
  const data = unwrap<any>(raw);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? {
      page: 1,
      pageSize: input.pageSize ?? 50,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getAppointmentDashboard(
  date: string,
): Promise<AppointmentDashboard> {
  const raw = await apiRequest<unknown>(
    `/appointments/dashboard${qs({ date })}`,
  );
  return unwrap<AppointmentDashboard>(raw as any);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
): Promise<AppointmentSummary> {
  const raw = await apiRequest<unknown>(
    `/appointments/${appointmentId}`,
    {
      method: "PATCH",
      body: { status },
    },
  );
  return unwrap<AppointmentSummary>(raw as any);
}


export async function updateAppointmentForReception(
  appointmentId: string,
  input: {
    doctorId?: string;
    departmentId?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
  },
): Promise<AppointmentSummary> {
  const raw = await apiRequest<unknown>(
    `/appointments/${appointmentId}`,
    {
      method: "PATCH",
      body: input,
    },
  );
  return unwrap<AppointmentSummary>(raw as any);
}

export async function createOpdVisit(
  input: CreateOpdVisitInput,
): Promise<OpdVisitSummary> {
  const raw = await apiRequest<unknown>("/opd", {
    method: "POST",
    body: input,
  });
  return unwrap<OpdVisitSummary>(raw as any);
}

export async function listOpdVisits(input: {
  status?: string;
  patientId?: string;
  doctorId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paged<OpdVisitSummary>> {
  const raw = await apiRequest<unknown>(
    `/opd${qs({
      status: input.status,
      patientId: input.patientId,
      doctorId: input.doctorId,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 50,
    })}`,
  );
  const data = unwrap<any>(raw);

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? {
      page: 1,
      pageSize: input.pageSize ?? 50,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function completeOpdVisit(
  visitId: string,
): Promise<OpdVisitSummary> {
  const raw = await apiRequest<unknown>(
    `/opd/${visitId}/complete`,
    { method: "POST" },
  );
  return unwrap<OpdVisitSummary>(raw as any);
}
