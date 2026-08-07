import { apiRequest } from "./http";
import type { AuthUser, LoginResponse } from "../types/auth";

export interface LoginInput {
  hospitalCode: string;
  login: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
}

export function login(input: LoginInput) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: input,
  });
}

export function me() {
  return apiRequest<AuthUser>("/auth/me");
}

export function logout() {
  return apiRequest<null>("/auth/logout", { method: "POST" });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<null>("/auth/change-password", {
    method: "POST",
    body: input,
  });
}
