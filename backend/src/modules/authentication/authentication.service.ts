import {
  LoginAttemptResult,
  SecurityEventType,
  SecuritySeverity,
  UserStatus,
} from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import {
  hashPassword,
  verifyPassword,
} from "../../shared/security/password";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
} from "../../shared/security/tokens";
import * as repository from "./authentication.repository";
import type {
  ChangePasswordInput,
  LoginInput,
  RefreshInput,
} from "./authentication.schema";

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

function rolesAndPermissions(user: repository.AuthenticationUser): {
  roles: string[];
  permissions: string[];
} {
  const roles = [...new Set(user.userRoles.map(({ role }) => role.roleCode))];

  const permissions = [
    ...new Set(
      user.userRoles.flatMap(({ role }) =>
        role.rolePermissions.map(
          ({ permission }) => permission.permissionCode,
        ),
      ),
    ),
  ];

  return { roles, permissions };
}

function publicUser(user: repository.AuthenticationUser) {
  const { roles, permissions } = rolesAndPermissions(user);

  return {
    id: user.id,
    hospitalId: user.hospitalId,
    branchId: user.branchId,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    hospital: {
      id: user.hospital.id,
      code: user.hospital.hospitalCode,
      name: user.hospital.displayName,
    },
    branch: user.branch
      ? {
          id: user.branch.id,
          code: user.branch.branchCode,
          name: user.branch.branchName,
        }
      : null,
    roles,
    permissions,
  };
}

export async function login(
  input: LoginInput,
  context: RequestContext,
) {
  const user = await repository.findUserForLogin(
    input.hospitalCode,
    input.login,
  );

  if (!user) {
    await repository.recordLoginAttempt({
      loginValue: input.login,
      result: LoginAttemptResult.USER_NOT_FOUND,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    });

    throw new AppError("Invalid login credentials", 401, "INVALID_CREDENTIALS");
  }

  if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
    await repository.recordLoginAttempt({
      hospitalId: user.hospitalId,
      userId: user.id,
      loginValue: input.login,
      result: LoginAttemptResult.USER_INACTIVE,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    });

    throw new AppError("User account is inactive", 403, "USER_INACTIVE");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await repository.recordLoginAttempt({
      hospitalId: user.hospitalId,
      userId: user.id,
      loginValue: input.login,
      result: LoginAttemptResult.ACCOUNT_LOCKED,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    });

    throw new AppError(
      "User account is temporarily locked",
      423,
      "ACCOUNT_LOCKED",
      { lockedUntil: user.lockedUntil },
    );
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordValid) {
    const failedLoginCount = user.failedLoginCount + 1;
    const shouldLock = failedLoginCount >= env.MAX_LOGIN_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000)
      : undefined;

    await repository.registerFailedPassword(
      user.id,
      failedLoginCount,
      lockedUntil,
    );

    await repository.recordLoginAttempt({
      hospitalId: user.hospitalId,
      userId: user.id,
      loginValue: input.login,
      result: LoginAttemptResult.INVALID_PASSWORD,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    });

    if (shouldLock) {
      await repository.recordSecurityEvent({
        hospitalId: user.hospitalId,
        userId: user.id,
        eventType: SecurityEventType.ACCOUNT_LOCKED,
        severity: SecuritySeverity.WARNING,
        description: "Account locked after repeated failed logins",
        ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
        ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      });
    }

    throw new AppError("Invalid login credentials", 401, "INVALID_CREDENTIALS");
  }

  const refreshToken = createRefreshToken();
  const session = await repository.createSession({
    hospitalId: user.hospitalId,
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    ...(input.deviceType ? { deviceType: input.deviceType } : {}),
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
  });

  await repository.updateSuccessfulLogin(user.id);

  await Promise.all([
    repository.recordLoginAttempt({
      hospitalId: user.hospitalId,
      userId: user.id,
      loginValue: input.login,
      result: LoginAttemptResult.SUCCESS,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    }),
    repository.recordSecurityEvent({
      hospitalId: user.hospitalId,
      userId: user.id,
      eventType: SecurityEventType.LOGIN_SUCCESS,
      description: "Successful login",
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    }),
  ]);

  const { roles, permissions } = rolesAndPermissions(user);

  const accessToken = createAccessToken({
    sub: user.id,
    hospitalId: user.hospitalId,
    ...(user.branchId ? { branchId: user.branchId } : {}),
    sessionId: session.id,
    roles,
    permissions,
    mustChangePassword: user.mustChangePassword,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    user: publicUser(user),
  };
}

export async function refresh(input: RefreshInput) {
  const currentHash = hashToken(input.refreshToken);
  const session = await repository.findActiveSessionByRefreshTokenHash(
    currentHash,
  );

  if (!session) {
    throw new AppError(
      "Refresh token is invalid or expired",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const user = await repository.findAuthenticationUserById(session.userId);

  if (!user) {
    await repository.revokeSession(
      session.id,
      "User is no longer active",
      session.userId,
    );

    throw new AppError("User account is inactive", 401, "USER_INACTIVE");
  }

  const refreshToken = createRefreshToken();

  await repository.rotateSession(
    session.id,
    hashToken(refreshToken),
    refreshTokenExpiryDate(),
  );

  const { roles, permissions } = rolesAndPermissions(user);

  const accessToken = createAccessToken({
    sub: user.id,
    hospitalId: user.hospitalId,
    ...(user.branchId ? { branchId: user.branchId } : {}),
    sessionId: session.id,
    roles,
    permissions,
    mustChangePassword: user.mustChangePassword,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function logout(
  userId: string,
  sessionId: string,
  context: RequestContext,
): Promise<void> {
  await repository.revokeSession(sessionId, "User logout", userId);

  await repository.recordSecurityEvent({
    userId,
    eventType: SecurityEventType.LOGOUT,
    description: "User logged out",
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
  });
}

export async function logoutAll(
  userId: string,
  currentSessionId: string,
  context: RequestContext,
): Promise<void> {
  await repository.revokeAllUserSessions(
    userId,
    "User requested logout from all devices",
    currentSessionId,
  );

  await repository.recordSecurityEvent({
    userId,
    eventType: SecurityEventType.ALL_SESSIONS_REVOKED,
    description: "All other sessions were revoked",
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
  });
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: ChangePasswordInput,
  context: RequestContext,
): Promise<void> {
  const user = await repository.findAuthenticationUserById(userId);

  if (!user) {
    throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
  }

  const currentPasswordValid = await verifyPassword(
    input.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordValid) {
    throw new AppError(
      "Current password is incorrect",
      400,
      "CURRENT_PASSWORD_INCORRECT",
    );
  }

  const samePassword = await verifyPassword(
    input.newPassword,
    user.passwordHash,
  );

  if (samePassword) {
    throw new AppError(
      "New password must be different from the current password",
      400,
      "PASSWORD_REUSE_NOT_ALLOWED",
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  await repository.updatePassword(user.id, passwordHash);
  await repository.revokeAllUserSessions(
    user.id,
    "Password was changed",
    currentSessionId,
  );

  await repository.recordSecurityEvent({
    hospitalId: user.hospitalId,
    userId: user.id,
    eventType: SecurityEventType.PASSWORD_CHANGED,
    description: "Password changed successfully",
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
  });
}

export async function me(userId: string) {
  const user = await repository.findAuthenticationUserById(userId);

  if (!user) {
    throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
  }

  return publicUser(user);
}
