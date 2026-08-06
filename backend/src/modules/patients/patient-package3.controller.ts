import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./patient-package3.schema";
import * as service from "./patient-package3.service";

export async function duplicateSearchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = schema.duplicateSearchSchema.parse(req.query);

    const result = await service.duplicateSearch(
      req.auth!.hospitalId,
      query.q,
      query.limit,
    );

    res.status(200).json(
      successResponse(
        result,
        "Potential duplicates retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function advancedSearchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = schema.advancedSearchSchema.parse(req.query);

    const result = await service.advancedSearch(
      req.auth!.hospitalId,
      query.q,
      query.page,
      query.pageSize,
    );

    res.status(200).json(
      successResponse(
        result,
        "Advanced patient search completed successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listFamilyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);

    const result = await service.listFamily(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        result,
        "Family relationships retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createFamilyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);
    const input =
      schema.createFamilyRelationshipSchema.parse(req.body);

    const createInput = {
      relatedPatientId: input.relatedPatientId,
      relationshipType: input.relationshipType,
      isEmergencyContact: input.isEmergencyContact,
      isPrimaryContact: input.isPrimaryContact,
      ...(input.notes !== undefined
        ? { notes: input.notes }
        : {}),
    };

    const result = await service.createFamily(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      createInput,
    );

    res.status(201).json(
      successResponse(
        result,
        "Family relationship created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateFamilyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    const input =
      schema.updateFamilyRelationshipSchema.parse(req.body);

    const result = await service.updateFamily(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
      input,
    );

    res.status(200).json(
      successResponse(
        result,
        "Family relationship updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function archiveFamilyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    await service.archiveFamily(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
    );

    res.status(200).json(
      successResponse(
        null,
        "Family relationship archived successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listAlertsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);

    const result = await service.listAlerts(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient alerts retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createAlertController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);
    const input = schema.createPatientAlertSchema.parse(req.body);

    const createInput = {
      alertType: input.alertType,
      title: input.title,
      severity: input.severity,
      active: input.active,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.startsAt !== undefined
        ? { startsAt: input.startsAt }
        : {}),
      ...(input.expiresAt !== undefined
        ? { expiresAt: input.expiresAt }
        : {}),
      ...(input.notes !== undefined
        ? { notes: input.notes }
        : {}),
    };

    const result = await service.createAlert(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      createInput,
    );

    res.status(201).json(
      successResponse(
        result,
        "Patient alert created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateAlertController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    const input = schema.updatePatientAlertSchema.parse(req.body);

    const result = await service.updateAlert(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
      input,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient alert updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeAlertController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    const result = await service.acknowledgeAlert(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient alert acknowledged successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function archiveAlertController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    await service.archiveAlert(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
    );

    res.status(200).json(
      successResponse(
        null,
        "Patient alert archived successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listMergeRequestsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.listMergeRequests(
      req.auth!.hospitalId,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient merge requests retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createMergeRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = schema.createMergeRequestSchema.parse(req.body);

    const result = await service.createMergeRequest(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        result,
        "Patient merge request created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function reviewMergeRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { requestId } =
      schema.mergeRequestParamsSchema.parse(req.params);

    const input = schema.reviewMergeRequestSchema.parse(req.body);

    const result = await service.reviewMergeRequest(
      req.auth!.hospitalId,
      requestId,
      req.auth!.userId,
      input.decision,
      input.reviewNotes,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient merge request reviewed successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listIdentifiersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);

    const result = await service.listIdentifiers(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient identifiers retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createIdentifierController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.patientIdParamsSchema.parse(req.params);
    const input = schema.createIdentifierSchema.parse(req.body);

    const createInput = {
      identifierType: input.identifierType,
      identifierValue: input.identifierValue,
      ...(input.displayValue !== undefined
        ? { displayValue: input.displayValue }
        : {}),
      ...(input.issuedAt !== undefined
        ? { issuedAt: input.issuedAt }
        : {}),
      ...(input.expiresAt !== undefined
        ? { expiresAt: input.expiresAt }
        : {}),
    };

    const result = await service.createIdentifier(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      createInput,
    );

    res.status(201).json(
      successResponse(
        result,
        "Patient identifier created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function deactivateIdentifierController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, resourceId } =
      schema.patientResourceParamsSchema.parse(req.params);

    await service.deactivateIdentifier(
      req.auth!.hospitalId,
      id,
      resourceId,
      req.auth!.userId,
    );

    res.status(200).json(
      successResponse(
        null,
        "Patient identifier deactivated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
