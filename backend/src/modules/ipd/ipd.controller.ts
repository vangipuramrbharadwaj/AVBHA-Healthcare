import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./ipd.schema";
import * as service from "./ipd.service";

export async function listWardsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const branchId =
      typeof req.query.branchId === "string" && req.query.branchId
        ? req.query.branchId
        : undefined;

    const result = await service.listWards(
      req.auth!.hospitalId,
      branchId,
    );

    res.json(
      successResponse(
        result,
        "Wards retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listRoomsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const branchId =
      typeof req.query.branchId === "string" && req.query.branchId
        ? req.query.branchId
        : undefined;
    const wardId =
      typeof req.query.wardId === "string" && req.query.wardId
        ? req.query.wardId
        : undefined;

    const result = await service.listRooms(
      req.auth!.hospitalId,
      branchId,
      wardId,
    );

    res.json(
      successResponse(
        result,
        "Rooms retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createWardController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createWard(
      req.auth!.hospitalId,
      schema.wardSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Ward created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createRoomController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createRoom(
      req.auth!.hospitalId,
      schema.roomSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Room created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createBedController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createBed(
      req.auth!.hospitalId,
      schema.bedSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Bed created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listBedsController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listBeds(req.auth!.hospitalId);
    res.json(successResponse(result, "Beds retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createAdmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.admissionSchema.parse(req.body);

    const payload = {
      branchId: input.branchId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      patientId: input.patientId,
      admissionDate: input.admissionDate,
      admissionType: input.admissionType,
      ...(input.bedId !== undefined ? { bedId: input.bedId } : {}),
      ...(input.admissionReason !== undefined ? { admissionReason: input.admissionReason } : {}),
      ...(input.provisionalDiagnosis !== undefined ? { provisionalDiagnosis: input.provisionalDiagnosis } : {}),
      ...(input.expectedDischargeDate !== undefined ? { expectedDischargeDate: input.expectedDischargeDate } : {}),
      ...(input.attendantName !== undefined ? { attendantName: input.attendantName } : {}),
      ...(input.attendantPhone !== undefined ? { attendantPhone: input.attendantPhone } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };

    const result = await service.createAdmission(
      req.auth!.hospitalId,
      req.auth!.userId,
      payload,
    );

    res.status(201).json(successResponse(result, "Patient admitted successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listAdmissionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listSchema.parse(req.query);

    const result = await service.listAdmissions(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined ? { patientId: query.patientId } : {}),
        ...(query.doctorId !== undefined ? { doctorId: query.doctorId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
    );

    res.json(successResponse(result, "Admissions retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function getAdmissionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getAdmission(req.auth!.hospitalId, id);
    res.json(successResponse(result, "Admission retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function transferBedController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.transferSchema.parse(req.body);

    const result = await service.transferBed(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        bedId: input.bedId,
        ...(input.transferReason !== undefined ? { transferReason: input.transferReason } : {}),
      },
    );

    res.json(successResponse(result, "Bed transferred successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addNursingNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addNursingNote(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.nursingSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Nursing note added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addVitalsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addVitals(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.vitalsSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Vitals recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addDoctorRoundController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addDoctorRound(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.doctorRoundSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Doctor round added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addMedicationOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addMedicationOrder(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.medicationSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Medication order created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addMedicationAdministrationController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addMedicationAdministration(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.administrationSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Medication administration recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addIntakeOutputController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addIntakeOutput(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.intakeOutputSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Intake/output recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function dischargePatientController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.dischargePatient(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.dischargeSchema.parse(req.body),
    );
    res.json(successResponse(result, "Patient discharged successfully", req.requestId));
  } catch (error) { next(error); }
}


export async function getDischargeReadinessController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getDischargeReadiness(
      req.auth!.hospitalId,
      id,
    );
    res.json(
      successResponse(
        result,
        "Discharge readiness retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
