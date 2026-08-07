import {
  PharmacyDispenseStatus,
  PharmacyMedicineStatus,
  PharmacyPaymentMode,
  PharmacyPurchaseStatus,
  PharmacySaleStatus,
  PharmacyStockTransactionType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

async function nextDocumentNumber(
  hospitalId: string,
  prefix: string,
  type: "sale" | "dispense" | "purchase" | "receipt",
): Promise<string> {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const startsWith = `${prefix}-${datePart}`;

  let count = 0;
  if (type === "sale") {
    count = await prisma.pharmacySale.count({
      where: { hospitalId, saleNumber: { startsWith } },
    });
  } else if (type === "dispense") {
    count = await prisma.pharmacyDispense.count({
      where: { hospitalId, dispenseNumber: { startsWith } },
    });
  } else if (type === "purchase") {
    count = await prisma.pharmacyPurchaseOrder.count({
      where: { hospitalId, purchaseNumber: { startsWith } },
    });
  } else {
    count = await prisma.pharmacyGoodsReceipt.count({
      where: { hospitalId, receiptNumber: { startsWith } },
    });
  }

  return `${startsWith}-${String(count + 1).padStart(4, "0")}`;
}

export async function createSupplier(
  hospitalId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  return prisma.pharmacySupplier.create({
    data: clean({
      hospitalId,
      createdBy: userId,
      updatedBy: userId,
      ...input,
    }) as unknown as Prisma.PharmacySupplierUncheckedCreateInput,
  });
}

export async function createMedicine(
  hospitalId: string,
  userId: string,
  input: {
    medicineCode: string;
    brandName: string;
    controlledDrug: boolean;
    requiresPrescription: boolean;
    genericName?: string | null;
    strength?: string | null;
    dosageForm?: string | null;
    manufacturer?: string | null;
    hsnCode?: string | null;
    gstPercent?: number | null;
    purchasePrice?: number | null;
    sellingPrice?: number | null;
    reorderLevel?: number | null;
    barcode?: string | null;
    storageInstructions?: string | null;
  },
) {
  return prisma.pharmacyMedicine.create({
    data: {
      hospitalId,
      medicineCode: input.medicineCode,
      brandName: input.brandName,
      controlledDrug: input.controlledDrug,
      requiresPrescription: input.requiresPrescription,
      status: PharmacyMedicineStatus.ACTIVE,
      createdBy: userId,
      updatedBy: userId,
      ...(input.genericName !== undefined ? { genericName: input.genericName } : {}),
      ...(input.strength !== undefined ? { strength: input.strength } : {}),
      ...(input.dosageForm !== undefined ? { dosageForm: input.dosageForm } : {}),
      ...(input.manufacturer !== undefined ? { manufacturer: input.manufacturer } : {}),
      ...(input.hsnCode !== undefined ? { hsnCode: input.hsnCode } : {}),
      ...(input.gstPercent !== undefined ? { gstPercent: input.gstPercent } : {}),
      ...(input.purchasePrice !== undefined ? { purchasePrice: input.purchasePrice } : {}),
      ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
      ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
      ...(input.storageInstructions !== undefined ? { storageInstructions: input.storageInstructions } : {}),
    },
  });
}

export async function createBatch(
  hospitalId: string,
  input: Record<string, unknown>,
) {
  return prisma.pharmacyMedicineBatch.create({
    data: clean({
      hospitalId,
      ...input,
    }) as unknown as Prisma.PharmacyMedicineBatchUncheckedCreateInput,
  });
}

export async function listInventory(
  hospitalId: string,
  branchId?: string,
) {
  return prisma.pharmacyMedicine.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      status: PharmacyMedicineStatus.ACTIVE,
    },
    include: {
      batches: {
        where: {
          ...(branchId ? { branchId } : {}),
          status: "ACTIVE",
        },
        orderBy: { expiryDate: "asc" },
      },
    },
    orderBy: { brandName: "asc" },
  });
}

export async function adjustStock(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    medicineId: string;
    batchId: string;
    transactionType: PharmacyStockTransactionType;
    quantity: number;
    remarks?: string | null;
  },
) {
  return prisma.$transaction(async (transaction) => {
    const batch = await transaction.pharmacyMedicineBatch.findFirst({
      where: {
        id: input.batchId,
        hospitalId,
        medicineId: input.medicineId,
        branchId: input.branchId,
      },
    });

    if (!batch) {
      throw new AppError("Medicine batch was not found", 404, "PHARMACY_BATCH_NOT_FOUND");
    }

    const increases = [
      PharmacyStockTransactionType.PURCHASE,
      PharmacyStockTransactionType.RETURN_IN,
      PharmacyStockTransactionType.ADJUSTMENT_IN,
      PharmacyStockTransactionType.TRANSFER_IN,
    ] as const;

    const increase = (increases as readonly PharmacyStockTransactionType[]).includes(
      input.transactionType,
    );

    const nextQuantity = increase
      ? Number(batch.availableQuantity) + input.quantity
      : Number(batch.availableQuantity) - input.quantity;

    if (nextQuantity < 0) {
      throw new AppError("Insufficient stock", 409, "PHARMACY_INSUFFICIENT_STOCK");
    }

    const updated = await transaction.pharmacyMedicineBatch.update({
      where: { id: batch.id },
      data: { availableQuantity: nextQuantity },
    });

    await transaction.pharmacyStockTransaction.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        medicineId: input.medicineId,
        batchId: batch.id,
        transactionType: input.transactionType,
        quantity: input.quantity,
        balanceAfter: nextQuantity,
        createdBy: userId,
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
    });

    return updated;
  });
}

export async function createPurchaseOrder(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    supplierId: string;
    discountAmount: number;
    expectedDate?: Date | null;
    notes?: string | null;
    items: Array<{
      medicineId: string;
      orderedQuantity: number;
      unitPrice: number;
      taxPercent?: number | null;
      discountPercent?: number | null;
    }>;
  },
) {
  const purchaseNumber = await nextDocumentNumber(
    hospitalId,
    "PO",
    "purchase",
  );

  let subtotal = 0;
  let taxAmount = 0;

  const calculatedItems = input.items.map((item) => {
    const base = item.orderedQuantity * item.unitPrice;
    const discount =
      item.discountPercent !== undefined && item.discountPercent !== null
        ? (base * item.discountPercent) / 100
        : 0;
    const taxable = base - discount;
    const tax =
      item.taxPercent !== undefined && item.taxPercent !== null
        ? (taxable * item.taxPercent) / 100
        : 0;

    subtotal += taxable;
    taxAmount += tax;

    return {
      hospitalId,
      medicineId: item.medicineId,
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice,
      lineTotal: taxable + tax,
      ...(item.taxPercent !== undefined ? { taxPercent: item.taxPercent } : {}),
      ...(item.discountPercent !== undefined ? { discountPercent: item.discountPercent } : {}),
    };
  });

  const totalAmount = subtotal + taxAmount - input.discountAmount;

  return prisma.pharmacyPurchaseOrder.create({
    data: {
      hospitalId,
      branchId: input.branchId,
      supplierId: input.supplierId,
      purchaseNumber,
      status: PharmacyPurchaseStatus.ORDERED,
      subtotal,
      taxAmount,
      discountAmount: input.discountAmount,
      totalAmount,
      createdBy: userId,
      updatedBy: userId,
      ...(input.expectedDate !== undefined ? { expectedDate: input.expectedDate } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      items: { create: calculatedItems },
    },
    include: { items: true, supplier: true },
  });
}

export async function receivePurchaseOrder(
  hospitalId: string,
  purchaseOrderId: string,
  userId: string,
  input: {
    supplierInvoice?: string | null;
    notes?: string | null;
    batches: Array<{
      purchaseOrderItemId: string;
      medicineId: string;
      batchNumber: string;
      manufacturingDate?: Date | null;
      expiryDate: Date;
      purchasePrice: number;
      sellingPrice: number;
      receivedQuantity: number;
      rackLocation?: string | null;
    }>;
  },
) {
  const purchaseOrder = await prisma.pharmacyPurchaseOrder.findFirst({
    where: { id: purchaseOrderId, hospitalId },
  });

  if (!purchaseOrder) {
    throw new AppError("Purchase order was not found", 404, "PHARMACY_PURCHASE_ORDER_NOT_FOUND");
  }

  const receiptNumber = await nextDocumentNumber(
    hospitalId,
    "GRN",
    "receipt",
  );

  return prisma.$transaction(async (transaction) => {
    const receipt = await transaction.pharmacyGoodsReceipt.create({
      data: {
        hospitalId,
        branchId: purchaseOrder.branchId,
        purchaseOrderId,
        receiptNumber,
        createdBy: userId,
        ...(input.supplierInvoice !== undefined ? { supplierInvoice: input.supplierInvoice } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    for (const item of input.batches) {
      const purchaseItem = await transaction.pharmacyPurchaseOrderItem.findFirst({
        where: {
          id: item.purchaseOrderItemId,
          purchaseOrderId,
          hospitalId,
          medicineId: item.medicineId,
        },
      });

      if (!purchaseItem) {
        throw new AppError("Purchase order item was not found", 404, "PHARMACY_PURCHASE_ITEM_NOT_FOUND");
      }

      const batch = await transaction.pharmacyMedicineBatch.create({
        data: {
          hospitalId,
          branchId: purchaseOrder.branchId,
          medicineId: item.medicineId,
          supplierId: purchaseOrder.supplierId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          availableQuantity: item.receivedQuantity,
          ...(item.manufacturingDate !== undefined ? { manufacturingDate: item.manufacturingDate } : {}),
          ...(item.rackLocation !== undefined ? { rackLocation: item.rackLocation } : {}),
        },
      });

      await transaction.pharmacyPurchaseOrderItem.update({
        where: { id: purchaseItem.id },
        data: {
          receivedQuantity:
            Number(purchaseItem.receivedQuantity) + item.receivedQuantity,
        },
      });

      await transaction.pharmacyStockTransaction.create({
        data: {
          hospitalId,
          branchId: purchaseOrder.branchId,
          medicineId: item.medicineId,
          batchId: batch.id,
          transactionType: PharmacyStockTransactionType.PURCHASE,
          quantity: item.receivedQuantity,
          balanceAfter: item.receivedQuantity,
          referenceType: "PHARMACY_GOODS_RECEIPT",
          referenceId: receipt.id,
          createdBy: userId,
        },
      });
    }

    await transaction.pharmacyPurchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: PharmacyPurchaseStatus.RECEIVED,
        updatedBy: userId,
      },
    });

    return receipt;
  });
}

async function reduceBatchStock(
  transaction: Prisma.TransactionClient,
  hospitalId: string,
  branchId: string,
  userId: string,
  batchId: string,
  medicineId: string,
  quantity: number,
  transactionType: PharmacyStockTransactionType,
  referenceType: string,
  referenceId: string,
) {
  const batch = await transaction.pharmacyMedicineBatch.findFirst({
    where: { id: batchId, hospitalId, branchId, medicineId },
  });

  if (!batch || Number(batch.availableQuantity) < quantity) {
    throw new AppError("Insufficient medicine stock", 409, "PHARMACY_INSUFFICIENT_STOCK");
  }

  const balanceAfter = Number(batch.availableQuantity) - quantity;

  await transaction.pharmacyMedicineBatch.update({
    where: { id: batch.id },
    data: { availableQuantity: balanceAfter },
  });

  await transaction.pharmacyStockTransaction.create({
    data: {
      hospitalId,
      branchId,
      medicineId,
      batchId,
      transactionType,
      quantity,
      balanceAfter,
      referenceType,
      referenceId,
      createdBy: userId,
    },
  });
}

export async function createSale(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    paymentMode: PharmacyPaymentMode;
    discountAmount: number;
    amountPaid: number;
    patientId?: string | null;
    notes?: string | null;
    items: Array<{
      medicineId: string;
      batchId: string;
      quantity: number;
      unitPrice: number;
      taxPercent?: number | null;
      discountPercent?: number | null;
    }>;
  },
) {
  const saleNumber = await nextDocumentNumber(hospitalId, "PHS", "sale");

  return prisma.$transaction(async (transaction) => {
    let subtotal = 0;
    let taxAmount = 0;

    const items = input.items.map((item) => {
      const base = item.quantity * item.unitPrice;
      const discount =
        item.discountPercent !== undefined && item.discountPercent !== null
          ? (base * item.discountPercent) / 100
          : 0;
      const taxable = base - discount;
      const tax =
        item.taxPercent !== undefined && item.taxPercent !== null
          ? (taxable * item.taxPercent) / 100
          : 0;

      subtotal += taxable;
      taxAmount += tax;

      return {
        hospitalId,
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: taxable + tax,
        ...(item.taxPercent !== undefined ? { taxPercent: item.taxPercent } : {}),
        ...(item.discountPercent !== undefined ? { discountPercent: item.discountPercent } : {}),
      };
    });

    const sale = await transaction.pharmacySale.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        saleNumber,
        status: PharmacySaleStatus.COMPLETED,
        paymentMode: input.paymentMode,
        subtotal,
        taxAmount,
        discountAmount: input.discountAmount,
        totalAmount: subtotal + taxAmount - input.discountAmount,
        amountPaid: input.amountPaid,
        createdBy: userId,
        ...(input.patientId !== undefined ? { patientId: input.patientId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        items: { create: items },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      await reduceBatchStock(
        transaction,
        hospitalId,
        input.branchId,
        userId,
        item.batchId,
        item.medicineId,
        item.quantity,
        PharmacyStockTransactionType.SALE,
        "PHARMACY_SALE",
        sale.id,
      );
    }

    return sale;
  });
}

export async function createDispense(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    opdVisitId?: string | null;
    ipdAdmissionId?: string | null;
    prescriptionId?: string | null;
    notes?: string | null;
    items: Array<{
      medicineId: string;
      batchId: string;
      prescribedQuantity?: number | null;
      dispensedQuantity: number;
      unitPrice: number;
      substitutionReason?: string | null;
      instructions?: string | null;
    }>;
  },
) {
  const dispenseNumber = await nextDocumentNumber(
    hospitalId,
    "PHD",
    "dispense",
  );

  return prisma.$transaction(async (transaction) => {
    const dispense = await transaction.pharmacyDispense.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        patientId: input.patientId,
        dispenseNumber,
        status: PharmacyDispenseStatus.COMPLETED,
        dispensedAt: new Date(),
        dispensedBy: userId,
        ...(input.opdVisitId !== undefined ? { opdVisitId: input.opdVisitId } : {}),
        ...(input.ipdAdmissionId !== undefined ? { ipdAdmissionId: input.ipdAdmissionId } : {}),
        ...(input.prescriptionId !== undefined ? { prescriptionId: input.prescriptionId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        items: {
          create: input.items.map((item) => ({
            hospitalId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            dispensedQuantity: item.dispensedQuantity,
            unitPrice: item.unitPrice,
            lineTotal: item.dispensedQuantity * item.unitPrice,
            ...(item.prescribedQuantity !== undefined ? { prescribedQuantity: item.prescribedQuantity } : {}),
            ...(item.substitutionReason !== undefined ? { substitutionReason: item.substitutionReason } : {}),
            ...(item.instructions !== undefined ? { instructions: item.instructions } : {}),
          })),
        },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      await reduceBatchStock(
        transaction,
        hospitalId,
        input.branchId,
        userId,
        item.batchId,
        item.medicineId,
        item.dispensedQuantity,
        PharmacyStockTransactionType.DISPENSE,
        "PHARMACY_DISPENSE",
        dispense.id,
      );
    }

    return dispense;
  });
}

export async function listSales(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    status?: PharmacySaleStatus;
  },
) {
  const where: Prisma.PharmacySaleWhereInput = {
    hospitalId,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.pharmacySale.findMany({
      where,
      include: {
        patient: true,
        items: {
          include: { medicine: true, batch: true },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { saleDate: "desc" },
    }),
    prisma.pharmacySale.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function listPurchaseOrders(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    supplierId?: string;
    status?: PharmacyPurchaseStatus;
  },
) {
  const where: Prisma.PharmacyPurchaseOrderWhereInput = {
    hospitalId,
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.pharmacyPurchaseOrder.findMany({
      where,
      include: { supplier: true, items: { include: { medicine: true } } },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { orderDate: "desc" },
    }),
    prisma.pharmacyPurchaseOrder.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function dashboard(
  hospitalId: string,
  date: Date,
) {
  const nearExpiryDate = new Date(date);
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 90);

  const [medicineCount, sales, lowStock, nearExpiry, pendingDispenses] =
    await Promise.all([
      prisma.pharmacyMedicine.count({
        where: {
          hospitalId,
          status: PharmacyMedicineStatus.ACTIVE,
          deletedAt: null,
        },
      }),
      prisma.pharmacySale.aggregate({
        where: {
          hospitalId,
          status: PharmacySaleStatus.COMPLETED,
          saleDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.pharmacyMedicineBatch.count({
        where: {
          hospitalId,
          status: "ACTIVE",
          availableQuantity: { lte: 5 },
        },
      }),
      prisma.pharmacyMedicineBatch.count({
        where: {
          hospitalId,
          status: "ACTIVE",
          expiryDate: {
            gte: startOfDay(date),
            lte: endOfDay(nearExpiryDate),
          },
        },
      }),
      prisma.pharmacyDispense.count({
        where: {
          hospitalId,
          status: {
            in: [
              PharmacyDispenseStatus.PENDING,
              PharmacyDispenseStatus.PARTIAL,
            ],
          },
        },
      }),
    ]);

  return {
    date: startOfDay(date).toISOString().slice(0, 10),
    totalMedicines: medicineCount,
    todaySalesCount: sales._count._all,
    todaySalesAmount: Number(sales._sum.totalAmount ?? 0),
    lowStockBatches: lowStock,
    nearExpiryBatches: nearExpiry,
    pendingDispenses,
  };
}
