import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  allergyHandlers,
  chronicDiseaseHandlers,
  documentHandlers,
  insuranceHandlers,
  medicalHistoryHandlers,
  timelineController,
} from "./patient-clinical.controller";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

export const patientClinicalRouter = Router();
patientClinicalRouter.use(authenticate, enforceTenant);

function registerResource(path: string, handlers: any) {
  patientClinicalRouter.get(
    `/:id/${path}`,
    requirePermission(PATIENT_PERMISSIONS.VIEW),
    handlers.list,
  );
  patientClinicalRouter.post(
    `/:id/${path}`,
    requirePermission(PATIENT_PERMISSIONS.UPDATE),
    handlers.create,
  );
  patientClinicalRouter.patch(
    `/:id/${path}/:resourceId`,
    requirePermission(PATIENT_PERMISSIONS.UPDATE),
    handlers.update,
  );
  patientClinicalRouter.delete(
    `/:id/${path}/:resourceId`,
    requirePermission(PATIENT_PERMISSIONS.DELETE),
    handlers.archive,
  );
}

registerResource("insurances", insuranceHandlers);
registerResource("allergies", allergyHandlers);
registerResource("chronic-diseases", chronicDiseaseHandlers);
registerResource("medical-history", medicalHistoryHandlers);
registerResource("documents", documentHandlers);

patientClinicalRouter.get(
  "/:id/timeline",
  requirePermission(PATIENT_PERMISSIONS.VIEW),
  timelineController,
);
