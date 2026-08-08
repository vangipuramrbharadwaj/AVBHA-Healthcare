import {
  ClinicalOrderType,
  ConsultationStatus,
  DiagnosisType,
  OpdVisitStatus,
  OpdVisitType,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createVisitSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  visitDate: z.coerce.date().default(() => new Date()),
  visitType: z.nativeEnum(OpdVisitType).default(OpdVisitType.NEW),
  chiefComplaint: z.string().trim().max(3000).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const listVisitsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: z.nativeEnum(OpdVisitStatus).optional(),
});

export const vitalsSchema = z.object({
  temperatureCelsius: z.coerce.number().min(20).max(50).optional().nullable(),
  pulseRate: z.coerce.number().int().min(20).max(250).optional().nullable(),
  systolicBp: z.coerce.number().int().min(40).max(300).optional().nullable(),
  diastolicBp: z.coerce.number().int().min(20).max(200).optional().nullable(),
  spo2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  heightCm: z.coerce.number().min(20).max(300).optional().nullable(),
  weightKg: z.coerce.number().min(0.5).max(1000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const consultationSchema = z.object({
  status: z.nativeEnum(ConsultationStatus).default(ConsultationStatus.IN_PROGRESS),
  history: z.string().trim().max(5000).optional().nullable(),
  examinationNotes: z.string().trim().max(5000).optional().nullable(),
  clinicalNotes: z.string().trim().max(5000).optional().nullable(),
  advice: z.string().trim().max(5000).optional().nullable(),
  doctorNotes: z.string().trim().max(5000).optional().nullable(),
});

export const diagnosisSchema = z.object({
  diagnosisType: z.nativeEnum(DiagnosisType).default(DiagnosisType.PROVISIONAL),
  diagnosisCode: z.string().trim().max(30).optional().nullable(),
  diagnosisName: z.string().trim().min(2).max(250),
  description: z.string().trim().max(3000).optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export const prescriptionSchema = z.object({
  notes: z.string().trim().max(3000).optional().nullable(),
  items: z.array(z.object({
    medicineId: z.string().uuid(),
    medicineName: z.string().trim().min(2).max(200),
    dosage: z.string().trim().max(100).optional().nullable(),
    frequency: z.string().trim().max(100).optional().nullable(),
    durationDays: z.coerce.number().int().min(1).max(3650).optional().nullable(),
    prescribedQuantity: z.coerce.number().positive().optional().nullable(),
    instructions: z.string().trim().max(2000).optional().nullable(),
  })).min(1),
});

export const clinicalOrderSchema = z.object({
  orderType: z.nativeEnum(ClinicalOrderType),
  orderName: z.string().trim().min(2).max(250),
  instructions: z.string().trim().max(3000).optional().nullable(),
  priority: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
});

export const followUpSchema = z.object({
  followUpDate: z.coerce.date(),
  reason: z.string().trim().max(3000).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const medicineSearchSchema = z.object({ q: z.string().trim().min(1).max(100), branchId: z.string().uuid().optional() });
