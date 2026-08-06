import {
  PharmacyPaymentMode,
  PharmacyPurchaseStatus,
  PharmacySaleStatus,
  PharmacyStockTransactionType,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const supplierSchema = z.object({
  supplierCode: z.string().trim().min(2).max(30),
  supplierName: z.string().trim().min(2).max(200),
  contactPerson: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().email().max(150).optional().nullable(),
  gstin: z.string().trim().max(20).optional().nullable(),
  drugLicenseNo: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().max(3000).optional().nullable(),
  paymentTerms: z.string().trim().max(100).optional().nullable(),
});

export const medicineSchema = z.object({
  medicineCode: z.string().trim().min(2).max(40),
  brandName: z.string().trim().min(2).max(200),
  genericName: z.string().trim().max(200).optional().nullable(),
  strength: z.string().trim().max(80).optional().nullable(),
  dosageForm: z.string().trim().max(80).optional().nullable(),
  manufacturer: z.string().trim().max(200).optional().nullable(),
  hsnCode: z.string().trim().max(30).optional().nullable(),
  gstPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  sellingPrice: z.coerce.number().min(0).optional().nullable(),
  reorderLevel: z.coerce.number().min(0).optional().nullable(),
  controlledDrug: z.boolean().default(false),
  requiresPrescription: z.boolean().default(true),
  barcode: z.string().trim().max(100).optional().nullable(),
  storageInstructions: z.string().trim().max(3000).optional().nullable(),
});

export const batchSchema = z.object({
  branchId: z.string().uuid(),
  medicineId: z.string().uuid(),
  supplierId: z.string().uuid().optional().nullable(),
  batchNumber: z.string().trim().min(1).max(80),
  manufacturingDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  availableQuantity: z.coerce.number().min(0),
  rackLocation: z.string().trim().max(80).optional().nullable(),
});

export const purchaseOrderSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  expectedDate: z.coerce.date().optional().nullable(),
  discountAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(3000).optional().nullable(),
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      orderedQuantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().min(0),
      taxPercent: z.coerce.number().min(0).max(100).optional().nullable(),
      discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
    }),
  ).min(1),
});

export const goodsReceiptSchema = z.object({
  supplierInvoice: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
  batches: z.array(
    z.object({
      purchaseOrderItemId: z.string().uuid(),
      medicineId: z.string().uuid(),
      batchNumber: z.string().trim().min(1).max(80),
      manufacturingDate: z.coerce.date().optional().nullable(),
      expiryDate: z.coerce.date(),
      purchasePrice: z.coerce.number().min(0),
      sellingPrice: z.coerce.number().min(0),
      receivedQuantity: z.coerce.number().positive(),
      rackLocation: z.string().trim().max(80).optional().nullable(),
    }),
  ).min(1),
});

export const stockAdjustmentSchema = z.object({
  branchId: z.string().uuid(),
  medicineId: z.string().uuid(),
  batchId: z.string().uuid(),
  transactionType: z.nativeEnum(PharmacyStockTransactionType),
  quantity: z.coerce.number().positive(),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const saleSchema = z.object({
  branchId: z.string().uuid(),
  patientId: z.string().uuid().optional().nullable(),
  paymentMode: z.nativeEnum(PharmacyPaymentMode).default(PharmacyPaymentMode.CASH),
  discountAmount: z.coerce.number().min(0).default(0),
  amountPaid: z.coerce.number().min(0),
  notes: z.string().trim().max(3000).optional().nullable(),
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      batchId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().min(0),
      taxPercent: z.coerce.number().min(0).max(100).optional().nullable(),
      discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
    }),
  ).min(1),
});

export const dispenseSchema = z.object({
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  opdVisitId: z.string().uuid().optional().nullable(),
  ipdAdmissionId: z.string().uuid().optional().nullable(),
  prescriptionId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      batchId: z.string().uuid(),
      prescribedQuantity: z.coerce.number().min(0).optional().nullable(),
      dispensedQuantity: z.coerce.number().positive(),
      unitPrice: z.coerce.number().min(0),
      substitutionReason: z.string().trim().max(3000).optional().nullable(),
      instructions: z.string().trim().max(3000).optional().nullable(),
    }),
  ).min(1),
});

export const listSalesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  status: z.nativeEnum(PharmacySaleStatus).optional(),
});

export const listPurchaseOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  supplierId: z.string().uuid().optional(),
  status: z.nativeEnum(PharmacyPurchaseStatus).optional(),
});

export const dashboardQuerySchema = z.object({
  date: z.coerce.date().optional(),
});
