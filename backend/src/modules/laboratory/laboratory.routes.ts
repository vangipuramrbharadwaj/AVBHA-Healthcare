import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  collectSampleController,
  createOrderController,
  createTestController,
  enterResultController,
  getOrderController,
  listOrdersController,
  listTestsController,
  rejectSampleController,
  updateResultStatusController,
} from "./laboratory.controller";
import { LABORATORY_PERMISSIONS } from "./laboratory.permissions";

export const laboratoryRouter = Router();
laboratoryRouter.use(authenticate, enforceTenant);

laboratoryRouter.post("/tests", requirePermission(LABORATORY_PERMISSIONS.CREATE), createTestController);
laboratoryRouter.get("/tests", requirePermission(LABORATORY_PERMISSIONS.VIEW), listTestsController);
laboratoryRouter.post("/orders", requirePermission(LABORATORY_PERMISSIONS.CREATE), createOrderController);
laboratoryRouter.get("/orders", requirePermission(LABORATORY_PERMISSIONS.VIEW), listOrdersController);
laboratoryRouter.get("/orders/:id", requirePermission(LABORATORY_PERMISSIONS.VIEW), getOrderController);
laboratoryRouter.post("/samples/:id/collect", requirePermission(LABORATORY_PERMISSIONS.UPDATE), collectSampleController);
laboratoryRouter.post("/samples/:id/reject", requirePermission(LABORATORY_PERMISSIONS.UPDATE), rejectSampleController);
laboratoryRouter.put("/order-items/:id/result", requirePermission(LABORATORY_PERMISSIONS.UPDATE), enterResultController);
laboratoryRouter.post("/results/:id/status", requirePermission(LABORATORY_PERMISSIONS.APPROVE), updateResultStatusController);
