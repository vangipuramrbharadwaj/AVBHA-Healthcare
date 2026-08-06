import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  acknowledgeAlertController,
  advancedSearchController,
  archiveAlertController,
  archiveFamilyController,
  createAlertController,
  createFamilyController,
  duplicateSearchController,
  listAlertsController,
  listFamilyController,
  updateAlertController,
  updateFamilyController,
} from "./patient-package3.controller";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

export const patientAdvancedRouter = Router();
patientAdvancedRouter.use(authenticate, enforceTenant);

patientAdvancedRouter.get("/duplicates/search", requirePermission(PATIENT_PERMISSIONS.VIEW), duplicateSearchController);
patientAdvancedRouter.get("/advanced-search", requirePermission(PATIENT_PERMISSIONS.VIEW), advancedSearchController);
patientAdvancedRouter.get("/:id/family", requirePermission(PATIENT_PERMISSIONS.VIEW), listFamilyController);
patientAdvancedRouter.post("/:id/family", requirePermission(PATIENT_PERMISSIONS.UPDATE), createFamilyController);
patientAdvancedRouter.patch("/:id/family/:resourceId", requirePermission(PATIENT_PERMISSIONS.UPDATE), updateFamilyController);
patientAdvancedRouter.delete("/:id/family/:resourceId", requirePermission(PATIENT_PERMISSIONS.DELETE), archiveFamilyController);
patientAdvancedRouter.get("/:id/alerts", requirePermission(PATIENT_PERMISSIONS.VIEW), listAlertsController);
patientAdvancedRouter.post("/:id/alerts", requirePermission(PATIENT_PERMISSIONS.UPDATE), createAlertController);
patientAdvancedRouter.patch("/:id/alerts/:resourceId", requirePermission(PATIENT_PERMISSIONS.UPDATE), updateAlertController);
patientAdvancedRouter.patch("/:id/alerts/:resourceId/acknowledge", requirePermission(PATIENT_PERMISSIONS.UPDATE), acknowledgeAlertController);
patientAdvancedRouter.delete("/:id/alerts/:resourceId", requirePermission(PATIENT_PERMISSIONS.DELETE), archiveAlertController);
