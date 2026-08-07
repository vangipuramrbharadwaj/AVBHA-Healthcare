import {
  AuditAction,
  InventoryPurchaseStatus,
  InventoryRequestStatus,
  InventoryStockTransactionType,
  InventoryTransferStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
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
  TransferStatusInput,
} from "./inventory.schema";

const batchKey = (batchNumber?: string | null) =>
  batchNumber?.trim() ? batchNumber.trim().toUpperCase() : "NO_BATCH";

export async function listCategories(
  hospitalId: string,
  query: InventoryListQuery,
) {
  const where: Prisma.InventoryCategoryWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { categoryCode: { contains: query.search, mode: "insensitive" } },
            { categoryName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryCategory.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { categoryName: "asc" },
    }),
    prisma.inventoryCategory.count({ where }),
  ]);

  return { items, pagination: { ...query, total, totalPages: Math.ceil(total / query.pageSize) } };
}

export async function listItems(
  hospitalId: string,
  query: InventoryListQuery,
) {
  const where: Prisma.InventoryItemWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { itemCode: { contains: query.search, mode: "insensitive" } },
            { itemName: { contains: query.search, mode: "insensitive" } },
            { genericName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { itemName: "asc" },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { items, pagination: { ...query, total, totalPages: Math.ceil(total / query.pageSize) } };
}

export function listStores(hospitalId: string) {
  return prisma.inventoryStore.findMany({
    where: { hospitalId, deletedAt: null },
    orderBy: { storeName: "asc" },
  });
}

export function listSuppliers(hospitalId: string) {
  return prisma.inventorySupplier.findMany({
    where: { hospitalId, deletedAt: null },
    orderBy: { supplierName: "asc" },
  });
}

export function listStock(hospitalId: string, storeId?: string) {
  return prisma.inventoryStock.findMany({
    where: {
      hospitalId,
      ...(storeId ? { storeId } : {}),
    },
    orderBy: [{ itemId: "asc" }, { expiryDate: "asc" }],
  });
}

export function branchExists(hospitalId: string, branchId: string) {
  return prisma.hospitalBranch.count({
    where: { id: branchId, hospitalId, deletedAt: null, status: "ACTIVE" },
  });
}

export function departmentExists(hospitalId: string, departmentId: string) {
  return prisma.department.count({
    where: { id: departmentId, hospitalId, deletedAt: null, status: "ACTIVE" },
  });
}

export function storeExists(hospitalId: string, storeId: string) {
  return prisma.inventoryStore.count({
    where: { id: storeId, hospitalId, deletedAt: null, status: "ACTIVE" },
  });
}

export function supplierExists(hospitalId: string, supplierId: string) {
  return prisma.inventorySupplier.count({
    where: { id: supplierId, hospitalId, deletedAt: null, status: "ACTIVE" },
  });
}

export function itemExists(hospitalId: string, itemId: string) {
  return prisma.inventoryItem.count({
    where: { id: itemId, hospitalId, deletedAt: null, status: "ACTIVE" },
  });
}

export async function saveCategory(
  hospitalId: string,
  userId: string,
  input: CreateInventoryCategoryInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryCategory.findUnique({
      where: {
        hospitalId_categoryCode: {
          hospitalId,
          categoryCode: input.categoryCode,
        },
      },
    });

    const data: Prisma.InventoryCategoryUncheckedCreateInput = {
      hospitalId,
      categoryCode: input.categoryCode,
      categoryName: input.categoryName,
      status: input.status,
      createdBy: userId,
      updatedBy: userId,
    };
    if (input.description !== undefined) data.description = input.description;

    const record = existing
      ? await tx.inventoryCategory.update({
          where: { id: existing.id },
          data: {
            categoryName: input.categoryName,
            status: input.status,
            deletedAt: null,
            updatedBy: userId,
            ...(input.description !== undefined ? { description: input.description } : {}),
          },
        })
      : await tx.inventoryCategory.create({ data });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        module: "inventory",
        entityType: "InventoryCategory",
        entityId: record.id,
        ...(existing ? { oldValues: existing } : {}),
        newValues: record,
      },
    });

    return record;
  });
}

export async function saveItem(
  hospitalId: string,
  userId: string,
  input: CreateInventoryItemInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryItem.findUnique({
      where: {
        hospitalId_itemCode: { hospitalId, itemCode: input.itemCode },
      },
    });

    const createData: Prisma.InventoryItemUncheckedCreateInput = {
      hospitalId,
      itemCode: input.itemCode,
      itemName: input.itemName,
      itemType: input.itemType,
      unitOfMeasure: input.unitOfMeasure,
      trackBatch: input.trackBatch,
      trackExpiry: input.trackExpiry,
      billable: input.billable,
      status: input.status,
      createdBy: userId,
      updatedBy: userId,
    };

    if (input.categoryId !== undefined) createData.categoryId = input.categoryId;
    if (input.genericName !== undefined) createData.genericName = input.genericName;
    if (input.description !== undefined) createData.description = input.description;
    if (input.reorderLevel !== undefined) createData.reorderLevel = input.reorderLevel;
    if (input.minimumStock !== undefined) createData.minimumStock = input.minimumStock;
    if (input.maximumStock !== undefined) createData.maximumStock = input.maximumStock;

    const record = existing
      ? await tx.inventoryItem.update({
          where: { id: existing.id },
          data: {
            itemName: input.itemName,
            itemType: input.itemType,
            unitOfMeasure: input.unitOfMeasure,
            trackBatch: input.trackBatch,
            trackExpiry: input.trackExpiry,
            billable: input.billable,
            status: input.status,
            deletedAt: null,
            updatedBy: userId,
            ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
            ...(input.genericName !== undefined ? { genericName: input.genericName } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
            ...(input.minimumStock !== undefined ? { minimumStock: input.minimumStock } : {}),
            ...(input.maximumStock !== undefined ? { maximumStock: input.maximumStock } : {}),
          },
        })
      : await tx.inventoryItem.create({ data: createData });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        module: "inventory",
        entityType: "InventoryItem",
        entityId: record.id,
        ...(existing ? { oldValues: existing } : {}),
        newValues: record,
      },
    });

    return record;
  });
}

export function saveStore(
  hospitalId: string,
  userId: string,
  input: CreateInventoryStoreInput,
) {
  const data: Prisma.InventoryStoreUncheckedCreateInput = {
    hospitalId,
    storeCode: input.storeCode,
    storeName: input.storeName,
    storeType: input.storeType,
    isCentral: input.isCentral,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };
  if (input.branchId !== undefined) data.branchId = input.branchId;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId;

  return prisma.inventoryStore.upsert({
    where: {
      hospitalId_storeCode: { hospitalId, storeCode: input.storeCode },
    },
    update: {
      storeName: input.storeName,
      storeType: input.storeType,
      isCentral: input.isCentral,
      status: input.status,
      deletedAt: null,
      updatedBy: userId,
      ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
    },
    create: data,
  });
}

export function saveSupplier(
  hospitalId: string,
  userId: string,
  input: CreateInventorySupplierInput,
) {
  const data: Prisma.InventorySupplierUncheckedCreateInput = {
    hospitalId,
    supplierCode: input.supplierCode,
    supplierName: input.supplierName,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };
  if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email;
  if (input.gstNumber !== undefined) data.gstNumber = input.gstNumber;
  if (input.drugLicense !== undefined) data.drugLicense = input.drugLicense;
  if (input.address !== undefined) data.address = input.address;

  return prisma.inventorySupplier.upsert({
    where: {
      hospitalId_supplierCode: { hospitalId, supplierCode: input.supplierCode },
    },
    update: {
      supplierName: input.supplierName,
      status: input.status,
      deletedAt: null,
      updatedBy: userId,
      ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.gstNumber !== undefined ? { gstNumber: input.gstNumber } : {}),
      ...(input.drugLicense !== undefined ? { drugLicense: input.drugLicense } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
    },
    create: data,
  });
}

async function mutateStock(
  tx: Prisma.TransactionClient,
  hospitalId: string,
  storeId: string,
  itemId: string,
  quantityDelta: number,
  transactionType: InventoryStockTransactionType,
  userId: string,
  options: {
    batchNumber?: string | null;
    expiryDate?: Date | null;
    unitCost?: number | null;
    referenceType?: string;
    referenceId?: string;
    notes?: string | null;
  } = {},
) {
  const key = batchKey(options.batchNumber);

  const existing = await tx.inventoryStock.findUnique({
    where: {
      hospitalId_storeId_itemId_batchKey: {
        hospitalId,
        storeId,
        itemId,
        batchKey: key,
      },
    },
  });

  const current = existing ? Number(existing.quantity) : 0;
  const next = current + quantityDelta;

  if (next < 0) {
    throw new Error("INSUFFICIENT_INVENTORY_STOCK");
  }

  const stock = existing
    ? await tx.inventoryStock.update({
        where: { id: existing.id },
        data: {
          quantity: next,
          ...(options.expiryDate !== undefined ? { expiryDate: options.expiryDate } : {}),
          ...(options.unitCost !== undefined ? { unitCost: options.unitCost } : {}),
        },
      })
    : await tx.inventoryStock.create({
        data: {
          hospitalId,
          storeId,
          itemId,
          batchKey: key,
          quantity: next,
          ...(options.batchNumber !== undefined ? { batchNumber: options.batchNumber } : {}),
          ...(options.expiryDate !== undefined ? { expiryDate: options.expiryDate } : {}),
          ...(options.unitCost !== undefined ? { unitCost: options.unitCost } : {}),
        },
      });

  await tx.inventoryStockTransaction.create({
    data: {
      hospitalId,
      storeId,
      itemId,
      transactionType,
      batchKey: key,
      quantity: Math.abs(quantityDelta),
      createdBy: userId,
      ...(options.batchNumber !== undefined ? { batchNumber: options.batchNumber } : {}),
      ...(options.unitCost !== undefined ? { unitCost: options.unitCost } : {}),
      ...(options.referenceType !== undefined ? { referenceType: options.referenceType } : {}),
      ...(options.referenceId !== undefined ? { referenceId: options.referenceId } : {}),
      ...(options.notes !== undefined ? { notes: options.notes } : {}),
    },
  });

  return stock;
}

export function adjustStock(
  hospitalId: string,
  userId: string,
  input: StockAdjustmentInput,
) {
  return prisma.$transaction((tx) =>
    mutateStock(
      tx,
      hospitalId,
      input.storeId,
      input.itemId,
      input.direction === "IN" ? input.quantity : -input.quantity,
      input.direction === "IN"
        ? InventoryStockTransactionType.ADJUSTMENT_IN
        : InventoryStockTransactionType.ADJUSTMENT_OUT,
      userId,
      {
        ...(input.batchNumber !== undefined ? { batchNumber: input.batchNumber } : {}),
        ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
        ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    ),
  );
}

export async function createPurchaseOrder(
  hospitalId: string,
  userId: string,
  purchaseNumber: string,
  input: CreatePurchaseOrderInput,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.inventoryPurchaseOrder.create({
      data: {
        hospitalId,
        supplierId: input.supplierId,
        destinationStoreId: input.destinationStoreId,
        purchaseNumber,
        orderDate: input.orderDate,
        createdBy: userId,
        updatedBy: userId,
        ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
        ...(input.expectedDate !== undefined ? { expectedDate: input.expectedDate } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await tx.inventoryPurchaseOrderItem.createMany({
      data: input.items.map((item) => ({
        hospitalId,
        purchaseOrderId: order.id,
        itemId: item.itemId,
        orderedQuantity: item.orderedQuantity,
        ...(item.unitCost !== undefined ? { unitCost: item.unitCost } : {}),
      })),
    });

    return {
      ...order,
      items: await tx.inventoryPurchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      }),
    };
  });
}

export async function updatePurchaseStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: PurchaseStatusInput,
) {
  const existing = await prisma.inventoryPurchaseOrder.findFirst({
    where: { id, hospitalId },
  });
  if (!existing) return null;

  return prisma.inventoryPurchaseOrder.update({
    where: { id },
    data: {
      status: input.status,
      updatedBy: userId,
      ...(input.status === InventoryPurchaseStatus.APPROVED
        ? { approvedBy: userId, approvedAt: new Date() }
        : {}),
    },
  });
}

export async function createGoodsReceipt(
  hospitalId: string,
  userId: string,
  receiptNumber: string,
  input: CreateGoodsReceiptInput,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.inventoryPurchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, hospitalId },
    });
    if (!order) return null;

    const receipt = await tx.inventoryGoodsReceipt.create({
      data: {
        hospitalId,
        purchaseOrderId: order.id,
        storeId: input.storeId,
        receiptNumber,
        receiptDate: input.receiptDate,
        createdBy: userId,
        ...(input.supplierInvoiceNumber !== undefined
          ? { supplierInvoiceNumber: input.supplierInvoiceNumber }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    for (const item of input.items) {
      await tx.inventoryGoodsReceiptItem.create({
        data: {
          hospitalId,
          goodsReceiptId: receipt.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          itemId: item.itemId,
          receivedQuantity: item.receivedQuantity,
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          ...(item.batchNumber !== undefined ? { batchNumber: item.batchNumber } : {}),
          ...(item.expiryDate !== undefined ? { expiryDate: item.expiryDate } : {}),
          ...(item.unitCost !== undefined ? { unitCost: item.unitCost } : {}),
        },
      });

      await tx.inventoryPurchaseOrderItem.update({
        where: { id: item.purchaseOrderItemId },
        data: { receivedQuantity: { increment: item.acceptedQuantity } },
      });

      if (item.acceptedQuantity > 0) {
        await mutateStock(
          tx,
          hospitalId,
          input.storeId,
          item.itemId,
          item.acceptedQuantity,
          InventoryStockTransactionType.PURCHASE_RECEIPT,
          userId,
          {
            ...(item.batchNumber !== undefined ? { batchNumber: item.batchNumber } : {}),
            ...(item.expiryDate !== undefined ? { expiryDate: item.expiryDate } : {}),
            ...(item.unitCost !== undefined ? { unitCost: item.unitCost } : {}),
            referenceType: "InventoryGoodsReceipt",
            referenceId: receipt.id,
          },
        );
      }
    }

    const orderItems = await tx.inventoryPurchaseOrderItem.findMany({
      where: { purchaseOrderId: order.id },
    });

    const fullyReceived = orderItems.every(
      (item) => Number(item.receivedQuantity) >= Number(item.orderedQuantity),
    );

    await tx.inventoryPurchaseOrder.update({
      where: { id: order.id },
      data: {
        status: fullyReceived
          ? InventoryPurchaseStatus.RECEIVED
          : InventoryPurchaseStatus.PARTIALLY_RECEIVED,
        updatedBy: userId,
      },
    });

    return receipt;
  });
}

export async function createMaterialRequest(
  hospitalId: string,
  userId: string,
  requestNumber: string,
  input: CreateMaterialRequestInput,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.inventoryMaterialRequest.create({
      data: {
        hospitalId,
        fromStoreId: input.fromStoreId,
        requestNumber,
        requestDate: input.requestDate,
        status: InventoryRequestStatus.SUBMITTED,
        createdBy: userId,
        updatedBy: userId,
        ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await tx.inventoryMaterialRequestItem.createMany({
      data: input.items.map((item) => ({
        hospitalId,
        requestId: request.id,
        itemId: item.itemId,
        requestedQty: item.requestedQty,
        ...(item.notes !== undefined ? { notes: item.notes } : {}),
      })),
    });

    return {
      ...request,
      items: await tx.inventoryMaterialRequestItem.findMany({
        where: { requestId: request.id },
      }),
    };
  });
}

export async function updateRequestStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: RequestStatusInput,
) {
  const existing = await prisma.inventoryMaterialRequest.findFirst({
    where: { id, hospitalId },
  });
  if (!existing) return null;

  return prisma.inventoryMaterialRequest.update({
    where: { id },
    data: {
      status: input.status,
      updatedBy: userId,
      ...(input.status === InventoryRequestStatus.APPROVED
        ? { approvedBy: userId, approvedAt: new Date() }
        : {}),
    },
  });
}

export async function issueMaterial(
  hospitalId: string,
  userId: string,
  requestId: string,
  input: IssueMaterialInput,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.inventoryMaterialRequest.findFirst({
      where: { id: requestId, hospitalId },
    });
    if (!request) return null;

    for (const issue of input.items) {
      const requestItem = await tx.inventoryMaterialRequestItem.findFirst({
        where: { id: issue.requestItemId, requestId, hospitalId },
      });
      if (!requestItem) throw new Error("INVENTORY_REQUEST_ITEM_NOT_FOUND");

      const remaining =
        Number(requestItem.requestedQty) - Number(requestItem.issuedQty);

      if (issue.quantity > remaining) {
        throw new Error("ISSUE_QUANTITY_EXCEEDS_REQUEST");
      }

      await mutateStock(
        tx,
        hospitalId,
        request.fromStoreId,
        issue.itemId,
        -issue.quantity,
        InventoryStockTransactionType.MATERIAL_ISSUE,
        userId,
        {
          ...(issue.batchNumber !== undefined ? { batchNumber: issue.batchNumber } : {}),
          referenceType: "InventoryMaterialRequest",
          referenceId: request.id,
        },
      );

      await tx.inventoryMaterialRequestItem.update({
        where: { id: requestItem.id },
        data: { issuedQty: { increment: issue.quantity } },
      });
    }

    const items = await tx.inventoryMaterialRequestItem.findMany({
      where: { requestId },
    });

    const fullyIssued = items.every(
      (item) => Number(item.issuedQty) >= Number(item.requestedQty),
    );

    return tx.inventoryMaterialRequest.update({
      where: { id: request.id },
      data: {
        status: fullyIssued
          ? InventoryRequestStatus.ISSUED
          : InventoryRequestStatus.PARTIALLY_ISSUED,
        updatedBy: userId,
      },
    });
  });
}

export function returnMaterial(
  hospitalId: string,
  userId: string,
  input: MaterialReturnInput,
) {
  return prisma.$transaction((tx) =>
    mutateStock(
      tx,
      hospitalId,
      input.storeId,
      input.itemId,
      input.quantity,
      InventoryStockTransactionType.MATERIAL_RETURN,
      userId,
      {
        ...(input.batchNumber !== undefined ? { batchNumber: input.batchNumber } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    ),
  );
}

export async function createTransfer(
  hospitalId: string,
  userId: string,
  transferNumber: string,
  input: CreateTransferInput,
) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.inventoryTransfer.create({
      data: {
        hospitalId,
        fromStoreId: input.fromStoreId,
        toStoreId: input.toStoreId,
        transferNumber,
        transferDate: input.transferDate,
        status: InventoryTransferStatus.SUBMITTED,
        createdBy: userId,
        updatedBy: userId,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await tx.inventoryTransferItem.createMany({
      data: input.items.map((item) => ({
        hospitalId,
        transferId: transfer.id,
        itemId: item.itemId,
        quantity: item.quantity,
        ...(item.batchNumber !== undefined ? { batchNumber: item.batchNumber } : {}),
      })),
    });

    return {
      ...transfer,
      items: await tx.inventoryTransferItem.findMany({
        where: { transferId: transfer.id },
      }),
    };
  });
}

export async function completeTransfer(
  hospitalId: string,
  userId: string,
  transferId: string,
) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.inventoryTransfer.findFirst({
      where: { id: transferId, hospitalId },
    });
    if (!transfer) return null;
    if (transfer.status === InventoryTransferStatus.COMPLETED) return transfer;

    const items = await tx.inventoryTransferItem.findMany({
      where: { transferId, hospitalId },
    });

    for (const item of items) {
      await mutateStock(
        tx,
        hospitalId,
        transfer.fromStoreId,
        item.itemId,
        -Number(item.quantity),
        InventoryStockTransactionType.TRANSFER_OUT,
        userId,
        {
          ...(item.batchNumber !== null ? { batchNumber: item.batchNumber } : {}),
          referenceType: "InventoryTransfer",
          referenceId: transfer.id,
        },
      );

      await mutateStock(
        tx,
        hospitalId,
        transfer.toStoreId,
        item.itemId,
        Number(item.quantity),
        InventoryStockTransactionType.TRANSFER_IN,
        userId,
        {
          ...(item.batchNumber !== null ? { batchNumber: item.batchNumber } : {}),
          referenceType: "InventoryTransfer",
          referenceId: transfer.id,
        },
      );
    }

    return tx.inventoryTransfer.update({
      where: { id: transfer.id },
      data: {
        status: InventoryTransferStatus.COMPLETED,
        completedAt: new Date(),
        updatedBy: userId,
      },
    });
  });
}

export async function dashboard(hospitalId: string) {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [
    categories,
    items,
    stores,
    suppliers,
    pendingPurchaseOrders,
    pendingMaterialRequests,
    expiringBatches,
    lowStockRows,
  ] = await Promise.all([
    prisma.inventoryCategory.count({ where: { hospitalId, deletedAt: null } }),
    prisma.inventoryItem.count({ where: { hospitalId, deletedAt: null } }),
    prisma.inventoryStore.count({ where: { hospitalId, deletedAt: null } }),
    prisma.inventorySupplier.count({ where: { hospitalId, deletedAt: null } }),
    prisma.inventoryPurchaseOrder.count({
      where: {
        hospitalId,
        status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"] },
      },
    }),
    prisma.inventoryMaterialRequest.count({
      where: {
        hospitalId,
        status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_ISSUED"] },
      },
    }),
    prisma.inventoryStock.count({
      where: {
        hospitalId,
        quantity: { gt: 0 },
        expiryDate: { lte: thirtyDays },
      },
    }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "inventory_items" i
      WHERE i."hospital_id" = ${hospitalId}::uuid
        AND i."deleted_at" IS NULL
        AND i."reorder_level" IS NOT NULL
        AND COALESCE((
          SELECT SUM(s."quantity")
          FROM "inventory_stock" s
          WHERE s."hospital_id" = i."hospital_id"
            AND s."item_id" = i."id"
        ), 0) <= i."reorder_level"
    `,
  ]);

  return {
    categories,
    items,
    stores,
    suppliers,
    lowStockItems: Number(lowStockRows[0]?.count ?? 0n),
    expiringBatches,
    pendingPurchaseOrders,
    pendingMaterialRequests,
  };
}
