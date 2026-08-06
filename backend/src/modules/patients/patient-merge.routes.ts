import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createIdentifierController,
  createMergeRequestController,
  deactivateIdentifierController,
  listIdentifiersController,
  listMergeRequestsController,
  reviewMergeRequestController,
} from "./patient-package3.controller";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

export const patientMergeRouter = Router();
patientMergeRouter.use(authenticate, enforceTenant);

patientMergeRouter.get("/merge-requests", requirePermission(PATIENT_PERMISSIONS.VIEW), listMergeRequestsController);
patientMergeRouter.post("/merge-requests", requirePermission(PATIENT_PERMISSIONS.UPDATE), createMergeRequestController);
patientMergeRouter.patch("/merge-requests/:requestId/review", requirePermission(PATIENT_PERMISSIONS.APPROVE), reviewMergeRequestController);
patientMergeRouter.get("/:id/identifiers", requirePermission(PATIENT_PERMISSIONS.VIEW), listIdentifiersController);
patientMergeRouter.post("/:id/identifiers", requirePermission(PATIENT_PERMISSIONS.UPDATE), createIdentifierController);
patientMergeRouter.delete("/:id/identifiers/:resourceId", requirePermission(PATIENT_PERMISSIONS.DELETE), deactivateIdentifierController);
