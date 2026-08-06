import {
  AppointmentPriority,
  AppointmentStatus,
  AppointmentType,
  AppointmentVisitType,
} from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const appointmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createAppointmentSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentDate: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(15),
  appointmentType: z.nativeEnum(AppointmentType).default(AppointmentType.CONSULTATION),
  visitType: z.nativeEnum(AppointmentVisitType).default(AppointmentVisitType.NEW),
  priority: z.nativeEnum(AppointmentPriority).default(AppointmentPriority.NORMAL),
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.BOOKED),
  chiefComplaint: optionalText(3000),
  reason: optionalText(3000),
  notes: optionalText(3000),
  internalNotes: optionalText(3000),
  source: optionalText(50),
  referredBy: optionalText(150),
  confirmationMode: optionalText(30),
}).superRefine((value, context) => {
  if (value.endTime <= value.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
});

export const updateAppointmentSchema = z.object({
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  appointmentDate: z.coerce.date().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  appointmentType: z.nativeEnum(AppointmentType).optional(),
  visitType: z.nativeEnum(AppointmentVisitType).optional(),
  priority: z.nativeEnum(AppointmentPriority).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  chiefComplaint: optionalText(3000),
  reason: optionalText(3000),
  notes: optionalText(3000),
  internalNotes: optionalText(3000),
  source: optionalText(50),
  referredBy: optionalText(150),
  confirmationMode: optionalText(30),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().trim().min(3).max(3000),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  reason: z.string().trim().max(3000).optional().nullable(),
}).superRefine((value, context) => {
  if (value.endTime <= value.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
});

export const appointmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  appointmentType: z.nativeEnum(AppointmentType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
