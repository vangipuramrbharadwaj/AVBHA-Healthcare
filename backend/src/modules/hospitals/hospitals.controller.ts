import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import { updateHospitalSchema } from "./hospitals.schema";
import * as service from "./hospitals.service";

export async function getHospitalProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const hospital = await service.getHospitalProfile(req.auth!.hospitalId);

    res.status(200).json(
      successResponse(
        hospital,
        "Hospital profile retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateHospitalProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = updateHospitalSchema.parse(req.body);
    const hospital = await service.updateHospitalProfile(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(200).json(
      successResponse(
        hospital,
        "Hospital profile updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
