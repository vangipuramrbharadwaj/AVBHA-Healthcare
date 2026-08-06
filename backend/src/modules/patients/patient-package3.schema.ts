import { z } from "zod";

export const patientIdParamsSchema = z.object({ id: z.string().uuid() });
export const patientResourceParamsSchema = z.object({
  id: z.string().uuid(),
  resourceId: z.string().uuid(),
});
export const mergeRequestParamsSchema = z.object({
  requestId: z.string().uuid(),
});
export const duplicateSearchSchema = z.object({
  q: z.string().trim().min(2).max(150),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const advancedSearchSchema = z.object({
  q: z.string().trim().min(1).max(150),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const createFamilyRelationshipSchema = z.object({
  relatedPatientId: z.string().uuid(),
  relationshipType: z.string().trim().min(2).max(60),
  isEmergencyContact: z.boolean().default(false),
  isPrimaryContact: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export const updateFamilyRelationshipSchema =
  createFamilyRelationshipSchema.omit({ relatedPatientId: true }).partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required",
    });
export const createPatientAlertSchema = z.object({
  alertType: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(3000).optional().nullable(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export const updatePatientAlertSchema = createPatientAlertSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
export const createMergeRequestSchema = z.object({
  sourcePatientId: z.string().uuid(),
  targetPatientId: z.string().uuid(),
  reason: z.string().trim().min(5).max(3000),
});
export const reviewMergeRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().trim().max(3000).optional().nullable(),
});
export const createIdentifierSchema = z.object({
  identifierType: z.enum(["QR", "BARCODE", "EXTERNAL"]),
  identifierValue: z.string().trim().min(3).max(200),
  displayValue: z.string().trim().max(200).optional().nullable(),
  issuedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});
