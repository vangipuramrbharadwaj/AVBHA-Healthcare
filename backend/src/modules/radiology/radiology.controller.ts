import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./radiology.schema";
import * as service from "./radiology.service";

export async function createProcedureController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.createProcedureSchema.parse(req.body);

    const result = await service.createProcedure(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        procedureCode: input.procedureCode,
        procedureName: input.procedureName,
        modality: input.modality,
        requiresContrast: input.requiresContrast,
        requiresPreparation: input.requiresPreparation,
        ...(input.bodyPart !== undefined
          ? { bodyPart: input.bodyPart }
          : {}),
        ...(input.laterality !== undefined
          ? { laterality: input.laterality }
          : {}),
        ...(input.preparationInstructions !== undefined
          ? {
              preparationInstructions:
                input.preparationInstructions,
            }
          : {}),
        ...(input.estimatedMinutes !== undefined
          ? { estimatedMinutes: input.estimatedMinutes }
          : {}),
        ...(input.price !== undefined
          ? { price: input.price }
          : {}),
        ...(input.reportTemplate !== undefined
          ? { reportTemplate: input.reportTemplate }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Radiology procedure created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listProceduresController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.listProcedures(
      req.auth!.hospitalId,
    );

    res.json(
      successResponse(
        result,
        "Radiology procedures retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createOrderController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.createOrderSchema.parse(req.body);

    const result = await service.createOrder(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        priority: input.priority,
        requestedProcedureIds:
          input.requestedProcedureIds,
        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),
        ...(input.doctorId !== undefined
          ? { doctorId: input.doctorId }
          : {}),
        ...(input.opdVisitId !== undefined
          ? { opdVisitId: input.opdVisitId }
          : {}),
        ...(input.ipdAdmissionId !== undefined
          ? { ipdAdmissionId: input.ipdAdmissionId }
          : {}),
        ...(input.clinicalNotes !== undefined
          ? { clinicalNotes: input.clinicalNotes }
          : {}),
        ...(input.provisionalDiagnosis !== undefined
          ? {
              provisionalDiagnosis:
                input.provisionalDiagnosis,
            }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Radiology order created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.listOrdersSchema.parse(req.query);

    const result = await service.listOrders(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined
          ? { patientId: query.patientId }
          : {}),
        ...(query.doctorId !== undefined
          ? { doctorId: query.doctorId }
          : {}),
        ...(query.status !== undefined
          ? { status: query.status }
          : {}),
        ...(query.priority !== undefined
          ? { priority: query.priority }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Radiology orders retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getOrderController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getOrder(
      req.auth!.hospitalId,
      id,
    );

    res.json(
      successResponse(
        result,
        "Radiology order retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function scheduleStudyController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.scheduleStudySchema.parse(req.body);

    const result = await service.scheduleStudy(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        scheduledAt: input.scheduledAt,
        ...(input.technicianId !== undefined
          ? { technicianId: input.technicianId }
          : {}),
        ...(input.radiologistId !== undefined
          ? { radiologistId: input.radiologistId }
          : {}),
        ...(input.patientPreparation !== undefined
          ? {
              patientPreparation:
                input.patientPreparation,
            }
          : {}),
        ...(input.pregnancyStatus !== undefined
          ? { pregnancyStatus: input.pregnancyStatus }
          : {}),
        ...(input.creatinineValue !== undefined
          ? { creatinineValue: input.creatinineValue }
          : {}),
        ...(input.workstationName !== undefined
          ? { workstationName: input.workstationName }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Radiology study scheduled successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateStudyStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.studyStatusSchema.parse(req.body);

    const result = await service.updateStudyStatus(
      req.auth!.hospitalId,
      id,
      input.status,
      {
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
        ...(input.pacsStudyUid !== undefined
          ? { pacsStudyUid: input.pacsStudyUid }
          : {}),
        ...(input.dicomStudyUid !== undefined
          ? { dicomStudyUid: input.dicomStudyUid }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Radiology study status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function addContrastController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.contrastSchema.parse(req.body);

    const result = await service.addContrast(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        result,
        "Contrast administration recorded successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function saveReportController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.reportSchema.parse(req.body);

    const result = await service.saveReport(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        status: input.status,
        ...(input.clinicalHistory !== undefined
          ? { clinicalHistory: input.clinicalHistory }
          : {}),
        ...(input.technique !== undefined
          ? { technique: input.technique }
          : {}),
        ...(input.findings !== undefined
          ? { findings: input.findings }
          : {}),
        ...(input.impression !== undefined
          ? { impression: input.impression }
          : {}),
        ...(input.recommendations !== undefined
          ? { recommendations: input.recommendations }
          : {}),
        ...(input.comparisonStudy !== undefined
          ? { comparisonStudy: input.comparisonStudy }
          : {}),
        ...(input.amendmentReason !== undefined
          ? { amendmentReason: input.amendmentReason }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Radiology report saved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateReportStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.reportStatusSchema.parse(req.body);

    const result =
      input.amendmentReason === undefined
        ? await service.updateReportStatus(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.status,
          )
        : await service.updateReportStatus(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.status,
            input.amendmentReason,
          );

    res.json(
      successResponse(
        result,
        "Radiology report status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function dashboardController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.dashboardQuerySchema.parse(req.query);

    const result = await service.dashboard(
      req.auth!.hospitalId,
      query.date ?? new Date(),
    );

    res.json(
      successResponse(
        result,
        "Radiology dashboard retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
