import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createDepartmentController,
  getDepartmentController,
  listDepartmentsController,
  updateDepartmentController,
  updateDepartmentStatusController,
} from "./departments.controller";
import { DEPARTMENT_PERMISSIONS } from "./departments.permissions";

export const departmentsRouter = Router();

departmentsRouter.use(authenticate, enforceTenant);

departmentsRouter.get(
  "/",
  requirePermission(DEPARTMENT_PERMISSIONS.VIEW),
  listDepartmentsController,
);

departmentsRouter.post(
  "/",
  requirePermission(DEPARTMENT_PERMISSIONS.CREATE),
  createDepartmentController,
);

departmentsRouter.get(
  "/:id",
  requirePermission(DEPARTMENT_PERMISSIONS.VIEW),
  getDepartmentController,
);

departmentsRouter.patch(
  "/:id",
  requirePermission(DEPARTMENT_PERMISSIONS.UPDATE),
  updateDepartmentController,
);

departmentsRouter.patch(
  "/:id/status",
  requirePermission(DEPARTMENT_PERMISSIONS.UPDATE),
  updateDepartmentStatusController,
);
