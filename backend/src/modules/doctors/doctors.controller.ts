import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./doctors.schema";
import * as service from "./doctors.service";

export async function listDoctorsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = schema.doctorListQuerySchema.parse(req.query);
    const result = await service.listDoctors(req.auth!.hospitalId, query);
    res
      .status(200)
      .json(
        successResponse(
          result,
          "Doctors retrieved successfully",
          req.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function getDoctorController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.doctorIdParamSchema.parse(req.params);
    const result = await service.getDoctor(req.auth!.hospitalId, id);
    res
      .status(200)
      .json(
        successResponse(
          result,
          "Doctor retrieved successfully",
          req.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function createDoctorController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = schema.createDoctorSchema.parse(req.body);
    const result = await service.createDoctor(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );
    res
      .status(201)
      .json(
        successResponse(
          result,
          "Doctor created successfully",
          req.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function updateDoctorController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.doctorIdParamSchema.parse(req.params);
    const input = schema.updateDoctorSchema.parse(req.body);
    const result = await service.updateDoctor(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );
    res
      .status(200)
      .json(
        successResponse(
          result,
          "Doctor updated successfully",
          req.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}
