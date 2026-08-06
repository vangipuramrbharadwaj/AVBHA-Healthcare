import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  addContrastController,
  createOrderController,
  createProcedureController,
  dashboardController,
  getOrderController,
  listOrdersController,
  listProceduresController,
  saveReportController,
  scheduleStudyController,
  updateReportStatusController,
  updateStudyStatusController,
} from "./radiology.controller";
import { RADIOLOGY_PERMISSIONS } from "./radiology.permissions";

export const radiologyRouter = Router();
radiologyRouter.use(authenticate, enforceTenant);

radiologyRouter.get(
  "/dashboard",
  requirePermission(RADIOLOGY_PERMISSIONS.VIEW),
  dashboardController,
);

radiologyRouter.post(
  "/procedures",
  requirePermission(RADIOLOGY_PERMISSIONS.CREATE),
  createProcedureController,
);

radiologyRouter.get(
  "/procedures",
  requirePermission(RADIOLOGY_PERMISSIONS.VIEW),
  listProceduresController,
);

radiologyRouter.post(
  "/orders",
  requirePermission(RADIOLOGY_PERMISSIONS.CREATE),
  createOrderController,
);

radiologyRouter.get(
  "/orders",
  requirePermission(RADIOLOGY_PERMISSIONS.VIEW),
  listOrdersController,
);

radiologyRouter.get(
  "/orders/:id",
  requirePermission(RADIOLOGY_PERMISSIONS.VIEW),
  getOrderController,
);

radiologyRouter.post(
  "/studies/:id/schedule",
  requirePermission(RADIOLOGY_PERMISSIONS.UPDATE),
  scheduleStudyController,
);

radiologyRouter.post(
  "/studies/:id/status",
  requirePermission(RADIOLOGY_PERMISSIONS.UPDATE),
  updateStudyStatusController,
);

radiologyRouter.post(
  "/studies/:id/contrast",
  requirePermission(RADIOLOGY_PERMISSIONS.UPDATE),
  addContrastController,
);

radiologyRouter.put(
  "/studies/:id/report",
  requirePermission(RADIOLOGY_PERMISSIONS.UPDATE),
  saveReportController,
);

radiologyRouter.post(
  "/reports/:id/status",
  requirePermission(RADIOLOGY_PERMISSIONS.APPROVE),
  updateReportStatusController,
);
