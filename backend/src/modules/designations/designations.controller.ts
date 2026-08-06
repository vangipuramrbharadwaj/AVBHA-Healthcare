import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  createDesignationSchema,
  designationIdParamSchema,
  designationListQuerySchema,
  updateDesignationSchema,
  updateDesignationStatusSchema,
} from "./designations.schema";
import * as service from "./designations.service";

export async function listDesignationsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = designationListQuerySchema.parse(req.query);
    const result = await service.listDesignations(
      req.auth!.hospitalId,
      query,
    );

    res.status(200).json(
      successResponse(
        result,
        "Designations retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getDesignationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = designationIdParamSchema.parse(req.params);
    const designation = await service.getDesignation(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        designation,
        "Designation retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createDesignationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createDesignationSchema.parse(req.body);
    const designation = await service.createDesignation(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        designation,
        "Designation created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateDesignationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = designationIdParamSchema.parse(req.params);
    const input = updateDesignationSchema.parse(req.body);
    const designation = await service.updateDesignation(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        designation,
        "Designation updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateDesignationStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = designationIdParamSchema.parse(req.params);
    const input = updateDesignationStatusSchema.parse(req.body);
    const designation = await service.updateDesignationStatus(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        designation,
        "Designation status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
