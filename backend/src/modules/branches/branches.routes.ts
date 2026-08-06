import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  createBranchController,
  getBranchController,
  listBranchesController,
  updateBranchController,
  updateBranchStatusController,
} from "./branches.controller";
import { BRANCH_PERMISSIONS } from "./branches.permissions";

export const branchesRouter = Router();

branchesRouter.use(authenticate, enforceTenant);

branchesRouter.get(
  "/",
  requirePermission(BRANCH_PERMISSIONS.VIEW),
  listBranchesController,
);

branchesRouter.post(
  "/",
  requirePermission(BRANCH_PERMISSIONS.CREATE),
  createBranchController,
);

branchesRouter.get(
  "/:id",
  requirePermission(BRANCH_PERMISSIONS.VIEW),
  getBranchController,
);

branchesRouter.patch(
  "/:id",
  requirePermission(BRANCH_PERMISSIONS.UPDATE),
  updateBranchController,
);

branchesRouter.patch(
  "/:id/status",
  requirePermission(BRANCH_PERMISSIONS.UPDATE),
  updateBranchStatusController,
);
