import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import * as controller from "./roles.controller";
import { ROLE_PERMISSIONS } from "./roles.permissions";

export const rolesRouter = Router();
rolesRouter.use(authenticate, enforceTenant);
rolesRouter.get("/", requirePermission(ROLE_PERMISSIONS.VIEW), controller.listRolesController);
rolesRouter.post("/", requirePermission(ROLE_PERMISSIONS.CREATE), controller.createRoleController);
rolesRouter.get("/:id", requirePermission(ROLE_PERMISSIONS.VIEW), controller.getRoleController);
rolesRouter.patch("/:id", requirePermission(ROLE_PERMISSIONS.UPDATE), controller.updateRoleController);
rolesRouter.put("/:id/permissions", requirePermission(ROLE_PERMISSIONS.MANAGE_PERMISSIONS), controller.setRolePermissionsController);
