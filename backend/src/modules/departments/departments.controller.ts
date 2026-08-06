import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  createDepartmentSchema,
  departmentIdParamSchema,
  departmentListQuerySchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
} from "./departments.schema";
import * as service from "./departments.service";

export async function listDepartmentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = departmentListQuerySchema.parse(req.query);
    const result = await service.listDepartments(req.auth!.hospitalId, query);

    res.status(200).json(
      successResponse(
        result,
        "Departments retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = departmentIdParamSchema.parse(req.params);
    const department = await service.getDepartment(req.auth!.hospitalId, id);

    res.status(200).json(
      successResponse(
        department,
        "Department retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createDepartmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createDepartmentSchema.parse(req.body);
    const department = await service.createDepartment(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        department,
        "Department created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = departmentIdParamSchema.parse(req.params);
    const input = updateDepartmentSchema.parse(req.body);
    const department = await service.updateDepartment(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        department,
        "Department updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = departmentIdParamSchema.parse(req.params);
    const input = updateDepartmentStatusSchema.parse(req.body);
    const department = await service.updateDepartmentStatus(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        department,
        "Department status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
