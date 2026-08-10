import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { listPermissionsController } from "./permissions.controller";
import { PERMISSION_PERMISSIONS } from "./permissions.permissions";

export const permissionsRouter = Router();
permissionsRouter.use(authenticate, enforceTenant);
permissionsRouter.get("/", requirePermission(PERMISSION_PERMISSIONS.VIEW), listPermissionsController);
