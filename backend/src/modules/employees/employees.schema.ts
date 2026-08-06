import {
  EmploymentType,
  Gender,
  RecordStatus,
} from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const optionalDate = z.coerce.date().optional().nullable();

export const employeeIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const employeeDocumentParamSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
});

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  gender: z.nativeEnum(Gender).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  sortBy: z
    .enum([
      "employeeCode",
      "firstName",
      "joiningDate",
      "createdAt",
    ])
    .default("firstName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const employeeBaseSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  reportingManagerId: z.string().uuid().optional().nullable(),

  title: optionalText(10),
  firstName: z.string().trim().min(1).max(80),
  middleName: optionalText(80),
  lastName: optionalText(80),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: optionalDate,
  bloodGroup: optionalText(5),
  maritalStatus: optionalText(20),
  nationality: optionalText(80),
  religion: optionalText(80),

  mobile: z.string().trim().min(7).max(20),
  alternateMobile: optionalText(20),
  email: z.string().trim().email().max(150).optional().nullable(),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  postalCode: optionalText(15),

  aadhaarNumber: optionalText(20),
  panNumber: optionalText(15),
  passportNumber: optionalText(30),

  emergencyContactName: optionalText(150),
  emergencyContactPhone: optionalText(20),
  emergencyRelationship: optionalText(50),

  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.PERMANENT),
  joiningDate: z.coerce.date(),
  confirmationDate: optionalDate,
  probationEndDate: optionalDate,
  relievingDate: optionalDate,

  basicSalary: z.coerce.number().nonnegative().optional().nullable(),
  bankName: optionalText(150),
  bankAccountNumber: optionalText(50),
  ifscCode: optionalText(20),
  pfNumber: optionalText(50),
  esiNumber: optionalText(50),

  photoPath: optionalText(500),
  signaturePath: optionalText(500),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const createEmployeeSchema = employeeBaseSchema.extend({
  employeeCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
});

export const updateEmployeeSchema = employeeBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateEmployeeStatusSchema = z.object({
  status: z.enum([
    RecordStatus.ACTIVE,
    RecordStatus.INACTIVE,
    RecordStatus.ARCHIVED,
  ]),
});

export const createEmployeeDocumentSchema = z.object({
  documentType: z.string().trim().min(2).max(50),
  documentName: z.string().trim().min(2).max(200),
  filePath: z.string().trim().min(1).max(500),
  mimeType: optionalText(100),
  fileSize: z.coerce.bigint().nonnegative().optional().nullable(),
  documentDate: optionalDate,
  expiryDate: optionalDate,
  verified: z.boolean().default(false),
});

export const updateEmployeeDocumentSchema =
  createEmployeeDocumentSchema
    .partial()
    .extend({
      verifiedBy: z.string().uuid().optional().nullable(),
      verifiedAt: optionalDate,
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required",
    });

export type EmployeeListQuery = z.infer<
  typeof employeeListQuerySchema
>;
export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;
export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeSchema
>;
export type UpdateEmployeeStatusInput = z.infer<
  typeof updateEmployeeStatusSchema
>;
export type CreateEmployeeDocumentInput = z.infer<
  typeof createEmployeeDocumentSchema
>;
export type UpdateEmployeeDocumentInput = z.infer<
  typeof updateEmployeeDocumentSchema
>;
