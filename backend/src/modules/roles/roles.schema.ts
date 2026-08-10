import { DataScope, RecordStatus } from "@prisma/client";
import { z } from "zod";

export const roleIdParamSchema = z.object({ id: z.string().uuid() });

export const roleListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
});

export const createRoleSchema = z.object({
  roleCode: z.string().trim().min(2).max(50).transform((v) => v.toUpperCase()),
  roleName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  dataScope: z.nativeEnum(DataScope).default(DataScope.HOSPITAL),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleSchema = z.object({
  roleName: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  dataScope: z.nativeEnum(DataScope).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
}).refine((v) => Object.keys(v).length > 0, {
  message: "At least one field is required",
});

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});
