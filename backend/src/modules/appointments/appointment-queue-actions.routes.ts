import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  callEntryController,
  cancelEntryController,
  completeEntryController,
  holdEntryController,
  nextEntryController,
  noShowEntryController,
  queueDashboardController,
  skipEntryController,
  startConsultationController,
} from "./appointment-queue-actions.controller";
import { APPOINTMENT_PERMISSIONS } from "./appointments.permissions";

export const appointmentQueueActionsRouter = Router();
appointmentQueueActionsRouter.use(authenticate, enforceTenant);

appointmentQueueActionsRouter.get(
  "/queue-dashboard",
  requirePermission(APPOINTMENT_PERMISSIONS.VIEW),
  queueDashboardController,
);

appointmentQueueActionsRouter.post(
  "/queues/:id/next",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  nextEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/call",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  callEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/start",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  startConsultationController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/hold",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  holdEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/skip",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  skipEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/complete",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  completeEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/cancel",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  cancelEntryController,
);

appointmentQueueActionsRouter.post(
  "/queue-entries/:id/no-show",
  requirePermission(APPOINTMENT_PERMISSIONS.UPDATE),
  noShowEntryController,
);
