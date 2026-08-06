import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const optionalDate = z.coerce.date().optional().nullable();

export const patientIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const patientListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  branchId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  gender: z.string().trim().max(20).optional(),
  sortBy: z.enum(["createdAt", "firstName", "uhid"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const patientAddressSchema = z.object({
  addressType: z.string().trim().min(2).max(30).default("CURRENT"),
  addressLine1: z.string().trim().min(2).max(200),
  addressLine2: optionalText(200),
  landmark: optionalText(150),
  city: optionalText(100),
  district: optionalText(100),
  state: optionalText(100),
  country: z.string().trim().max(100).default("India"),
  postalCode: optionalText(15),
  isPrimary: z.boolean().default(false),
});

export const patientEmergencyContactSchema = z.object({
  contactName: z.string().trim().min(2).max(150),
  relationship: optionalText(60),
  mobile: z.string().trim().min(7).max(20),
  alternateMobile: optionalText(20),
  email: z.string().trim().email().max(150).optional().nullable(),
  isPrimary: z.boolean().default(false),
});

const patientBaseSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  title: optionalText(10),
  firstName: z.string().trim().min(1).max(100),
  middleName: optionalText(100),
  lastName: optionalText(100),
  gender: optionalText(20),
  dateOfBirth: optionalDate,
  ageYears: z.coerce.number().int().min(0).max(150).optional().nullable(),
  bloodGroup: optionalText(10),
  maritalStatus: optionalText(30),
  nationality: optionalText(80),
  religion: optionalText(80),
  primaryMobile: z.string().trim().min(7).max(20),
  alternateMobile: optionalText(20),
  email: z.string().trim().email().max(150).optional().nullable(),
  aadhaarNumber: optionalText(20),
  panNumber: optionalText(20),
  passportNumber: optionalText(30),
  occupation: optionalText(120),
  preferredLanguage: optionalText(50),
  referredBy: optionalText(150),
  referralSource: optionalText(80),
  medicalAlerts: optionalText(3000),
  allergiesSummary: optionalText(3000),
  chronicDiseasesSummary: optionalText(3000),
  isDeceased: z.boolean().default(false),
  deceasedAt: optionalDate,
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const createPatientSchema = patientBaseSchema.extend({
  uhid: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((value) => value.toUpperCase())
    .optional(),
  addresses: z.array(patientAddressSchema).max(5).default([]),
  emergencyContacts: z.array(patientEmergencyContactSchema).max(5).default([]),
});

export const updatePatientSchema = patientBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
