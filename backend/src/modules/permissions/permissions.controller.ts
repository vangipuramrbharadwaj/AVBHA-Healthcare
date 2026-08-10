import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import { permissionListQuerySchema } from "./permissions.schema";
import { listPermissions } from "./permissions.service";

export async function listPermissionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = permissionListQuerySchema.parse(req.query);
    res.json(successResponse(
      await listPermissions(query.moduleCode, query.search),
      "Permissions retrieved successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}
