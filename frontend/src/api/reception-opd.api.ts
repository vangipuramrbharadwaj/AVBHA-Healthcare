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
      body: JSON.stringify({ status }),
    },
  );
  return unwrap<AppointmentSummary>(raw as any);
}

export async function createOpdVisit(
  input: CreateOpdVisitInput,
): Promise<OpdVisitSummary> {
  const raw = await apiRequest<unknown>("/opd", {
    method: "POST",
    body: JSON.stringify(input),
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
