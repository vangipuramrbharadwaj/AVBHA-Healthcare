import { apiRequest } from "./http";

export type BillingPatient = {
  id: string;
  uhid?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  primaryMobile?: string | null;
};

export type BillingService = {
  id: string;
  serviceCode: string;
  serviceName: string;
  moduleCode: string;
  description?: string | null;
  basePrice: string | number;
  gstPercent?: string | number | null;
  discountAllowed: boolean;
  status?: string;
};

export type BillingCharge = {
  id: string;
  branchId: string;
  patientId: string;
  opdVisitId?: string | null;
  ipdAdmissionId?: string | null;
  sourceModule: string;
  sourceEntityId?: string | null;
  sourceKey: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  lineTotal: string | number;
  status: string;
  chargeDate: string;
  patient: BillingPatient;
  branch: {
    id: string;
    branchCode: string;
    branchName: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export type BillingPayment = {
  id: string;
  receiptNumber: string;
  paymentMode: string;
  status: string;
  amount: string | number;
  transactionReference?: string | null;
  paymentDate: string;
  remarks?: string | null;
};

export type BillingRefund = {
  id: string;
  refundNumber: string;
  amount: string | number;
  reason: string;
  status: string;
  paymentMode?: string | null;
  createdAt: string;
};

export type BillingAdvance = {
  id: string;
  branchId: string;
  patientId: string;
  advanceNumber: string;
  paymentMode: string;
  amount: string | number;
  utilizedAmount: string | number;
  balanceAmount: string | number;
  transactionReference?: string | null;
  remarks?: string | null;
  receivedAt: string;
  patient: BillingPatient;
  branch: {
    id: string;
    branchCode: string;
    branchName: string;
  };
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  branchId: string;
  patientId: string;
  opdVisitId?: string | null;
  ipdAdmissionId?: string | null;
  status: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  roundOffAmount?: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  notes?: string | null;
  patient: BillingPatient;
  branch?: {
    id: string;
    branchCode: string;
    branchName: string;
  };
  items: Array<{
    id: string;
    sourceModule?: string | null;
    description: string;
    quantity: string | number;
    unitPrice: string | number;
    discountAmount: string | number;
    taxAmount: string | number;
    lineTotal: string | number;
  }>;
  payments: BillingPayment[];
  refunds: BillingRefund[];
};

export type BillingDashboard = {
  date: string;
  invoicesCreated: number;
  grossBilled: number;
  todayCollections: number;
  paymentCount: number;
  todayRefunds: number;
  refundCount: number;
  totalOutstanding: number;
};

export const billingDashboard = () =>
  apiRequest<BillingDashboard>("/billing/dashboard");

export const listBillingServices = () =>
  apiRequest<BillingService[]>("/billing/services");

export const createBillingService = (body: unknown) =>
  apiRequest<BillingService>("/billing/services", {
    method: "POST",
    body,
  });

export const syncBillingCharges = () =>
  apiRequest<{ synchronized: number; sourceCounts: Record<string, number> }>(
    "/billing/charges/sync",
    { method: "POST" },
  );

export const listBillingCharges = (status = "PENDING") =>
  apiRequest<BillingCharge[]>(
    `/billing/charges?status=${encodeURIComponent(status)}`,
  );

export const createInvoiceFromCharges = (body: {
  chargeIds: string[];
  discountAmount?: number;
  roundOffAmount?: number;
  notes?: string | null;
}) =>
  apiRequest<BillingInvoice>("/billing/invoices/from-charges", {
    method: "POST",
    body,
  });

export const listBillingInvoices = () =>
  apiRequest<{ items: BillingInvoice[]; pagination: unknown }>(
    "/billing/invoices?page=1&pageSize=100",
  );

export const getBillingInvoice = (id: string) =>
  apiRequest<BillingInvoice>(`/billing/invoices/${id}`);

export const recordBillingPayment = (id: string, body: unknown) =>
  apiRequest<BillingPayment>(`/billing/invoices/${id}/payments`, {
    method: "POST",
    body,
  });

export const listBillingAdvances = (patientId?: string) =>
  apiRequest<BillingAdvance[]>(
    `/billing/advances${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`,
  );

export const createBillingAdvance = (body: unknown) =>
  apiRequest<BillingAdvance>("/billing/advances", {
    method: "POST",
    body,
  });

export const applyBillingAdvance = (invoiceId: string, amount?: number) =>
  apiRequest(`/billing/invoices/${invoiceId}/apply-advance`, {
    method: "POST",
    body: amount ? { amount } : {},
  });

export const requestBillingRefund = (id: string, body: unknown) =>
  apiRequest<BillingRefund>(`/billing/invoices/${id}/refunds`, {
    method: "POST",
    body,
  });

export const listBillingRefunds = (status?: string) =>
  apiRequest<BillingRefund[]>(
    `/billing/refunds${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  );

export const updateBillingRefundStatus = (
  id: string,
  status: string,
) =>
  apiRequest<BillingRefund>(`/billing/refunds/${id}/status`, {
    method: "POST",
    body: { status },
  });

export const cancelBillingInvoice = (id: string, body: unknown) =>
  apiRequest(`/billing/invoices/${id}/cancel`, {
    method: "POST",
    body,
  });

export const patientBillingLedger = (patientId: string) =>
  apiRequest<{ items: Array<{
    id: string;
    entryType: string;
    description: string;
    debitAmount: string | number;
    creditAmount: string | number;
    balanceAfter: string | number;
    entryAt: string;
  }>; pagination: unknown }>(
    `/billing/patient-ledger?patientId=${encodeURIComponent(patientId)}&page=1&pageSize=100`,
  );
