import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export const departmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const departmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().uuid().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  sortBy: z.enum(["departmentName", "departmentCode", "createdAt"]).default("departmentName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createDepartmentSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  departmentCode: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  departmentName: z.string().trim().min(2).max(120),
  departmentType: z.string().trim().min(2).max(30).default("CLINICAL"),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const updateDepartmentSchema = createDepartmentSchema
  .omit({ departmentCode: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateDepartmentStatusSchema = z.object({
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.INACTIVE, RecordStatus.ARCHIVED]),
});

export type DepartmentListQuery = z.infer<typeof departmentListQuerySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type UpdateDepartmentStatusInput = z.infer<typeof updateDepartmentStatusSchema>;
