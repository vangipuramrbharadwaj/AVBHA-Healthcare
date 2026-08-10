import {
  LabOrderPriority,
  LabOrderStatus,
  LabResultStatus,
  LabValueType,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createTestSchema = z.object({
  testCode: z.string().trim().min(2).max(40),
  testName: z.string().trim().min(2).max(200),
  category: z.string().trim().max(120).optional().nullable(),
  sampleType: z.string().trim().min(2).max(80),
  containerType: z.string().trim().max(80).optional().nullable(),
  turnaroundMinutes: z.coerce.number().int().min(1).optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  instructions: z.string().trim().max(3000).optional().nullable(),
  parameters: z.array(z.object({
    parameterCode: z.string().trim().min(1).max(40),
    parameterName: z.string().trim().min(2).max(200),
    valueType: z.nativeEnum(LabValueType).default(LabValueType.NUMERIC),
    unit: z.string().trim().max(50).optional().nullable(),
    referenceRange: z.string().trim().max(200).optional().nullable(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    required: z.boolean().default(true),
  })).default([]),
});

export const createOrderSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid(),
  ipdAdmissionId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(LabOrderPriority).default(LabOrderPriority.ROUTINE),
  clinicalNotes: z.string().trim().max(5000).optional().nullable(),
  testIds: z.array(z.string().uuid()).min(1),
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  status: z.nativeEnum(LabOrderStatus).optional(),
});

export const collectSampleSchema = z.object({
  barcode: z.string().trim().max(100).optional().nullable(),
});

export const rejectSampleSchema = z.object({
  rejectionReason: z.string().trim().min(2).max(3000),
});

export const resultEntrySchema = z.object({
  interpretation: z.string().trim().max(5000).optional().nullable(),
  remarks: z.string().trim().max(5000).optional().nullable(),
  values: z.array(z.object({
    parameterId: z.string().uuid(),
    numericValue: z.coerce.number().optional().nullable(),
    textValue: z.string().trim().max(3000).optional().nullable(),
    booleanValue: z.boolean().optional().nullable(),
    choiceValue: z.string().trim().max(200).optional().nullable(),
    unit: z.string().trim().max(50).optional().nullable(),
    referenceRange: z.string().trim().max(200).optional().nullable(),
    abnormalFlag: z.string().trim().max(20).optional().nullable(),
    critical: z.boolean().default(false),
    comments: z.string().trim().max(3000).optional().nullable(),
  })).default([]),
}).refine(
  (input) => Boolean(input.interpretation?.trim()) || input.values.length > 0,
  {
    message: "Enter at least one result value or an interpretation",
    path: ["values"],
  },
);

export const resultStatusSchema = z.object({
  status: z.nativeEnum(LabResultStatus),
  amendmentReason: z.string().trim().max(3000).optional().nullable(),
});
