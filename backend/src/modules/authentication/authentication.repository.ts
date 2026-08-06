import {
  LoginAttemptResult,
  SecurityEventType,
  SecuritySeverity,
  SessionStatus,
  UserStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";

const authUserInclude = {
  hospital: true,
  branch: true,
  userRoles: {
    where: {
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      effectiveFrom: { lte: new Date() },
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type AuthenticationUser = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

export function findUserForLogin(
  hospitalCode: string,
  login: string,
): Promise<AuthenticationUser | null> {
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      hospital: {
        hospitalCode,
        active: true,
        deletedAt: null,
      },
      OR: [
        { username: { equals: login, mode: "insensitive" } },
        { email: { equals: login, mode: "insensitive" } },
      ],
    },
    include: authUserInclude,
  });
}

export function findAuthenticationUserById(
  userId: string,
): Promise<AuthenticationUser | null> {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      status: UserStatus.ACTIVE,
      hospital: {
        active: true,
        deletedAt: null,
      },
    },
    include: authUserInclude,
  });
}

export function findActiveSessionByRefreshTokenHash(refreshTokenHash: string) {
  return prisma.userSession.findFirst({
    where: {
      refreshTokenHash,
      status: SessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export function findActiveSession(sessionId: string, userId: string) {
  return prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
      status: SessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export function createSession(data: {
  hospitalId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.userSession.create({
    data: {
      hospitalId: data.hospitalId,
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      expiresAt: data.expiresAt,
      ...(data.deviceId ? { deviceId: data.deviceId } : {}),
      ...(data.deviceName ? { deviceName: data.deviceName } : {}),
      ...(data.deviceType ? { deviceType: data.deviceType } : {}),
      ...(data.browser ? { browser: data.browser } : {}),
      ...(data.operatingSystem ? { operatingSystem: data.operatingSystem } : {}),
      ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
      ...(data.userAgent ? { userAgent: data.userAgent } : {}),
    },
  });
}

export function rotateSession(
  sessionId: string,
  refreshTokenHash: string,
  expiresAt: Date,
) {
  return prisma.userSession.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash,
      expiresAt,
      lastActivityAt: new Date(),
      status: SessionStatus.ACTIVE,
    },
  });
}

export function revokeSession(
  sessionId: string,
  reason: string,
  revokedBy?: string,
) {
  return prisma.userSession.updateMany({
    where: {
      id: sessionId,
      status: SessionStatus.ACTIVE,
    },
    data: {
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason,
      ...(revokedBy ? { revokedBy } : {}),
    },
  });
}

export function revokeAllUserSessions(
  userId: string,
  reason: string,
  exceptSessionId?: string,
) {
  return prisma.userSession.updateMany({
    where: {
      userId,
      status: SessionStatus.ACTIVE,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: {
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason,
      revokedBy: userId,
    },
  });
}

export function recordLoginAttempt(data: {
  hospitalId?: string;
  userId?: string;
  loginValue: string;
  result: LoginAttemptResult;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
}) {
  return prisma.loginAttempt.create({
    data: {
      loginValue: data.loginValue,
      result: data.result,
      ...(data.hospitalId ? { hospitalId: data.hospitalId } : {}),
      ...(data.userId ? { userId: data.userId } : {}),
      ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
      ...(data.userAgent ? { userAgent: data.userAgent } : {}),
      ...(data.deviceId ? { deviceId: data.deviceId } : {}),
      ...(data.deviceName ? { deviceName: data.deviceName } : {}),
    },
  });
}

export function recordSecurityEvent(data: {
  hospitalId?: string;
  userId?: string;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.securityEvent.create({
    data: {
      eventType: data.eventType,
      severity: data.severity ?? SecuritySeverity.INFO,
      ...(data.hospitalId ? { hospitalId: data.hospitalId } : {}),
      ...(data.userId ? { userId: data.userId } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
      ...(data.userAgent ? { userAgent: data.userAgent } : {}),
      ...(data.deviceId ? { deviceId: data.deviceId } : {}),
      ...(data.metadata ? { metadata: data.metadata } : {}),
    },
  });
}

export function updateSuccessfulLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

export function registerFailedPassword(
  userId: string,
  failedLoginCount: number,
  lockedUntil?: Date,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount,
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  });
}

export function updatePassword(
  userId: string,
  passwordHash: string,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}
