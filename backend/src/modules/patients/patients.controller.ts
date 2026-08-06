import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  createPatientSchema,
  patientIdParamSchema,
  patientListQuerySchema,
  updatePatientSchema,
} from "./patients.schema";
import * as service from "./patients.service";

export async function listPatientsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = patientListQuerySchema.parse(req.query);
    const result = await service.listPatients(
      req.auth!.hospitalId,
      query,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patients retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getPatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = patientIdParamSchema.parse(req.params);
    const patient = await service.getPatient(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        patient,
        "Patient retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createPatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createPatientSchema.parse(req.body);
    const patient = await service.createPatient(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        patient,
        "Patient registered successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updatePatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = patientIdParamSchema.parse(req.params);
    const input = updatePatientSchema.parse(req.body);
    const patient = await service.updatePatient(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        patient,
        "Patient updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function deletePatientController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = patientIdParamSchema.parse(req.params);
    await service.deletePatient(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
    );

    res.status(200).json(
      successResponse(
        null,
        "Patient archived successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
