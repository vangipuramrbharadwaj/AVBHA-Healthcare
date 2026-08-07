import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import * as controller from "./communications.controller";
import { COMMUNICATION_PERMISSIONS } from "./communications.permissions";

export const communicationsRouter = Router();

communicationsRouter.use(authenticate, enforceTenant);

communicationsRouter.get("/notifications", controller.notificationsController);
communicationsRouter.patch("/notifications/read-all", controller.readAllController);
communicationsRouter.patch("/notifications/:id/read", controller.readController);

communicationsRouter.get("/preferences", controller.preferencesController);
communicationsRouter.put("/preferences", controller.savePreferenceController);

communicationsRouter.get(
  "/templates",
  requirePermission(COMMUNICATION_PERMISSIONS.VIEW),
  controller.templatesController,
);
communicationsRouter.post(
  "/templates",
  requirePermission(COMMUNICATION_PERMISSIONS.MANAGE_TEMPLATES),
  controller.createTemplateController,
);
communicationsRouter.patch(
  "/templates/:id",
  requirePermission(COMMUNICATION_PERMISSIONS.MANAGE_TEMPLATES),
  controller.updateTemplateController,
);

communicationsRouter.get(
  "/",
  requirePermission(COMMUNICATION_PERMISSIONS.VIEW),
  controller.listController,
);
communicationsRouter.post(
  "/",
  requirePermission(COMMUNICATION_PERMISSIONS.SEND),
  controller.sendController,
);
communicationsRouter.get(
  "/:id",
  requirePermission(COMMUNICATION_PERMISSIONS.VIEW),
  controller.getController,
);
