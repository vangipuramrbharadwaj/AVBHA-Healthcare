import { z } from "zod";

const timeString = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  "Time must use HH:mm format",
);

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const lockTokenParamsSchema = z.object({
  lockToken: z.string().trim().min(10).max(100),
});

export const createScheduleSchema = z.object({
  branchId: z.string().uuid(),
  doctorId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
  slotDuration: z.coerce.number().int().min(5).max(240).default(15),
  maxAppointments: z.coerce.number().int().min(1).max(500).optional().nullable(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
}).superRefine((value, context) => {
  if (value.endTime <= value.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
});

export const updateScheduleSchema = z.object({
  branchId: z.string().uuid().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  slotDuration: z.coerce.number().int().min(5).max(240).optional(),
  maxAppointments: z.coerce.number().int().min(1).max(500).optional().nullable(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"]).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const createBreakSchema = z.object({
  breakName: z.string().trim().min(2).max(100),
  startTime: timeString,
  endTime: timeString,
}).superRefine((value, context) => {
  if (value.endTime <= value.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "Break end time must be after start time",
    });
  }
});

export const createHolidaySchema = z.object({
  branchId: z.string().uuid(),
  doctorId: z.string().uuid(),
  holidayDate: z.coerce.date(),
  reason: z.string().trim().max(300).optional().nullable(),
  allDay: z.boolean().default(true),
  startTime: timeString.optional().nullable(),
  endTime: timeString.optional().nullable(),
}).superRefine((value, context) => {
  if (!value.allDay && (!value.startTime || !value.endTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "Partial-day holiday requires start and end times",
    });
  }
});

export const listSchedulesQuerySchema = z.object({
  doctorId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
});

export const slotsQuerySchema = z.object({
  doctorId: z.string().uuid(),
  branchId: z.string().uuid(),
  date: z.coerce.date(),
});

export const lockSlotSchema = z.object({
  doctorId: z.string().uuid(),
  branchId: z.string().uuid(),
  patientId: z.string().uuid().optional().nullable(),
  slotStart: z.coerce.date(),
  slotEnd: z.coerce.date(),
  lockMinutes: z.coerce.number().int().min(1).max(30).default(5),
}).superRefine((value, context) => {
  if (value.slotEnd <= value.slotStart) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["slotEnd"],
      message: "Slot end must be after slot start",
    });
  }
});
