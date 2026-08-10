import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./laboratory.schema";
import * as service from "./laboratory.service";

export async function createTestController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createTestSchema.parse(req.body);
    const parameters = input.parameters.map((parameter) => ({
      parameterCode: parameter.parameterCode,
      parameterName: parameter.parameterName,
      valueType: parameter.valueType,
      sortOrder: parameter.sortOrder,
      required: parameter.required,
      ...(parameter.unit !== undefined ? { unit: parameter.unit } : {}),
      ...(parameter.referenceRange !== undefined ? { referenceRange: parameter.referenceRange } : {}),
    }));

    const result = await service.createTest(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        testCode: input.testCode,
        testName: input.testName,
        sampleType: input.sampleType,
        parameters,
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.containerType !== undefined ? { containerType: input.containerType } : {}),
        ...(input.turnaroundMinutes !== undefined ? { turnaroundMinutes: input.turnaroundMinutes } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Laboratory test created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listTestsController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listTests(req.auth!.hospitalId);
    res.json(successResponse(result, "Laboratory tests retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createOrderSchema.parse(req.body);
    const result = await service.createOrder(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        priority: input.priority,
        testIds: input.testIds,
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.doctorId !== undefined ? { doctorId: input.doctorId } : {}),
        ...(input.ipdAdmissionId !== undefined ? { ipdAdmissionId: input.ipdAdmissionId } : {}),
        ...(input.clinicalNotes !== undefined ? { clinicalNotes: input.clinicalNotes } : {}),
      },
    );

    res.status(201).json(successResponse(result, "Laboratory order created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listOrdersSchema.parse(req.query);
    const result = await service.listOrders(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined ? { patientId: query.patientId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
    );

    res.json(successResponse(result, "Laboratory orders retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function getOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getOrder(req.auth!.hospitalId, id);
    res.json(successResponse(result, "Laboratory order retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function collectSampleController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.collectSampleSchema.parse(req.body);

    const result =
      input.barcode === undefined
        ? await service.collectSample(req.auth!.hospitalId, id, req.auth!.userId)
        : await service.collectSample(req.auth!.hospitalId, id, req.auth!.userId, input.barcode);

    res.json(successResponse(result, "Sample collected successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function rejectSampleController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.rejectSampleSchema.parse(req.body);
    const result = await service.rejectSample(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.rejectionReason,
    );

    res.json(successResponse(result, "Sample rejected successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function enterResultController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.resultEntrySchema.parse(req.body);

    const values = input.values.map((value) => ({
      parameterId: value.parameterId,
      critical: value.critical,
      ...(value.numericValue !== undefined ? { numericValue: value.numericValue } : {}),
      ...(value.textValue !== undefined ? { textValue: value.textValue } : {}),
      ...(value.booleanValue !== undefined ? { booleanValue: value.booleanValue } : {}),
      ...(value.choiceValue !== undefined ? { choiceValue: value.choiceValue } : {}),
      ...(value.unit !== undefined ? { unit: value.unit } : {}),
      ...(value.referenceRange !== undefined ? { referenceRange: value.referenceRange } : {}),
      ...(value.abnormalFlag !== undefined ? { abnormalFlag: value.abnormalFlag } : {}),
      ...(value.comments !== undefined ? { comments: value.comments } : {}),
    }));

    const result = await service.enterResult(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        values,
        ...(input.interpretation !== undefined ? { interpretation: input.interpretation } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
    );

    res.json(successResponse(result, "Laboratory result saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function updateResultStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.resultStatusSchema.parse(req.body);

    const result =
      input.amendmentReason === undefined
        ? await service.updateResultStatus(req.auth!.hospitalId, id, req.auth!.userId, input.status)
        : await service.updateResultStatus(req.auth!.hospitalId, id, req.auth!.userId, input.status, input.amendmentReason);

    res.json(successResponse(result, "Laboratory result status updated successfully", req.requestId));
  } catch (error) { next(error); }
}
