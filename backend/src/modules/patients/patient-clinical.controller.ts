import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  createAllergySchema,
  createChronicDiseaseSchema,
  createInsuranceSchema,
  createMedicalHistorySchema,
  createPatientDocumentSchema,
  patientResourceParamsSchema,
  timelineQuerySchema,
  updateAllergySchema,
  updateChronicDiseaseSchema,
  updateInsuranceSchema,
  updateMedicalHistorySchema,
  updatePatientDocumentSchema,
} from "./patient-clinical.schema";
import * as service from "./patient-clinical.service";

function makeHandlers(
  listFn: any,
  createFn: any,
  updateFn: any,
  archiveFn: any,
  createSchema: any,
  updateSchema: any,
  label: string,
) {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = patientResourceParamsSchema.parse(req.params);
        const result = await listFn(req.auth!.hospitalId, id);
        res.status(200).json(
          successResponse(
            result,
            `${label} records retrieved successfully`,
            req.requestId,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = patientResourceParamsSchema.parse(req.params);
        const input = createSchema.parse(req.body);
        const result = await createFn(
          req.auth!.hospitalId,
          id,
          req.auth!.userId,
          input,
        );
        res.status(201).json(
          successResponse(
            result,
            `${label} record created successfully`,
            req.requestId,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, resourceId } =
          patientResourceParamsSchema.parse(req.params);
        const input = updateSchema.parse(req.body);
        const result = await updateFn(
          req.auth!.hospitalId,
          id,
          resourceId,
          req.auth!.userId,
          input,
        );
        res.status(200).json(
          successResponse(
            result,
            `${label} record updated successfully`,
            req.requestId,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
    archive: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, resourceId } =
          patientResourceParamsSchema.parse(req.params);
        await archiveFn(
          req.auth!.hospitalId,
          id,
          resourceId,
          req.auth!.userId,
        );
        res.status(200).json(
          successResponse(
            null,
            `${label} record archived successfully`,
            req.requestId,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  };
}

export const insuranceHandlers = makeHandlers(
  service.listInsurances,
  service.createInsurance,
  service.updateInsurance,
  service.archiveInsurance,
  createInsuranceSchema,
  updateInsuranceSchema,
  "Insurance",
);
export const allergyHandlers = makeHandlers(
  service.listAllergies,
  service.createAllergy,
  service.updateAllergy,
  service.archiveAllergy,
  createAllergySchema,
  updateAllergySchema,
  "Allergy",
);
export const chronicDiseaseHandlers = makeHandlers(
  service.listChronicDiseases,
  service.createChronicDisease,
  service.updateChronicDisease,
  service.archiveChronicDisease,
  createChronicDiseaseSchema,
  updateChronicDiseaseSchema,
  "Chronic disease",
);
export const medicalHistoryHandlers = makeHandlers(
  service.listMedicalHistory,
  service.createMedicalHistory,
  service.updateMedicalHistory,
  service.archiveMedicalHistory,
  createMedicalHistorySchema,
  updateMedicalHistorySchema,
  "Medical history",
);
export const documentHandlers = makeHandlers(
  service.listDocuments,
  service.createDocument,
  service.updateDocument,
  service.archiveDocument,
  createPatientDocumentSchema,
  updatePatientDocumentSchema,
  "Document",
);

export async function timelineController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = patientResourceParamsSchema.parse(req.params);
    const query = timelineQuerySchema.parse(req.query);
    const result = await service.listTimeline(
      req.auth!.hospitalId,
      id,
      query.page,
      query.pageSize,
      query.eventType,
    );

    res.status(200).json(
      successResponse(
        result,
        "Patient timeline retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
