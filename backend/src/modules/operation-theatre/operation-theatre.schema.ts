import {
  OtAnaesthesiaType,
  OtBookingPriority,
  OtBookingStatus,
  OtChecklistStatus,
  OtComplicationSeverity,
  OtRecoveryStatus,
  OtTeamRole,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const roomSchema = z.object({
  branchId: z.string().uuid(),
  roomCode: z.string().trim().min(2).max(30),
  roomName: z.string().trim().min(2).max(120),
  floor: z.string().trim().max(50).optional().nullable(),
  roomType: z.string().trim().max(80).optional().nullable(),
  equipmentNotes: z.string().trim().max(5000).optional().nullable(),
});

export const procedureSchema = z.object({
  procedureCode: z.string().trim().min(2).max(40),
  procedureName: z.string().trim().min(2).max(200),
  speciality: z.string().trim().max(120).optional().nullable(),
  estimatedMinutes: z.coerce.number().int().min(1).optional().nullable(),
  baseCharge: z.coerce.number().min(0).optional().nullable(),
  defaultAnaesthesiaType: z.nativeEnum(OtAnaesthesiaType).optional().nullable(),
  preparationInstructions: z.string().trim().max(5000).optional().nullable(),
});

export const bookingSchema = z.object({
  branchId: z.string().uuid(),
  patientId: z.string().uuid(),
  ipdAdmissionId: z.string().uuid().optional().nullable(),
  opdVisitId: z.string().uuid().optional().nullable(),
  otRoomId: z.string().uuid(),
  procedureId: z.string().uuid(),
  priority: z.nativeEnum(OtBookingPriority).default(OtBookingPriority.ELECTIVE),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  primarySurgeonId: z.string().uuid(),
  anaesthetistId: z.string().uuid().optional().nullable(),
  preOperativeDiagnosis: z.string().trim().max(10000).optional().nullable(),
  indication: z.string().trim().max(5000).optional().nullable(),
  specialInstructions: z.string().trim().max(5000).optional().nullable(),
}).superRefine((value, context) => {
  if (value.scheduledEnd <= value.scheduledStart) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scheduledEnd"],
      message: "Scheduled end must be after scheduled start",
    });
  }
});

export const listBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  status: z.nativeEnum(OtBookingStatus).optional(),
  date: z.coerce.date().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.nativeEnum(OtBookingStatus),
  postOperativeDiagnosis: z.string().trim().max(10000).optional().nullable(),
  estimatedBloodLossMl: z.coerce.number().int().min(0).optional().nullable(),
});

export const rescheduleSchema = z.object({
  otRoomId: z.string().uuid().optional(),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
}).superRefine((value, context) => {
  if (value.scheduledEnd <= value.scheduledStart) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scheduledEnd"],
      message: "Scheduled end must be after scheduled start",
    });
  }
});

export const cancelSchema = z.object({
  reason: z.string().trim().min(2).max(5000),
});

export const teamSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.nativeEnum(OtTeamRole),
  lead: z.boolean().default(false),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const checklistSchema = z.object({
  phase: z.string().trim().min(2).max(50),
  itemCode: z.string().trim().min(2).max(50),
  itemLabel: z.string().trim().min(2).max(250),
  status: z.nativeEnum(OtChecklistStatus).default(OtChecklistStatus.PENDING),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const consentSchema = z.object({
  consentType: z.string().trim().min(2).max(80),
  consented: z.boolean(),
  consentedByName: z.string().trim().max(150).optional().nullable(),
  relationship: z.string().trim().max(80).optional().nullable(),
  witnessName: z.string().trim().max(150).optional().nullable(),
  documentPath: z.string().trim().max(500).optional().nullable(),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const anaesthesiaAssessmentSchema = z.object({
  anaesthesiaType: z.nativeEnum(OtAnaesthesiaType),
  asaGrade: z.string().trim().max(20).optional().nullable(),
  airwayAssessment: z.string().trim().max(5000).optional().nullable(),
  allergies: z.string().trim().max(5000).optional().nullable(),
  comorbidities: z.string().trim().max(5000).optional().nullable(),
  fastingConfirmed: z.boolean().default(false),
  consentConfirmed: z.boolean().default(false),
  preMedication: z.string().trim().max(3000).optional().nullable(),
  specialRisks: z.string().trim().max(5000).optional().nullable(),
  fitForAnaesthesia: z.boolean().default(false),
});

export const intraoperativeNoteSchema = z.object({
  noteType: z.string().trim().min(2).max(50),
  note: z.string().trim().min(2).max(15000),
  bloodLossMl: z.coerce.number().int().min(0).optional().nullable(),
  urineOutputMl: z.coerce.number().int().min(0).optional().nullable(),
  fluidsGivenMl: z.coerce.number().int().min(0).optional().nullable(),
});

export const consumableSchema = z.object({
  itemCode: z.string().trim().max(60).optional().nullable(),
  itemName: z.string().trim().min(2).max(200),
  batchNumber: z.string().trim().max(80).optional().nullable(),
  quantity: z.coerce.number().positive(),
  unit: z.string().trim().max(30).optional().nullable(),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  billable: z.boolean().default(true),
});

export const implantSchema = z.object({
  implantName: z.string().trim().min(2).max(200),
  manufacturer: z.string().trim().max(150).optional().nullable(),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  batchNumber: z.string().trim().max(80).optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  quantity: z.coerce.number().positive().default(1),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  billable: z.boolean().default(true),
});

export const specimenSchema = z.object({
  specimenType: z.string().trim().min(2).max(120),
  site: z.string().trim().max(120).optional().nullable(),
  investigation: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const recoverySchema = z.object({
  status: z.nativeEnum(OtRecoveryStatus).default(OtRecoveryStatus.IN_RECOVERY),
  consciousnessLevel: z.string().trim().max(80).optional().nullable(),
  painScore: z.coerce.number().int().min(0).max(10).optional().nullable(),
  systolicBp: z.coerce.number().int().min(40).max(300).optional().nullable(),
  diastolicBp: z.coerce.number().int().min(20).max(200).optional().nullable(),
  pulseRate: z.coerce.number().int().min(20).max(250).optional().nullable(),
  respiratoryRate: z.coerce.number().int().min(5).max(100).optional().nullable(),
  spo2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  temperatureCelsius: z.coerce.number().min(20).max(50).optional().nullable(),
  nauseaVomiting: z.boolean().default(false),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const complicationSchema = z.object({
  complicationType: z.string().trim().min(2).max(120),
  severity: z.nativeEnum(OtComplicationSeverity),
  description: z.string().trim().min(2).max(10000),
  actionTaken: z.string().trim().max(10000).optional().nullable(),
  resolved: z.boolean().default(false),
});

export const dashboardQuerySchema = z.object({
  date: z.coerce.date().optional(),
});
