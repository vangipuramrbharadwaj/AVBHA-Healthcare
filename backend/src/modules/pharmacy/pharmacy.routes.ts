import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  adjustStockController,
  createBatchController,
  createDispenseController,
  createMedicineController,
  createPurchaseOrderController,
  createSaleController,
  createSupplierController,
  dashboardController,
  inventoryController,
  listPurchaseOrdersController,
  listSalesController,
  receivePurchaseOrderController,
} from "./pharmacy.controller";
import { PHARMACY_PERMISSIONS } from "./pharmacy.permissions";

export const pharmacyRouter = Router();
pharmacyRouter.use(authenticate, enforceTenant);

pharmacyRouter.get("/dashboard", requirePermission(PHARMACY_PERMISSIONS.VIEW), dashboardController);
pharmacyRouter.post("/suppliers", requirePermission(PHARMACY_PERMISSIONS.CREATE), createSupplierController);
pharmacyRouter.post("/medicines", requirePermission(PHARMACY_PERMISSIONS.CREATE), createMedicineController);
pharmacyRouter.post("/batches", requirePermission(PHARMACY_PERMISSIONS.CREATE), createBatchController);
pharmacyRouter.get("/inventory", requirePermission(PHARMACY_PERMISSIONS.VIEW), inventoryController);
pharmacyRouter.post("/stock-adjustments", requirePermission(PHARMACY_PERMISSIONS.UPDATE), adjustStockController);

pharmacyRouter.post("/purchase-orders", requirePermission(PHARMACY_PERMISSIONS.CREATE), createPurchaseOrderController);
pharmacyRouter.get("/purchase-orders", requirePermission(PHARMACY_PERMISSIONS.VIEW), listPurchaseOrdersController);
pharmacyRouter.post("/purchase-orders/:id/receive", requirePermission(PHARMACY_PERMISSIONS.UPDATE), receivePurchaseOrderController);

pharmacyRouter.post("/sales", requirePermission(PHARMACY_PERMISSIONS.CREATE), createSaleController);
pharmacyRouter.get("/sales", requirePermission(PHARMACY_PERMISSIONS.VIEW), listSalesController);
pharmacyRouter.post("/dispenses", requirePermission(PHARMACY_PERMISSIONS.CREATE), createDispenseController);
