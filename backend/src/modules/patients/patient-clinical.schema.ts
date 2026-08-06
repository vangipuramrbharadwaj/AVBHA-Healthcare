import { RecordStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();
const optionalDate = z.coerce.date().optional().nullable();

export const patientResourceParamsSchema = z.object({
  id: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
});

export const createInsuranceSchema = z.object({
  providerName: z.string().trim().min(2).max(150),
  policyNumber: z.string().trim().min(2).max(100),
  memberId: optionalText(100),
  planName: optionalText(150),
  coverageType: optionalText(60),
  validFrom: optionalDate,
  validTo: optionalDate,
  sumInsured: z.coerce.number().nonnegative().optional().nullable(),
  tpaName: optionalText(150),
  tpaContact: optionalText(50),
  preAuthRequired: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  notes: optionalText(3000),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});
export const updateInsuranceSchema = createInsuranceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);

export const createAllergySchema = z.object({
  allergen: z.string().trim().min(1).max(150),
  allergyType: optionalText(60),
  reaction: optionalText(2000),
  severity: optionalText(30),
  onsetDate: optionalDate,
  source: optionalText(80),
  verified: z.boolean().default(false),
  verifiedBy: z.string().uuid().optional().nullable(),
  verifiedAt: optionalDate,
  notes: optionalText(3000),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});
export const updateAllergySchema = createAllergySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);

export const createChronicDiseaseSchema = z.object({
  diseaseName: z.string().trim().min(1).max(150),
  diagnosisDate: optionalDate,
  diagnosingDoctor: optionalText(150),
  currentTreatment: optionalText(3000),
  controlStatus: optionalText(50),
  notes: optionalText(3000),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});
export const updateChronicDiseaseSchema =
  createChronicDiseaseSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: "At least one field is required" },
  );

export const createMedicalHistorySchema = z.object({
  historyType: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(200),
  description: optionalText(5000),
  eventDate: optionalDate,
  provider: optionalText(150),
  location: optionalText(150),
  outcome: optionalText(3000),
  notes: optionalText(3000),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});
export const updateMedicalHistorySchema =
  createMedicalHistorySchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: "At least one field is required" },
  );

export const createPatientDocumentSchema = z.object({
  documentType: z.string().trim().min(2).max(60),
  documentName: z.string().trim().min(2).max(200),
  filePath: z.string().trim().min(1).max(500),
  mimeType: optionalText(100),
  fileSize: z.coerce.bigint().nonnegative().optional().nullable(),
  documentDate: optionalDate,
  expiryDate: optionalDate,
  description: optionalText(3000),
  confidential: z.boolean().default(false),
  verified: z.boolean().default(false),
  verifiedBy: z.string().uuid().optional().nullable(),
  verifiedAt: optionalDate,
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});
export const updatePatientDocumentSchema =
  createPatientDocumentSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: "At least one field is required" },
  );

export const timelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
  eventType: z.string().trim().max(80).optional(),
});
