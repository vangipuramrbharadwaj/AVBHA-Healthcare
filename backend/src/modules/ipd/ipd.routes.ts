import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  addDoctorRoundController,
  addIntakeOutputController,
  addMedicationAdministrationController,
  addMedicationOrderController,
  addNursingNoteController,
  addVitalsController,
  createAdmissionController,
  createBedController,
  createRoomController,
  createWardController,
  dischargePatientController,
  getAdmissionController,
  getDischargeReadinessController,
  listAdmissionsController,
  listBedsController,
  listWardsController,
  listRoomsController,
  transferBedController,
} from "./ipd.controller";
import { IPD_PERMISSIONS } from "./ipd.permissions";

export const ipdRouter = Router();
ipdRouter.use(authenticate, enforceTenant);

ipdRouter.get("/wards", requirePermission(IPD_PERMISSIONS.VIEW), listWardsController);
ipdRouter.get("/rooms", requirePermission(IPD_PERMISSIONS.VIEW), listRoomsController);
ipdRouter.post("/wards", requirePermission(IPD_PERMISSIONS.UPDATE), createWardController);
ipdRouter.post("/rooms", requirePermission(IPD_PERMISSIONS.UPDATE), createRoomController);
ipdRouter.post("/beds", requirePermission(IPD_PERMISSIONS.UPDATE), createBedController);
ipdRouter.get("/beds", requirePermission(IPD_PERMISSIONS.VIEW), listBedsController);

ipdRouter.post("/admissions", requirePermission(IPD_PERMISSIONS.CREATE), createAdmissionController);
ipdRouter.get("/admissions", requirePermission(IPD_PERMISSIONS.VIEW), listAdmissionsController);
ipdRouter.get("/admissions/:id", requirePermission(IPD_PERMISSIONS.VIEW), getAdmissionController);
ipdRouter.get("/admissions/:id/discharge-readiness", requirePermission(IPD_PERMISSIONS.VIEW), getDischargeReadinessController);
ipdRouter.post("/admissions/:id/transfer-bed", requirePermission(IPD_PERMISSIONS.UPDATE), transferBedController);

ipdRouter.post("/admissions/:id/nursing-notes", requirePermission(IPD_PERMISSIONS.NURSING_CREATE), addNursingNoteController);
ipdRouter.post("/admissions/:id/vitals", requirePermission(IPD_PERMISSIONS.NURSING_CREATE), addVitalsController);
ipdRouter.post("/admissions/:id/doctor-rounds", requirePermission(IPD_PERMISSIONS.UPDATE), addDoctorRoundController);
ipdRouter.post("/admissions/:id/medication-orders", requirePermission(IPD_PERMISSIONS.UPDATE), addMedicationOrderController);
ipdRouter.post("/medication-orders/:id/administrations", requirePermission(IPD_PERMISSIONS.NURSING_CREATE), addMedicationAdministrationController);
ipdRouter.post("/admissions/:id/intake-output", requirePermission(IPD_PERMISSIONS.NURSING_CREATE), addIntakeOutputController);
ipdRouter.post("/admissions/:id/discharge", requirePermission(IPD_PERMISSIONS.DISCHARGE_CREATE), dischargePatientController);
