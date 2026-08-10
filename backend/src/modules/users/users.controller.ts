import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./users.schema";
import * as service from "./users.service";

export async function listUsersController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.userListQuerySchema.parse(req.query);
    res.json(successResponse(
      await service.listUsers(req.auth!.hospitalId, query),
      "Users retrieved successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function getUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.userIdParamSchema.parse(req.params);
    res.json(successResponse(
      await service.getUser(req.auth!.hospitalId, id),
      "User retrieved successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function createUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createUserSchema.parse(req.body);
    res.status(201).json(successResponse(
      await service.createUser(req.auth!.hospitalId, req.auth!.userId, input),
      "User created successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.userIdParamSchema.parse(req.params);
    const input = schema.updateUserSchema.parse(req.body);
    res.json(successResponse(
      await service.updateUser(req.auth!.hospitalId, req.auth!.userId, id, input),
      "User updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function updateUserStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.userIdParamSchema.parse(req.params);
    const input = schema.updateUserStatusSchema.parse(req.body);
    res.json(successResponse(
      await service.updateUserStatus(req.auth!.hospitalId, req.auth!.userId, id, input.status),
      "User status updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function setUserRolesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.userIdParamSchema.parse(req.params);
    const input = schema.setUserRolesSchema.parse(req.body);
    res.json(successResponse(
      await service.setUserRoles(req.auth!.hospitalId, req.auth!.userId, id, input.roleIds),
      "User roles updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function resetUserPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.userIdParamSchema.parse(req.params);
    const input = schema.resetUserPasswordSchema.parse(req.body);
    res.json(successResponse(
      await service.resetPassword(
        req.auth!.hospitalId,
        req.auth!.userId,
        id,
        input.temporaryPassword,
        input.mustChangePassword,
      ),
      "Temporary password updated successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function listAssignableRolesController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(successResponse(
      await service.listAssignableRoles(req.auth!.hospitalId),
      "Assignable roles retrieved successfully",
      req.requestId,
    ));
  } catch (error) { next(error); }
}
