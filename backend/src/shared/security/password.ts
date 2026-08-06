import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

const MIN_PASSWORD_LENGTH = 12;

export function validatePasswordStrength(password: string): void {
  const checks = [
    password.length >= MIN_PASSWORD_LENGTH,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  if (checks.some((check) => !check)) {
    throw new AppError(
      "Password must be at least 12 characters and include uppercase, lowercase, number and special character",
      400,
      "WEAK_PASSWORD",
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordStrength(password);
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
