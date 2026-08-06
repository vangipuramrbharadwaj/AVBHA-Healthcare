import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  branchIdParamSchema,
  branchListQuerySchema,
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema,
} from "./branches.schema";
import * as service from "./branches.service";

export async function listBranchesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = branchListQuerySchema.parse(req.query);
    const result = await service.listBranches(req.auth!.hospitalId, query);

    res.status(200).json(
      successResponse(result, "Branches retrieved successfully", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function getBranchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = branchIdParamSchema.parse(req.params);
    const branch = await service.getBranch(req.auth!.hospitalId, id);

    res.status(200).json(
      successResponse(branch, "Branch retrieved successfully", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function createBranchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createBranchSchema.parse(req.body);
    const branch = await service.createBranch(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(branch, "Branch created successfully", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateBranchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = branchIdParamSchema.parse(req.params);
    const input = updateBranchSchema.parse(req.body);
    const branch = await service.updateBranch(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(branch, "Branch updated successfully", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateBranchStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = branchIdParamSchema.parse(req.params);
    const input = updateBranchStatusSchema.parse(req.body);
    const branch = await service.updateBranchStatus(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        branch,
        "Branch status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
