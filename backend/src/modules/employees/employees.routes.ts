import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createEmployeeController,
  createEmployeeDocumentController,
  deleteEmployeeDocumentController,
  getEmployeeController,
  listEmployeeDocumentsController,
  listEmployeesController,
  updateEmployeeController,
  updateEmployeeDocumentController,
  updateEmployeeStatusController,
} from "./employees.controller";
import { EMPLOYEE_PERMISSIONS } from "./employees.permissions";

export const employeesRouter = Router();

employeesRouter.use(authenticate, enforceTenant);

employeesRouter.get(
  "/",
  requirePermission(EMPLOYEE_PERMISSIONS.VIEW),
  listEmployeesController,
);

employeesRouter.post(
  "/",
  requirePermission(EMPLOYEE_PERMISSIONS.CREATE),
  createEmployeeController,
);

employeesRouter.get(
  "/:id",
  requirePermission(EMPLOYEE_PERMISSIONS.VIEW),
  getEmployeeController,
);

employeesRouter.patch(
  "/:id",
  requirePermission(EMPLOYEE_PERMISSIONS.UPDATE),
  updateEmployeeController,
);

employeesRouter.patch(
  "/:id/status",
  requirePermission(EMPLOYEE_PERMISSIONS.UPDATE),
  updateEmployeeStatusController,
);

employeesRouter.get(
  "/:id/documents",
  requirePermission(EMPLOYEE_PERMISSIONS.VIEW),
  listEmployeeDocumentsController,
);

employeesRouter.post(
  "/:id/documents",
  requirePermission(EMPLOYEE_PERMISSIONS.UPDATE),
  createEmployeeDocumentController,
);

employeesRouter.patch(
  "/:id/documents/:documentId",
  requirePermission(EMPLOYEE_PERMISSIONS.UPDATE),
  updateEmployeeDocumentController,
);

employeesRouter.delete(
  "/:id/documents/:documentId",
  requirePermission(EMPLOYEE_PERMISSIONS.DELETE),
  deleteEmployeeDocumentController,
);
