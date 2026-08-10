import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./roles.schema";
import * as service from "./roles.service";

export async function listRolesController(req: Request, res: Response, next: NextFunction) {
  try {
    const q = schema.roleListQuerySchema.parse(req.query);
    res.json(successResponse(
      await service.listRoles(req.auth!.hospitalId, q.search, q.status),
      "Roles retrieved successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function getRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.roleIdParamSchema.parse(req.params);
    res.json(successResponse(await service.getRole(req.auth!.hospitalId, id), "Role retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createRoleSchema.parse(req.body);
    res.status(201).json(successResponse(
      await service.createRole(req.auth!.hospitalId, req.auth!.userId, input),
      "Role created successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function updateRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.roleIdParamSchema.parse(req.params);
    const input = schema.updateRoleSchema.parse(req.body);
    res.json(successResponse(
      await service.updateRole(req.auth!.hospitalId, req.auth!.userId, id, input),
      "Role updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function setRolePermissionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.roleIdParamSchema.parse(req.params);
    const input = schema.setRolePermissionsSchema.parse(req.body);
    res.json(successResponse(
      await service.setRolePermissions(req.auth!.hospitalId, req.auth!.userId, id, input.permissionIds),
      "Role permissions updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}
