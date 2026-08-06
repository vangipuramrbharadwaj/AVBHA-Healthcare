import { createHash, randomBytes } from "node:crypto";
import jwt, {
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

export interface AccessTokenClaims {
  sub: string;
  hospitalId: string;
  branchId?: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

export type VerifiedAccessToken =
  Omit<JwtPayload, "sub"> & AccessTokenClaims;

export function createAccessToken(
  claims: AccessTokenClaims,
): string {
  const expiresIn =
    env.JWT_ACCESS_EXPIRES_IN as NonNullable<
      SignOptions["expiresIn"]
    >;

  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn,
    issuer: "avbha-healthcare",
    audience: "avbha-healthcare-api",
    subject: claims.sub,
  };

  return jwt.sign(
    {
      hospitalId: claims.hospitalId,
      ...(claims.branchId
        ? { branchId: claims.branchId }
        : {}),
      sessionId: claims.sessionId,
      roles: claims.roles,
      permissions: claims.permissions,
      mustChangePassword: claims.mustChangePassword,
    },
    env.JWT_ACCESS_SECRET,
    options,
  );
}

export function verifyAccessToken(
  token: string,
): VerifiedAccessToken {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
      {
        algorithms: ["HS256"],
        issuer: "avbha-healthcare",
        audience: "avbha-healthcare-api",
      },
    );

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.hospitalId !== "string" ||
      typeof decoded.sessionId !== "string" ||
      !Array.isArray(decoded.roles) ||
      !Array.isArray(decoded.permissions) ||
      typeof decoded.mustChangePassword !== "boolean"
    ) {
      throw new Error("Invalid access-token payload");
    }

    return decoded as VerifiedAccessToken;
  } catch {
    throw new AppError(
      "Access token is invalid or expired",
      401,
      "INVALID_ACCESS_TOKEN",
    );
  }
}

export function createRefreshToken(): string {
  return randomBytes(64).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function refreshTokenExpiryDate(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() +
      env.JWT_REFRESH_EXPIRES_IN_DAYS,
  );

  return expiresAt;
}