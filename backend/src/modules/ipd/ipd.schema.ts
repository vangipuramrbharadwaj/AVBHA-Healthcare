import {
  IpdAdmissionStatus,
  IpdAdmissionType,
  IpdDischargeType,
} from "@prisma/client";
import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const wardSchema = z.object({
  branchId: z.string().uuid(),
  wardCode: z.string().trim().min(2).max(30),
  wardName: z.string().trim().min(2).max(120),
  wardType: z.string().trim().min(2).max(50),
  floor: z.string().trim().max(30).optional().nullable(),
});

export const roomSchema = z.object({
  branchId: z.string().uuid(),
  wardId: z.string().uuid(),
  roomCode: z.string().trim().min(2).max(30),
  roomName: z.string().trim().min(2).max(120),
  roomType: z.string().trim().min(2).max(50),
  dailyCharge: z.coerce.number().min(0).optional().nullable(),
});

export const bedSchema = z.object({
  branchId: z.string().uuid(),
  roomId: z.string().uuid(),
  bedCode: z.string().trim().min(2).max(30),
  bedName: z.string().trim().min(2).max(100),
  bedType: z.string().trim().min(2).max(50),
  dailyCharge: z.coerce.number().min(0).optional().nullable(),
});

export const admissionSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  bedId: z.string().uuid().optional().nullable(),
  admissionDate: z.coerce.date().default(() => new Date()),
  admissionType: z
    .nativeEnum(IpdAdmissionType)
    .default(IpdAdmissionType.ELECTIVE),
  admissionReason: z.string().trim().max(5000).optional().nullable(),
  provisionalDiagnosis: z.string().trim().max(5000).optional().nullable(),
  expectedDischargeDate: z.coerce.date().optional().nullable(),
  attendantName: z.string().trim().max(150).optional().nullable(),
  attendantPhone: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: z.nativeEnum(IpdAdmissionStatus).optional(),
});

export const transferSchema = z.object({
  bedId: z.string().uuid(),
  transferReason: z.string().trim().max(3000).optional().nullable(),
});

export const nursingSchema = z.object({
  noteType: z.string().trim().min(2).max(50),
  note: z.string().trim().min(2).max(10000),
  shift: z.string().trim().max(30).optional().nullable(),
});

export const vitalsSchema = z.object({
  temperatureCelsius: z.coerce.number().min(20).max(50).optional().nullable(),
  pulseRate: z.coerce.number().int().min(20).max(250).optional().nullable(),
  respiratoryRate: z.coerce.number().int().min(5).max(100).optional().nullable(),
  systolicBp: z.coerce.number().int().min(40).max(300).optional().nullable(),
  diastolicBp: z.coerce.number().int().min(20).max(200).optional().nullable(),
  spo2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  bloodSugar: z.coerce.number().min(0).max(2000).optional().nullable(),
  painScore: z.coerce.number().int().min(0).max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const doctorRoundSchema = z.object({
  doctorId: z.string().uuid(),
  progressNotes: z.string().trim().max(10000).optional().nullable(),
  examination: z.string().trim().max(10000).optional().nullable(),
  diagnosis: z.string().trim().max(5000).optional().nullable(),
  plan: z.string().trim().max(10000).optional().nullable(),
  orders: z.string().trim().max(10000).optional().nullable(),
});

export const medicationSchema = z.object({
  medicineName: z.string().trim().min(2).max(200),
  dosage: z.string().trim().max(100).optional().nullable(),
  route: z.string().trim().max(50).optional().nullable(),
  frequency: z.string().trim().max(100).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  instructions: z.string().trim().max(3000).optional().nullable(),
});

export const administrationSchema = z.object({
  scheduledAt: z.coerce.date(),
  administeredAt: z.coerce.date().optional().nullable(),
  doseGiven: z.string().trim().max(100).optional().nullable(),
  status: z
    .enum(["PENDING", "GIVEN", "MISSED", "REFUSED", "HELD"])
    .default("PENDING"),
  remarks: z.string().trim().max(3000).optional().nullable(),
});

export const intakeOutputSchema = z.object({
  recordType: z.enum(["INTAKE", "OUTPUT"]),
  category: z.string().trim().min(2).max(80),
  quantityMl: z.coerce.number().min(0),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const dischargeSchema = z.object({
  dischargeType: z.nativeEnum(IpdDischargeType),
  finalDiagnosis: z.string().trim().min(2).max(10000),
  hospitalCourse: z.string().trim().max(15000).optional().nullable(),
  proceduresDone: z.string().trim().max(10000).optional().nullable(),
  conditionAtDischarge: z.string().trim().max(5000).optional().nullable(),
  dischargeAdvice: z.string().trim().max(10000).optional().nullable(),
  dischargeMedication: z.string().trim().max(10000).optional().nullable(),
  followUpDate: z.coerce.date().optional().nullable(),
  followUpInstructions: z.string().trim().max(5000).optional().nullable(),
});
