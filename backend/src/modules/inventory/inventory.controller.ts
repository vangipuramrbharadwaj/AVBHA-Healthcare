import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./inventory.schema";
import * as service from "./inventory.service";

export async function listCategoriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.inventoryListQuerySchema.parse(req.query);
    const result = await service.listCategories(req.auth!.hospitalId, query);
    res.status(200).json(successResponse(result, "Inventory categories retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createCategoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createInventoryCategorySchema.parse(req.body);
    const result = await service.createCategory(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory category saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listItemsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.inventoryListQuerySchema.parse(req.query);
    const result = await service.listItems(req.auth!.hospitalId, query);
    res.status(200).json(successResponse(result, "Inventory items retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createInventoryItemSchema.parse(req.body);
    const result = await service.createItem(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory item saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listStoresController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listStores(req.auth!.hospitalId);
    res.status(200).json(successResponse(result, "Inventory stores retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createStoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createInventoryStoreSchema.parse(req.body);
    const result = await service.createStore(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory store saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listSuppliersController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listSuppliers(req.auth!.hospitalId);
    res.status(200).json(successResponse(result, "Inventory suppliers retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createSupplierController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createInventorySupplierSchema.parse(req.body);
    const result = await service.createSupplier(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory supplier saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listStockController(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = typeof req.query.storeId === "string" ? req.query.storeId : undefined;
    const result = await service.listStock(req.auth!.hospitalId, storeId);
    res.status(200).json(successResponse(result, "Inventory stock retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function adjustStockController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.stockAdjustmentSchema.parse(req.body);
    const result = await service.adjustStock(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(200).json(successResponse(result, "Inventory stock adjusted successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createPurchaseOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createPurchaseOrderSchema.parse(req.body);
    const result = await service.createPurchaseOrder(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory purchase order created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function updatePurchaseStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.inventoryIdParamSchema.parse(req.params);
    const input = schema.purchaseStatusSchema.parse(req.body);
    const result = await service.updatePurchaseStatus(req.auth!.hospitalId, req.auth!.userId, id, input);
    res.status(200).json(successResponse(result, "Inventory purchase order status updated successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createGoodsReceiptController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createGoodsReceiptSchema.parse(req.body);
    const result = await service.createGoodsReceipt(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory goods receipt completed successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createMaterialRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createMaterialRequestSchema.parse(req.body);
    const result = await service.createMaterialRequest(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory material request created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function updateRequestStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.inventoryIdParamSchema.parse(req.params);
    const input = schema.requestStatusSchema.parse(req.body);
    const result = await service.updateRequestStatus(req.auth!.hospitalId, req.auth!.userId, id, input);
    res.status(200).json(successResponse(result, "Inventory material request status updated successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function issueMaterialController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.inventoryIdParamSchema.parse(req.params);
    const input = schema.issueMaterialSchema.parse(req.body);
    const result = await service.issueMaterial(req.auth!.hospitalId, req.auth!.userId, id, input);
    res.status(200).json(successResponse(result, "Inventory material issued successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function returnMaterialController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.materialReturnSchema.parse(req.body);
    const result = await service.returnMaterial(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(200).json(successResponse(result, "Inventory material returned successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createTransferController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createTransferSchema.parse(req.body);
    const result = await service.createTransfer(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Inventory transfer created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function completeTransferController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.inventoryIdParamSchema.parse(req.params);
    const result = await service.completeTransfer(req.auth!.hospitalId, req.auth!.userId, id);
    res.status(200).json(successResponse(result, "Inventory transfer completed successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.dashboard(req.auth!.hospitalId);
    res.status(200).json(successResponse(result, "Inventory dashboard retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
