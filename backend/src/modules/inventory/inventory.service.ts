import { InventoryPurchaseStatus, InventoryRequestStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import {
  DOCUMENT_TYPES,
  nextDocumentNumber,
} from "../../shared/sequences";
import type {
  CreateGoodsReceiptInput,
  CreateInventoryCategoryInput,
  CreateInventoryItemInput,
  CreateInventoryStoreInput,
  CreateInventorySupplierInput,
  CreateMaterialRequestInput,
  CreatePurchaseOrderInput,
  CreateTransferInput,
  InventoryListQuery,
  IssueMaterialInput,
  MaterialReturnInput,
  PurchaseStatusInput,
  RequestStatusInput,
  StockAdjustmentInput,
} from "./inventory.schema";
import * as repository from "./inventory.repository";

export const listCategories = repository.listCategories;
export const listItems = repository.listItems;
export const listStores = repository.listStores;
export const listSuppliers = repository.listSuppliers;
export const listStock = repository.listStock;
export const dashboard = repository.dashboard;

async function requireBranch(hospitalId: string, branchId?: string | null) {
  if (!branchId) return;
  if ((await repository.branchExists(hospitalId, branchId)) === 0) {
    throw new AppError("Branch was not found in this hospital", 400, "INVALID_BRANCH");
  }
}

async function requireDepartment(hospitalId: string, departmentId?: string | null) {
  if (!departmentId) return;
  if ((await repository.departmentExists(hospitalId, departmentId)) === 0) {
    throw new AppError("Department was not found in this hospital", 400, "INVALID_DEPARTMENT");
  }
}

async function requireStore(hospitalId: string, storeId: string) {
  if ((await repository.storeExists(hospitalId, storeId)) === 0) {
    throw new AppError("Inventory store was not found", 404, "INVENTORY_STORE_NOT_FOUND");
  }
}

async function requireSupplier(hospitalId: string, supplierId: string) {
  if ((await repository.supplierExists(hospitalId, supplierId)) === 0) {
    throw new AppError("Inventory supplier was not found", 404, "INVENTORY_SUPPLIER_NOT_FOUND");
  }
}

async function requireItems(hospitalId: string, itemIds: string[]) {
  for (const itemId of [...new Set(itemIds)]) {
    if ((await repository.itemExists(hospitalId, itemId)) === 0) {
      throw new AppError("Inventory item was not found", 404, "INVENTORY_ITEM_NOT_FOUND", { itemId });
    }
  }
}

async function numberFor(
  hospitalId: string,
  documentType:
    | typeof DOCUMENT_TYPES.INVENTORY_PURCHASE_ORDER
    | typeof DOCUMENT_TYPES.INVENTORY_GOODS_RECEIPT
    | typeof DOCUMENT_TYPES.INVENTORY_MATERIAL_REQUEST
    | typeof DOCUMENT_TYPES.INVENTORY_TRANSFER,
  prefix: string,
) {
  const result = await nextDocumentNumber({
    hospitalId,
    documentType,
    prefix,
    period: "DATE",
    padding: 6,
  });
  return result.number;
}

export function createCategory(
  hospitalId: string,
  userId: string,
  input: CreateInventoryCategoryInput,
) {
  return repository.saveCategory(hospitalId, userId, input);
}

export async function createItem(
  hospitalId: string,
  userId: string,
  input: CreateInventoryItemInput,
) {
  if (input.categoryId) {
    const categories = await repository.listCategories(hospitalId, {
      page: 1,
      pageSize: 100,
    });
    if (!categories.items.some((item) => item.id === input.categoryId)) {
      throw new AppError("Inventory category was not found", 400, "INVALID_INVENTORY_CATEGORY");
    }
  }
  return repository.saveItem(hospitalId, userId, input);
}

export async function createStore(
  hospitalId: string,
  userId: string,
  input: CreateInventoryStoreInput,
) {
  await requireBranch(hospitalId, input.branchId);
  await requireDepartment(hospitalId, input.departmentId);
  return repository.saveStore(hospitalId, userId, input);
}

export function createSupplier(
  hospitalId: string,
  userId: string,
  input: CreateInventorySupplierInput,
) {
  return repository.saveSupplier(hospitalId, userId, input);
}

export async function adjustStock(
  hospitalId: string,
  userId: string,
  input: StockAdjustmentInput,
) {
  await requireStore(hospitalId, input.storeId);
  await requireItems(hospitalId, [input.itemId]);

  try {
    return await repository.adjustStock(hospitalId, userId, input);
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_INVENTORY_STOCK") {
      throw new AppError("Insufficient inventory stock", 409, "INSUFFICIENT_INVENTORY_STOCK");
    }
    throw error;
  }
}

export async function createPurchaseOrder(
  hospitalId: string,
  userId: string,
  input: CreatePurchaseOrderInput,
) {
  await requireBranch(hospitalId, input.branchId);
  await requireSupplier(hospitalId, input.supplierId);
  await requireStore(hospitalId, input.destinationStoreId);
  await requireItems(hospitalId, input.items.map((item) => item.itemId));

  const purchaseNumber = await numberFor(
    hospitalId,
    DOCUMENT_TYPES.INVENTORY_PURCHASE_ORDER,
    "IPO",
  );

  return repository.createPurchaseOrder(hospitalId, userId, purchaseNumber, input);
}

export async function updatePurchaseStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: PurchaseStatusInput,
) {
  const record = await repository.updatePurchaseStatus(hospitalId, userId, id, input);
  if (!record) {
    throw new AppError("Inventory purchase order was not found", 404, "INVENTORY_PURCHASE_ORDER_NOT_FOUND");
  }
  return record;
}

export async function createGoodsReceipt(
  hospitalId: string,
  userId: string,
  input: CreateGoodsReceiptInput,
) {
  await requireStore(hospitalId, input.storeId);
  await requireItems(hospitalId, input.items.map((item) => item.itemId));

  const receiptNumber = await numberFor(
    hospitalId,
    DOCUMENT_TYPES.INVENTORY_GOODS_RECEIPT,
    "IGR",
  );

  const record = await repository.createGoodsReceipt(
    hospitalId,
    userId,
    receiptNumber,
    input,
  );

  if (!record) {
    throw new AppError("Inventory purchase order was not found", 404, "INVENTORY_PURCHASE_ORDER_NOT_FOUND");
  }

  return record;
}

export async function createMaterialRequest(
  hospitalId: string,
  userId: string,
  input: CreateMaterialRequestInput,
) {
  await requireBranch(hospitalId, input.branchId);
  await requireDepartment(hospitalId, input.departmentId);
  await requireStore(hospitalId, input.fromStoreId);
  await requireItems(hospitalId, input.items.map((item) => item.itemId));

  const requestNumber = await numberFor(
    hospitalId,
    DOCUMENT_TYPES.INVENTORY_MATERIAL_REQUEST,
    "IMR",
  );

  return repository.createMaterialRequest(hospitalId, userId, requestNumber, input);
}

export async function updateRequestStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: RequestStatusInput,
) {
  const record = await repository.updateRequestStatus(hospitalId, userId, id, input);
  if (!record) {
    throw new AppError("Inventory material request was not found", 404, "INVENTORY_REQUEST_NOT_FOUND");
  }
  return record;
}

export async function issueMaterial(
  hospitalId: string,
  userId: string,
  requestId: string,
  input: IssueMaterialInput,
) {
  try {
    const record = await repository.issueMaterial(hospitalId, userId, requestId, input);
    if (!record) {
      throw new AppError("Inventory material request was not found", 404, "INVENTORY_REQUEST_NOT_FOUND");
    }
    return record;
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_INVENTORY_STOCK") {
      throw new AppError("Insufficient inventory stock", 409, "INSUFFICIENT_INVENTORY_STOCK");
    }
    if (error instanceof Error && error.message === "ISSUE_QUANTITY_EXCEEDS_REQUEST") {
      throw new AppError("Issue quantity exceeds the remaining requested quantity", 409, "INVENTORY_ISSUE_EXCEEDS_REQUEST");
    }
    if (error instanceof Error && error.message === "INVENTORY_REQUEST_ITEM_NOT_FOUND") {
      throw new AppError("Inventory request item was not found", 404, "INVENTORY_REQUEST_ITEM_NOT_FOUND");
    }
    throw error;
  }
}

export async function returnMaterial(
  hospitalId: string,
  userId: string,
  input: MaterialReturnInput,
) {
  await requireStore(hospitalId, input.storeId);
  await requireItems(hospitalId, [input.itemId]);
  return repository.returnMaterial(hospitalId, userId, input);
}

export async function createTransfer(
  hospitalId: string,
  userId: string,
  input: CreateTransferInput,
) {
  await requireStore(hospitalId, input.fromStoreId);
  await requireStore(hospitalId, input.toStoreId);
  await requireItems(hospitalId, input.items.map((item) => item.itemId));

  const transferNumber = await numberFor(
    hospitalId,
    DOCUMENT_TYPES.INVENTORY_TRANSFER,
    "ITR",
  );

  return repository.createTransfer(hospitalId, userId, transferNumber, input);
}

export async function completeTransfer(
  hospitalId: string,
  userId: string,
  id: string,
) {
  try {
    const record = await repository.completeTransfer(hospitalId, userId, id);
    if (!record) {
      throw new AppError("Inventory transfer was not found", 404, "INVENTORY_TRANSFER_NOT_FOUND");
    }
    return record;
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_INVENTORY_STOCK") {
      throw new AppError("Insufficient inventory stock for transfer", 409, "INSUFFICIENT_INVENTORY_STOCK");
    }
    throw error;
  }
}
