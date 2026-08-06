import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  appointmentDashboardController,
  cancelAppointmentController,
  createAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  rescheduleAppointmentController,
  updateAppointmentController,
} from "./appointments.controller";
import { APPOINTMENT_PERMISSIONS } from "./appointments.permissions";

export const appointmentsRouter = Router();
appointmentsRouter.use(authenticate, enforceTenant);

appointmentsRouter.get("/dashboard", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), appointmentDashboardController);
appointmentsRouter.get("/", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), listAppointmentsController);
appointmentsRouter.post("/", requirePermission(APPOINTMENT_PERMISSIONS.CREATE), createAppointmentController);
appointmentsRouter.get("/:id", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), getAppointmentController);
appointmentsRouter.patch("/:id", requirePermission(APPOINTMENT_PERMISSIONS.UPDATE), updateAppointmentController);
appointmentsRouter.patch("/:id/cancel", requirePermission(APPOINTMENT_PERMISSIONS.CANCEL), cancelAppointmentController);
appointmentsRouter.post("/:id/reschedule", requirePermission(APPOINTMENT_PERMISSIONS.RESCHEDULE), rescheduleAppointmentController);
