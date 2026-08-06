import {
  ContrastRoute,
  RadiologyModality,
  RadiologyOrderPriority,
  RadiologyOrderStatus,
  RadiologyReportStatus,
  RadiologyStudyStatus,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createProcedureSchema = z.object({
  procedureCode: z.string().trim().min(2).max(40),
  procedureName: z.string().trim().min(2).max(200),
  modality: z.nativeEnum(RadiologyModality),
  bodyPart: z.string().trim().max(100).optional().nullable(),
  laterality: z.string().trim().max(30).optional().nullable(),
  requiresContrast: z.boolean().default(false),
  requiresPreparation: z.boolean().default(false),
  preparationInstructions: z.string().trim().max(5000).optional().nullable(),
  estimatedMinutes: z.coerce.number().int().min(1).optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  reportTemplate: z.string().trim().max(10000).optional().nullable(),
});

export const createOrderSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid(),
  opdVisitId: z.string().uuid().optional().nullable(),
  ipdAdmissionId: z.string().uuid().optional().nullable(),
  priority: z
    .nativeEnum(RadiologyOrderPriority)
    .default(RadiologyOrderPriority.ROUTINE),
  clinicalNotes: z.string().trim().max(5000).optional().nullable(),
  provisionalDiagnosis: z.string().trim().max(5000).optional().nullable(),
  requestedProcedureIds: z.array(z.string().uuid()).min(1),
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: z.nativeEnum(RadiologyOrderStatus).optional(),
  priority: z.nativeEnum(RadiologyOrderPriority).optional(),
});

export const scheduleStudySchema = z.object({
  scheduledAt: z.coerce.date(),
  technicianId: z.string().uuid().optional().nullable(),
  radiologistId: z.string().uuid().optional().nullable(),
  patientPreparation: z.string().trim().max(5000).optional().nullable(),
  pregnancyStatus: z.string().trim().max(30).optional().nullable(),
  creatinineValue: z.coerce.number().min(0).optional().nullable(),
  workstationName: z.string().trim().max(120).optional().nullable(),
});

export const studyStatusSchema = z.object({
  status: z.nativeEnum(RadiologyStudyStatus),
  notes: z.string().trim().max(5000).optional().nullable(),
  pacsStudyUid: z.string().trim().max(200).optional().nullable(),
  dicomStudyUid: z.string().trim().max(200).optional().nullable(),
});

export const contrastSchema = z.object({
  contrastName: z.string().trim().min(2).max(150),
  route: z.nativeEnum(ContrastRoute),
  dose: z.coerce.number().min(0).optional().nullable(),
  doseUnit: z.string().trim().max(30).optional().nullable(),
  lotNumber: z.string().trim().max(80).optional().nullable(),
  reactionObserved: z.boolean().default(false),
  reactionDetails: z.string().trim().max(5000).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const reportSchema = z.object({
  status: z
    .nativeEnum(RadiologyReportStatus)
    .default(RadiologyReportStatus.DRAFT),
  clinicalHistory: z.string().trim().max(10000).optional().nullable(),
  technique: z.string().trim().max(10000).optional().nullable(),
  findings: z.string().trim().max(20000).optional().nullable(),
  impression: z.string().trim().max(10000).optional().nullable(),
  recommendations: z.string().trim().max(10000).optional().nullable(),
  comparisonStudy: z.string().trim().max(5000).optional().nullable(),
  amendmentReason: z.string().trim().max(5000).optional().nullable(),
});

export const reportStatusSchema = z.object({
  status: z.nativeEnum(RadiologyReportStatus),
  amendmentReason: z.string().trim().max(5000).optional().nullable(),
});

export const dashboardQuerySchema = z.object({
  date: z.coerce.date().optional(),
});
