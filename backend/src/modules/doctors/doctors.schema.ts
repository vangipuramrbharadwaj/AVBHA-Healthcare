import { RecordStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

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
  employeeId: z.string().uuid(),
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
});

export const updateDoctorSchema = createDoctorSchema
  .omit({ employeeId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
