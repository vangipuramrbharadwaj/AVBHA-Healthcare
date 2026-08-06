import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createPatientController,
  deletePatientController,
  getPatientController,
  listPatientsController,
  updatePatientController,
} from "./patients.controller";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

export const patientsRouter = Router();

patientsRouter.use(authenticate, enforceTenant);

patientsRouter.get(
  "/",
  requirePermission(PATIENT_PERMISSIONS.VIEW),
  listPatientsController,
);

patientsRouter.post(
  "/",
  requirePermission(PATIENT_PERMISSIONS.CREATE),
  createPatientController,
);

patientsRouter.get(
  "/:id",
  requirePermission(PATIENT_PERMISSIONS.VIEW),
  getPatientController,
);

patientsRouter.patch(
  "/:id",
  requirePermission(PATIENT_PERMISSIONS.UPDATE),
  updatePatientController,
);

patientsRouter.delete(
  "/:id",
  requirePermission(PATIENT_PERMISSIONS.DELETE),
  deletePatientController,
);
