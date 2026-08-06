import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  addDiagnosisController,
  addFollowUpController,
  addOrderController,
  addVitalsController,
  completeVisitController,
  createPrescriptionController,
  createVisitController,
  getVisitController,
  listVisitsController,
  saveConsultationController,
} from "./opd.controller";
import { OPD_PERMISSIONS } from "./opd.permissions";

export const opdRouter = Router();
opdRouter.use(authenticate, enforceTenant);

opdRouter.get("/", requirePermission(OPD_PERMISSIONS.VIEW), listVisitsController);
opdRouter.post("/", requirePermission(OPD_PERMISSIONS.CREATE), createVisitController);
opdRouter.get("/:id", requirePermission(OPD_PERMISSIONS.VIEW), getVisitController);
opdRouter.post("/:id/vitals", requirePermission(OPD_PERMISSIONS.UPDATE), addVitalsController);
opdRouter.put("/:id/consultation", requirePermission(OPD_PERMISSIONS.CONSULTATION_UPDATE), saveConsultationController);
opdRouter.post("/:id/diagnoses", requirePermission(OPD_PERMISSIONS.CONSULTATION_UPDATE), addDiagnosisController);
opdRouter.post("/:id/prescription", requirePermission(OPD_PERMISSIONS.CONSULTATION_UPDATE), createPrescriptionController);
opdRouter.post("/:id/orders", requirePermission(OPD_PERMISSIONS.CONSULTATION_UPDATE), addOrderController);
opdRouter.post("/:id/follow-ups", requirePermission(OPD_PERMISSIONS.CONSULTATION_UPDATE), addFollowUpController);
opdRouter.post("/:id/complete", requirePermission(OPD_PERMISSIONS.UPDATE), completeVisitController);
