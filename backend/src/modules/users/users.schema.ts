import { UserStatus } from "@prisma/client";
import { z } from "zod";

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(150).optional(),
  branchId: z.string().uuid().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const createUserSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid().optional().nullable(),
  fullName: z.string().trim().min(2).max(150),
  username: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  temporaryPassword: z.string().min(8).max(128),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440).default(30),
  mustChangePassword: z.boolean().default(true),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  roleIds: z.array(z.string().uuid()).default([]),
});

export const updateUserSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  fullName: z.string().trim().min(2).max(150).optional(),
  username: z.string().trim().min(3).max(100).optional(),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  twoFactorEnabled: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const setUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const resetUserPasswordSchema = z.object({
  temporaryPassword: z.string().min(8).max(128),
  mustChangePassword: z.boolean().default(true),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
