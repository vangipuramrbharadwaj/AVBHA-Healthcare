import { apiRequest } from "./http";

export type ReportFilters = {
  from: string;
  to: string;
  branchId?: string;
  departmentId?: string;
  doctorId?: string;
};

export type OverviewReport = {
  newPatients: number;
  appointments: number;
  opdVisits: number;
  ipdAdmissions: number;
  labOrders: number;
  radiologyOrders: number;
  pharmacy: {
    sales: number;
    grossSales: number;
    collected: number;
  };
  billing: {
    invoices: number;
    billed: number;
    paidAgainstInvoices: number;
    outstanding: number;
    receipts: number;
    collections: number;
  };
};

export type RevenueReport = {
  invoiceCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  billed: number;
  paidAgainstInvoices: number;
  outstanding: number;
  receiptCount: number;
  collections: number;
  pharmacySales: number;
  pharmacyGross: number;
  pharmacyCollected: number;
  paymentModes: Array<{
    paymentMode: string;
    count: number;
    amount: number;
  }>;
};

export type GenericReport = Record<string, unknown>;

function query(filters: ReportFilters) {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  });

  if (filters.branchId) params.set("branchId", filters.branchId);
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.doctorId) params.set("doctorId", filters.doctorId);

  return params.toString();
}

export const reportOverview = (filters: ReportFilters) =>
  apiRequest<OverviewReport>(`/reports/overview?${query(filters)}`);

export const reportPatients = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/patients/registrations?${query(filters)}`);

export const reportAppointments = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/appointments?${query(filters)}`);

export const reportOpd = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/opd?${query(filters)}`);

export const reportIpd = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/ipd?${query(filters)}`);

export const reportRevenue = (filters: ReportFilters) =>
  apiRequest<RevenueReport>(`/reports/revenue?${query(filters)}`);

export const reportLaboratory = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/laboratory?${query(filters)}`);

export const reportRadiology = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/radiology?${query(filters)}`);

export const reportPharmacy = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/pharmacy?${query(filters)}`);

export const reportInventory = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/inventory?${query(filters)}`);

export const reportDepartments = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/departments/performance?${query(filters)}`);

export const reportDoctors = (filters: ReportFilters) =>
  apiRequest<GenericReport>(`/reports/doctors/performance?${query(filters)}`);

export const reportDailyMis = (date: string, branchId?: string) => {
  const params = new URLSearchParams({ date });
  if (branchId) params.set("branchId", branchId);
  return apiRequest<GenericReport>(`/reports/daily-mis?${params.toString()}`);
};
