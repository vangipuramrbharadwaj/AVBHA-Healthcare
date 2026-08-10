import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import * as controller from "./users.controller";
import { USER_PERMISSIONS } from "./users.permissions";

export const usersRouter = Router();
usersRouter.use(authenticate, enforceTenant);

usersRouter.get("/", requirePermission(USER_PERMISSIONS.VIEW), controller.listUsersController);
usersRouter.get("/roles/options", requirePermission(USER_PERMISSIONS.VIEW), controller.listAssignableRolesController);
usersRouter.post("/", requirePermission(USER_PERMISSIONS.CREATE), controller.createUserController);
usersRouter.get("/:id", requirePermission(USER_PERMISSIONS.VIEW), controller.getUserController);
usersRouter.patch("/:id", requirePermission(USER_PERMISSIONS.UPDATE), controller.updateUserController);
usersRouter.patch("/:id/status", requirePermission(USER_PERMISSIONS.UPDATE), controller.updateUserStatusController);
usersRouter.put("/:id/roles", requirePermission(USER_PERMISSIONS.MANAGE_ROLES), controller.setUserRolesController);
usersRouter.post("/:id/reset-password", requirePermission(USER_PERMISSIONS.RESET_PASSWORD), controller.resetUserPasswordController);
