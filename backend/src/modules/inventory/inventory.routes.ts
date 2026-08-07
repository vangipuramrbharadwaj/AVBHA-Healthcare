import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import * as controller from "./inventory.controller";
import { INVENTORY_PERMISSIONS } from "./inventory.permissions";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate, enforceTenant);

inventoryRouter.get("/dashboard", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.dashboardController);

inventoryRouter.get("/categories", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.listCategoriesController);
inventoryRouter.post("/categories", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createCategoryController);

inventoryRouter.get("/items", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.listItemsController);
inventoryRouter.post("/items", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createItemController);

inventoryRouter.get("/stores", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.listStoresController);
inventoryRouter.post("/stores", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createStoreController);

inventoryRouter.get("/suppliers", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.listSuppliersController);
inventoryRouter.post("/suppliers", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createSupplierController);

inventoryRouter.get("/stock", requirePermission(INVENTORY_PERMISSIONS.VIEW), controller.listStockController);
inventoryRouter.post("/stock/adjustments", requirePermission(INVENTORY_PERMISSIONS.UPDATE), controller.adjustStockController);
inventoryRouter.post("/stock/returns", requirePermission(INVENTORY_PERMISSIONS.UPDATE), controller.returnMaterialController);

inventoryRouter.post("/purchase-orders", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createPurchaseOrderController);
inventoryRouter.patch("/purchase-orders/:id/status", requirePermission(INVENTORY_PERMISSIONS.APPROVE), controller.updatePurchaseStatusController);
inventoryRouter.post("/goods-receipts", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createGoodsReceiptController);

inventoryRouter.post("/material-requests", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createMaterialRequestController);
inventoryRouter.patch("/material-requests/:id/status", requirePermission(INVENTORY_PERMISSIONS.APPROVE), controller.updateRequestStatusController);
inventoryRouter.post("/material-requests/:id/issue", requirePermission(INVENTORY_PERMISSIONS.UPDATE), controller.issueMaterialController);

inventoryRouter.post("/transfers", requirePermission(INVENTORY_PERMISSIONS.CREATE), controller.createTransferController);
inventoryRouter.post("/transfers/:id/complete", requirePermission(INVENTORY_PERMISSIONS.UPDATE), controller.completeTransferController);
