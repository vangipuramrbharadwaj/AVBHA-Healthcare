import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createDesignationController,
  getDesignationController,
  listDesignationsController,
  updateDesignationController,
  updateDesignationStatusController,
} from "./designations.controller";
import { DESIGNATION_PERMISSIONS } from "./designations.permissions";

export const designationsRouter = Router();

designationsRouter.use(authenticate, enforceTenant);

designationsRouter.get(
  "/",
  requirePermission(DESIGNATION_PERMISSIONS.VIEW),
  listDesignationsController,
);

designationsRouter.post(
  "/",
  requirePermission(DESIGNATION_PERMISSIONS.CREATE),
  createDesignationController,
);

designationsRouter.get(
  "/:id",
  requirePermission(DESIGNATION_PERMISSIONS.VIEW),
  getDesignationController,
);

designationsRouter.patch(
  "/:id",
  requirePermission(DESIGNATION_PERMISSIONS.UPDATE),
  updateDesignationController,
);

designationsRouter.patch(
  "/:id/status",
  requirePermission(DESIGNATION_PERMISSIONS.UPDATE),
  updateDesignationStatusController,
);
