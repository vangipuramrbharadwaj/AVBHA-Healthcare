import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export const branchIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const branchListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  sortBy: z.enum(["branchName", "branchCode", "createdAt"]).default("branchName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createBranchSchema = z.object({
  branchCode: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  branchName: z.string().trim().min(2).max(150),
  branchType: z.string().trim().min(2).max(30).default("HOSPITAL"),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(2).max(500),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(15).optional().nullable(),
  isMainBranch: z.boolean().default(false),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const updateBranchSchema = createBranchSchema
  .omit({ branchCode: true, isMainBranch: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateBranchStatusSchema = z.object({
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.INACTIVE, RecordStatus.ARCHIVED]),
});

export type BranchListQuery = z.infer<typeof branchListQuerySchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type UpdateBranchStatusInput = z.infer<typeof updateBranchStatusSchema>;
