import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createDoctorController,
  getDoctorController,
  listDoctorsController,
  updateDoctorController,
} from "./doctors.controller";
import { DOCTOR_PERMISSIONS } from "./doctors.permissions";

export const doctorsRouter = Router();

doctorsRouter.use(authenticate, enforceTenant);

doctorsRouter.get(
  "/",
  requirePermission(DOCTOR_PERMISSIONS.VIEW),
  listDoctorsController,
);

doctorsRouter.post(
  "/",
  requirePermission(DOCTOR_PERMISSIONS.CREATE),
  createDoctorController,
);

doctorsRouter.get(
  "/:id",
  requirePermission(DOCTOR_PERMISSIONS.VIEW),
  getDoctorController,
);

doctorsRouter.patch(
  "/:id",
  requirePermission(DOCTOR_PERMISSIONS.UPDATE),
  updateDoctorController,
);
