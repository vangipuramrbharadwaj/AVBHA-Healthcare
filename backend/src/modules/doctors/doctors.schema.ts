import { RecordStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const optionalUuid = z.string().uuid().optional().nullable();

export const doctorIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const doctorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(150).optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
});

export const createDoctorSchema = z.object({
  employeeId: optionalUuid,
  departmentId: z.string().uuid(),

  title: optionalText(10),
  firstName: optionalText(80),
  middleName: optionalText(80),
  lastName: optionalText(80),
  mobile: optionalText(20),
  email: z.string().trim().email().max(150).optional().nullable(),

  doctorCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  medicalRegistrationNumber: z.string().trim().min(2).max(80),
  registrationCouncil: optionalText(120),
  qualification: z.string().trim().min(2).max(1000),
  specialization: z.string().trim().min(2).max(150),
  consultationFee: z.coerce.number().nonnegative().default(0),
  followupFee: z.coerce.number().nonnegative().optional().nullable(),
  emergencyFee: z.coerce.number().nonnegative().optional().nullable(),
  averageConsultationMinutes: z.coerce.number().int().min(5).max(480).default(15),
  isVisitingConsultant: z.boolean().default(false),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
}).superRefine((value, context) => {
  if (!value.employeeId) {
    if (!value.firstName?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "First name is required for an external doctor",
      });
    }
    if (!value.mobile?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobile"],
        message: "Mobile is required for an external doctor",
      });
    }
  }
});

export const updateDoctorSchema = z.object({
  departmentId: z.string().uuid().optional(),
  title: optionalText(10),
  firstName: optionalText(80),
  middleName: optionalText(80),
  lastName: optionalText(80),
  mobile: optionalText(20),
  email: z.string().trim().email().max(150).optional().nullable(),

  doctorCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()).optional(),
  medicalRegistrationNumber: z.string().trim().min(2).max(80).optional(),
  registrationCouncil: optionalText(120),
  qualification: z.string().trim().min(2).max(1000).optional(),
  specialization: z.string().trim().min(2).max(150).optional(),
  consultationFee: z.coerce.number().nonnegative().optional(),
  followupFee: z.coerce.number().nonnegative().optional().nullable(),
  emergencyFee: z.coerce.number().nonnegative().optional().nullable(),
  averageConsultationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  isVisitingConsultant: z.boolean().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
