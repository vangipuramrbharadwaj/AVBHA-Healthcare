import { z } from "zod";

export const loginSchema = z.object({
  hospitalCode: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  login: z.string().trim().min(2).max(180),
  password: z.string().min(1).max(200),
  deviceId: z.string().trim().max(150).optional(),
  deviceName: z.string().trim().max(150).optional(),
  deviceType: z.string().trim().max(50).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
