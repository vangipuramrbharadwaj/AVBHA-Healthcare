import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const updateHospitalSchema = z.object({
  legalName: z.string().trim().min(2).max(200).optional(),
  displayName: z.string().trim().min(2).max(150).optional(),
  registrationNumber: optionalText(100),
  gstin: optionalText(20),
  pan: optionalText(15),
  email: z.string().trim().email().max(150).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  alternatePhone: optionalText(20),
  addressLine1: z.string().trim().min(2).max(200).optional(),
  addressLine2: optionalText(200),
  city: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().min(2).max(100).optional(),
  postalCode: z.string().trim().min(3).max(15).optional(),
  timezone: z.string().trim().min(2).max(60).optional(),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  logoPath: z.string().trim().max(500).optional().nullable(),
  licenseExpiryDate: z.coerce.date().optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;
