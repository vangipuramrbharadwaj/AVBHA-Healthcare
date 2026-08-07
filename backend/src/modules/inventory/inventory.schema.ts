import {
  InventoryItemStatus,
  InventoryPurchaseStatus,
  InventoryRequestStatus,
  InventoryTransferStatus,
  RecordStatus,
} from "@prisma/client";
import { z } from "zod";

export const inventoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const createInventoryCategorySchema = z.object({
  categoryCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  categoryName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const createInventoryItemSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  itemCode: z.string().trim().min(2).max(40).transform((v) => v.toUpperCase()),
  itemName: z.string().trim().min(2).max(160),
  genericName: z.string().trim().max(160).optional().nullable(),
  itemType: z.string().trim().min(2).max(40).default("CONSUMABLE"),
  unitOfMeasure: z.string().trim().min(1).max(30).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(1000).optional().nullable(),
  reorderLevel: z.coerce.number().min(0).optional().nullable(),
  minimumStock: z.coerce.number().min(0).optional().nullable(),
  maximumStock: z.coerce.number().min(0).optional().nullable(),
  trackBatch: z.boolean().default(false),
  trackExpiry: z.boolean().default(false),
  billable: z.boolean().default(false),
  status: z.nativeEnum(InventoryItemStatus).default(InventoryItemStatus.ACTIVE),
});

export const createInventoryStoreSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  storeCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  storeName: z.string().trim().min(2).max(120),
  storeType: z.string().trim().min(2).max(30).default("CENTRAL"),
  isCentral: z.boolean().default(false),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const createInventorySupplierSchema = z.object({
  supplierCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  supplierName: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email().max(150).optional().nullable(),
  gstNumber: z.string().trim().max(30).optional().nullable(),
  drugLicense: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const stockAdjustmentSchema = z.object({
  storeId: z.string().uuid(),
  itemId: z.string().uuid(),
  batchNumber: z.string().trim().max(80).optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  quantity: z.coerce.number().positive(),
  direction: z.enum(["IN", "OUT"]),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createPurchaseOrderSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid(),
  destinationStoreId: z.string().uuid(),
  orderDate: z.coerce.date().default(() => new Date()),
  expectedDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    orderedQuantity: z.coerce.number().positive(),
    unitCost: z.coerce.number().min(0).optional().nullable(),
  })).min(1),
});

export const purchaseStatusSchema = z.object({
  status: z.enum([
    InventoryPurchaseStatus.SUBMITTED,
    InventoryPurchaseStatus.APPROVED,
    InventoryPurchaseStatus.REJECTED,
    InventoryPurchaseStatus.CANCELLED,
  ]),
});

export const createGoodsReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  storeId: z.string().uuid(),
  receiptDate: z.coerce.date().default(() => new Date()),
  supplierInvoiceNumber: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.object({
    purchaseOrderItemId: z.string().uuid(),
    itemId: z.string().uuid(),
    batchNumber: z.string().trim().max(80).optional().nullable(),
    expiryDate: z.coerce.date().optional().nullable(),
    receivedQuantity: z.coerce.number().positive(),
    acceptedQuantity: z.coerce.number().min(0),
    rejectedQuantity: z.coerce.number().min(0).default(0),
    unitCost: z.coerce.number().min(0).optional().nullable(),
  }).refine((v) => v.acceptedQuantity + v.rejectedQuantity <= v.receivedQuantity, {
    message: "Accepted plus rejected quantity cannot exceed received quantity",
  })).min(1),
});

export const createMaterialRequestSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  fromStoreId: z.string().uuid(),
  requestDate: z.coerce.date().default(() => new Date()),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    requestedQty: z.coerce.number().positive(),
    notes: z.string().trim().max(500).optional().nullable(),
  })).min(1),
});

export const requestStatusSchema = z.object({
  status: z.enum([
    InventoryRequestStatus.APPROVED,
    InventoryRequestStatus.REJECTED,
    InventoryRequestStatus.CANCELLED,
  ]),
});

export const issueMaterialSchema = z.object({
  items: z.array(z.object({
    requestItemId: z.string().uuid(),
    itemId: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    batchNumber: z.string().trim().max(80).optional().nullable(),
  })).min(1),
});

export const materialReturnSchema = z.object({
  storeId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  batchNumber: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createTransferSchema = z.object({
  fromStoreId: z.string().uuid(),
  toStoreId: z.string().uuid(),
  transferDate: z.coerce.date().default(() => new Date()),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    batchNumber: z.string().trim().max(80).optional().nullable(),
    quantity: z.coerce.number().positive(),
  })).min(1),
}).refine((v) => v.fromStoreId !== v.toStoreId, {
  message: "Source and destination stores must be different",
});

export const transferStatusSchema = z.object({
  status: z.enum([
    InventoryTransferStatus.SUBMITTED,
    InventoryTransferStatus.IN_TRANSIT,
    InventoryTransferStatus.CANCELLED,
  ]),
});

export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
export type CreateInventoryCategoryInput = z.infer<typeof createInventoryCategorySchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type CreateInventoryStoreInput = z.infer<typeof createInventoryStoreSchema>;
export type CreateInventorySupplierInput = z.infer<typeof createInventorySupplierSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseStatusInput = z.infer<typeof purchaseStatusSchema>;
export type CreateGoodsReceiptInput = z.infer<typeof createGoodsReceiptSchema>;
export type CreateMaterialRequestInput = z.infer<typeof createMaterialRequestSchema>;
export type RequestStatusInput = z.infer<typeof requestStatusSchema>;
export type IssueMaterialInput = z.infer<typeof issueMaterialSchema>;
export type MaterialReturnInput = z.infer<typeof materialReturnSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type TransferStatusInput = z.infer<typeof transferStatusSchema>;
