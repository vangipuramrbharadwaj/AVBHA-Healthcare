import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createQueueController,
  createQueueEntryController,
  getQueueController,
  listQueueEntriesController,
  listQueuesController,
} from "./appointment-queue.controller";
import { APPOINTMENT_PERMISSIONS } from "./appointments.permissions";

export const appointmentQueueRouter = Router();
appointmentQueueRouter.use(authenticate, enforceTenant);

appointmentQueueRouter.get("/queues", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), listQueuesController);
appointmentQueueRouter.post("/queues", requirePermission(APPOINTMENT_PERMISSIONS.UPDATE), createQueueController);
appointmentQueueRouter.get("/queues/:id", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), getQueueController);
appointmentQueueRouter.get("/queue-entries", requirePermission(APPOINTMENT_PERMISSIONS.VIEW), listQueueEntriesController);
appointmentQueueRouter.post("/queue-entries", requirePermission(APPOINTMENT_PERMISSIONS.CREATE), createQueueEntryController);
