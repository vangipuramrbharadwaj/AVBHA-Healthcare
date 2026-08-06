import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  getHospitalProfileController,
  updateHospitalProfileController,
} from "./hospitals.controller";
import { HOSPITAL_PERMISSIONS } from "./hospitals.permissions";

export const hospitalsRouter = Router();

hospitalsRouter.use(authenticate, enforceTenant);

hospitalsRouter.get(
  "/me",
  requirePermission(HOSPITAL_PERMISSIONS.VIEW),
  getHospitalProfileController,
);

hospitalsRouter.patch(
  "/me",
  requirePermission(HOSPITAL_PERMISSIONS.UPDATE),
  updateHospitalProfileController,
);
