import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  addBreakController,
  archiveScheduleController,
  availableSlotsController,
  createHolidayController,
  createScheduleController,
  listSchedulesController,
  lockSlotController,
  releaseSlotController,
  updateScheduleController,
} from "./appointment-schedule.controller";
import { APPOINTMENT_PERMISSIONS } from "./appointments.permissions";

export const appointmentScheduleRouter = Router();
appointmentScheduleRouter.use(authenticate, enforceTenant);

appointmentScheduleRouter.get(
  "/schedules",
  requirePermission(APPOINTMENT_PERMISSIONS.VIEW),
  listSchedulesController,
);
appointmentScheduleRouter.post(
  "/schedules",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  createScheduleController,
);
appointmentScheduleRouter.patch(
  "/schedules/:id",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  updateScheduleController,
);
appointmentScheduleRouter.delete(
  "/schedules/:id",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  archiveScheduleController,
);
appointmentScheduleRouter.post(
  "/schedules/:id/breaks",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  addBreakController,
);
appointmentScheduleRouter.post(
  "/holidays",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  createHolidayController,
);
appointmentScheduleRouter.get(
  "/available-slots",
  requirePermission(APPOINTMENT_PERMISSIONS.VIEW),
  availableSlotsController,
);
appointmentScheduleRouter.post(
  "/slot-locks",
  requirePermission(APPOINTMENT_PERMISSIONS.CREATE),
  lockSlotController,
);
appointmentScheduleRouter.post(
  "/slot-locks/:lockToken/release",
  requirePermission(APPOINTMENT_PERMISSIONS.CREATE),
  releaseSlotController,
);
