import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./opd.schema";
import * as service from "./opd.service";

export async function createVisitController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createVisitSchema.parse(req.body);
    const result = await service.createVisit(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        departmentId: input.departmentId,
        doctorId: input.doctorId,
        patientId: input.patientId,
        visitDate: input.visitDate,
        visitType: input.visitType,
        ...(input.appointmentId !== undefined ? { appointmentId: input.appointmentId } : {}),
        ...(input.chiefComplaint !== undefined ? { chiefComplaint: input.chiefComplaint } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    );
    res.status(201).json(successResponse(result, "OPD visit created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listVisitsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listVisitsSchema.parse(req.query);
    const result = await service.listVisits(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined ? { patientId: query.patientId } : {}),
        ...(query.doctorId !== undefined ? { doctorId: query.doctorId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
    );
    res.json(successResponse(result, "OPD visits retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function getVisitController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getVisit(req.auth!.hospitalId, id);
    res.json(successResponse(result, "OPD visit retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addVitalsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.vitalsSchema.parse(req.body);
    const result = await service.addVitals(req.auth!.hospitalId, id, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Vitals recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function saveConsultationController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.consultationSchema.parse(req.body);
    const result = await service.saveConsultation(req.auth!.hospitalId, id, req.auth!.userId, input);
    res.json(successResponse(result, "Consultation saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addDiagnosisController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.diagnosisSchema.parse(req.body);
    const result = await service.addDiagnosis(req.auth!.hospitalId, id, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Diagnosis added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function searchPrescriptionMedicinesController(req: Request,res: Response,next: NextFunction) {
  try {
    const query = schema.medicineSearchSchema.parse(req.query);
    const result = await service.searchPrescriptionMedicines(req.auth!.hospitalId,{
      q: query.q, ...(query.branchId!==undefined?{branchId:query.branchId}:{}),
    });
    res.json(successResponse(result,"Prescription medicines retrieved successfully",req.requestId));
  } catch (error) { next(error); }
}

export async function createPrescriptionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.prescriptionSchema.parse(req.body);

    const items = input.items.map((item) => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,

      ...(item.dosage !== undefined
        ? { dosage: item.dosage }
        : {}),

      ...(item.frequency !== undefined
        ? { frequency: item.frequency }
        : {}),

      ...(item.durationDays !== undefined
        ? { durationDays: item.durationDays }
        : {}),

      ...(item.prescribedQuantity !== undefined
        ? { prescribedQuantity: item.prescribedQuantity }
        : {}),

      ...(item.instructions !== undefined
        ? { instructions: item.instructions }
        : {}),
    }));

    const result = await service.createPrescription(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        items,

        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Prescription created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function addOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.clinicalOrderSchema.parse(req.body);
    const result = await service.addOrder(req.auth!.hospitalId, id, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Clinical order created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addFollowUpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.followUpSchema.parse(req.body);
    const result = await service.addFollowUp(req.auth!.hospitalId, id, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Follow-up added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function completeVisitController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.completeVisit(req.auth!.hospitalId, id, req.auth!.userId);
    res.json(successResponse(result, "OPD visit completed successfully", req.requestId));
  } catch (error) { next(error); }
}
