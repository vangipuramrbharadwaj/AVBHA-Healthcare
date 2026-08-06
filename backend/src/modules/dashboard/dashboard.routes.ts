import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import { dashboardController } from "./dashboard.controller";
import { DASHBOARD_PERMISSIONS } from "./dashboard.permissions";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  authenticate,
  enforceTenant,
  requirePermission(DASHBOARD_PERMISSIONS.VIEW),
  dashboardController,
);
