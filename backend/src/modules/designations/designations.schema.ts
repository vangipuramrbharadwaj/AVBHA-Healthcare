import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export const designationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const designationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  sortBy: z.enum(["designationName", "designationCode", "createdAt"]).default("designationName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createDesignationSchema = z.object({
  departmentId: z.string().uuid().optional().nullable(),
  designationCode: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  designationName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const updateDesignationSchema = createDesignationSchema
  .omit({ designationCode: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateDesignationStatusSchema = z.object({
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.INACTIVE, RecordStatus.ARCHIVED]),
});

export type DesignationListQuery = z.infer<typeof designationListQuerySchema>;
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type UpdateDesignationStatusInput = z.infer<typeof updateDesignationStatusSchema>;
