import {
  BillingInvoiceStatus,
  BillingPaymentMode,
  BillingRefundStatus,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const serviceCatalogSchema = z.object({
  serviceCode: z.string().trim().min(2).max(40),
  serviceName: z.string().trim().min(2).max(200),
  moduleCode: z.string().trim().min(2).max(50),
  departmentId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(3000).optional().nullable(),
  basePrice: z.coerce.number().min(0),
  gstPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  discountAllowed: z.boolean().default(true),
});

export const invoiceSchema = z.object({
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  opdVisitId: z.string().uuid().optional().nullable(),
  ipdAdmissionId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  discountAmount: z.coerce.number().min(0).default(0),
  roundOffAmount: z.coerce.number().default(0),
  notes: z.string().trim().max(5000).optional().nullable(),
  items: z.array(
    z.object({
      serviceId: z.string().uuid().optional().nullable(),
      sourceModule: z.string().trim().max(50).optional().nullable(),
      sourceEntityId: z.string().uuid().optional().nullable(),
      description: z.string().trim().min(2).max(300),
      quantity: z.coerce.number().positive().default(1),
      unitPrice: z.coerce.number().min(0),
      discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
      taxPercent: z.coerce.number().min(0).max(100).optional().nullable(),
    }),
  ).min(1),
});

export const listInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  status: z.nativeEnum(BillingInvoiceStatus).optional(),
});

export const paymentSchema = z.object({
  paymentMode: z.nativeEnum(BillingPaymentMode),
  amount: z.coerce.number().positive(),
  transactionReference: z.string().trim().max(150).optional().nullable(),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const advanceSchema = z.object({
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  paymentMode: z.nativeEnum(BillingPaymentMode),
  amount: z.coerce.number().positive(),
  transactionReference: z.string().trim().max(150).optional().nullable(),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(2).max(5000),
  paymentMode: z.nativeEnum(BillingPaymentMode).optional().nullable(),
});

export const refundStatusSchema = z.object({
  status: z.nativeEnum(BillingRefundStatus),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().trim().min(2).max(5000),
});

export const dashboardQuerySchema = z.object({
  date: z.coerce.date().optional(),
});

export const patientLedgerQuerySchema = z.object({
  patientId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});


export const billingChargeListSchema = z.object({
  status: z.enum(["PENDING", "INVOICED", "CANCELLED"]).default("PENDING"),
  patientId: z.string().uuid().optional(),
  ipdAdmissionId: z.string().uuid().optional(),
  opdVisitId: z.string().uuid().optional(),
});

export const invoiceFromChargesSchema = z.object({
  chargeIds: z.array(z.string().uuid()).min(1),
  discountAmount: z.coerce.number().min(0).default(0),
  roundOffAmount: z.coerce.number().default(0),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const advanceListSchema = z.object({
  patientId: z.string().uuid().optional(),
  availableOnly: z.coerce.boolean().default(false),
});

export const applyAdvanceSchema = z.object({
  amount: z.coerce.number().positive().optional(),
});

export const refundListSchema = z.object({
  status: z.nativeEnum(BillingRefundStatus).optional(),
});
