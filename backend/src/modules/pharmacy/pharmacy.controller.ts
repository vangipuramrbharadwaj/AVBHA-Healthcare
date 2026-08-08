import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./pharmacy.schema";
import * as service from "./pharmacy.service";


export async function listMedicinesController(req: Request, res: Response, next: NextFunction) {
  try { const search = typeof req.query.search === "string" ? req.query.search : undefined; const result = await service.listMedicines(req.auth!.hospitalId, search); res.json(successResponse(result, "Medicines retrieved successfully", req.requestId)); } catch (error) { next(error); }
}
export async function listSuppliersController(req: Request, res: Response, next: NextFunction) {
  try { const result = await service.listSuppliers(req.auth!.hospitalId); res.json(successResponse(result, "Suppliers retrieved successfully", req.requestId)); } catch (error) { next(error); }
}
export async function stockLedgerController(req: Request, res: Response, next: NextFunction) {
  try { const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined; const result = await service.listStockLedger(req.auth!.hospitalId, branchId); res.json(successResponse(result, "Stock ledger retrieved successfully", req.requestId)); } catch (error) { next(error); }
}

export async function createSupplierController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createSupplier(
      req.auth!.hospitalId,
      req.auth!.userId,
      schema.supplierSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Supplier created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createMedicineController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.medicineSchema.parse(req.body);
    const result = await service.createMedicine(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        medicineCode: input.medicineCode,
        brandName: input.brandName,
        controlledDrug: input.controlledDrug,
        requiresPrescription: input.requiresPrescription,
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
    );
    res.status(201).json(successResponse(result, "Medicine created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createBatchController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createBatch(
      req.auth!.hospitalId,
      schema.batchSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Medicine batch created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function inventoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const result = await service.listInventory(req.auth!.hospitalId, branchId);
    res.json(successResponse(result, "Pharmacy inventory retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function adjustStockController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.stockAdjustmentSchema.parse(req.body);
    const result = await service.adjustStock(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        medicineId: input.medicineId,
        batchId: input.batchId,
        transactionType: input.transactionType,
        quantity: input.quantity,
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
    );
    res.json(successResponse(result, "Stock adjusted successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createPurchaseOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.purchaseOrderSchema.parse(req.body);
    const items = input.items.map((item) => ({
      medicineId: item.medicineId,
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice,
      ...(item.taxPercent !== undefined ? { taxPercent: item.taxPercent } : {}),
      ...(item.discountPercent !== undefined ? { discountPercent: item.discountPercent } : {}),
    }));

    const result = await service.createPurchaseOrder(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        supplierId: input.supplierId,
        discountAmount: input.discountAmount,
        items,
        ...(input.expectedDate !== undefined ? { expectedDate: input.expectedDate } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Purchase order created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function receivePurchaseOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.goodsReceiptSchema.parse(req.body);
    const batches = input.batches.map((item) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,
      medicineId: item.medicineId,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      receivedQuantity: item.receivedQuantity,
      ...(item.manufacturingDate !== undefined ? { manufacturingDate: item.manufacturingDate } : {}),
      ...(item.rackLocation !== undefined ? { rackLocation: item.rackLocation } : {}),
    }));

    const result = await service.receivePurchaseOrder(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        batches,
        ...(input.supplierInvoice !== undefined ? { supplierInvoice: input.supplierInvoice } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Goods receipt completed successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createSaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.saleSchema.parse(req.body);
    const items = input.items.map((item) => ({
      medicineId: item.medicineId,
      batchId: item.batchId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(item.taxPercent !== undefined ? { taxPercent: item.taxPercent } : {}),
      ...(item.discountPercent !== undefined ? { discountPercent: item.discountPercent } : {}),
    }));

    const result = await service.createSale(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        paymentMode: input.paymentMode,
        discountAmount: input.discountAmount,
        amountPaid: input.amountPaid,
        items,
        ...(input.patientId !== undefined ? { patientId: input.patientId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Pharmacy sale completed successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function prescriptionQueueController(req: Request,res: Response,next: NextFunction) {
  try {
    const branchId=typeof req.query.branchId==="string"&&req.query.branchId?req.query.branchId:undefined;
    const result=await service.listPrescriptionQueue(req.auth!.hospitalId,branchId);
    res.json(successResponse(result,"Pharmacy prescription queue retrieved successfully",req.requestId));
  } catch(error){next(error);}
}

export async function createDispenseController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.dispenseSchema.parse(req.body);
    const items = input.items.map((item) => ({
      medicineId: item.medicineId,
      batchId: item.batchId,
      dispensedQuantity: item.dispensedQuantity,
      unitPrice: item.unitPrice,
      ...(item.prescribedQuantity !== undefined ? { prescribedQuantity: item.prescribedQuantity } : {}),
      ...(item.substitutionReason !== undefined ? { substitutionReason: item.substitutionReason } : {}),
      ...(item.instructions !== undefined ? { instructions: item.instructions } : {}),
    }));

    const result = await service.createDispense(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        items,
        ...(input.opdVisitId !== undefined ? { opdVisitId: input.opdVisitId } : {}),
        ...(input.ipdAdmissionId !== undefined ? { ipdAdmissionId: input.ipdAdmissionId } : {}),
        ...(input.prescriptionId !== undefined ? { prescriptionId: input.prescriptionId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Medicines dispensed successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listSalesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listSalesSchema.parse(req.query);
    const result = await service.listSales(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined ? { patientId: query.patientId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
    );
    res.json(successResponse(result, "Pharmacy sales retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listPurchaseOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listPurchaseOrdersSchema.parse(req.query);
    const result = await service.listPurchaseOrders(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.supplierId !== undefined ? { supplierId: query.supplierId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
    );
    res.json(successResponse(result, "Purchase orders retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.dashboardQuerySchema.parse(req.query);
    const result = await service.dashboard(
      req.auth!.hospitalId,
      query.date ?? new Date(),
    );
    res.json(successResponse(result, "Pharmacy dashboard retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
