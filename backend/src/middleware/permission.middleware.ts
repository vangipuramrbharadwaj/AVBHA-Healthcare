import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/app-error";

export function requirePermission(...requiredPermissions: string[]) {
  return function permissionMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.auth) {
      next(
        new AppError(
          "Authentication is required",
          401,
          "AUTHENTICATION_REQUIRED",
        ),
      );
      return;
    }

    const hasPermission =
      req.auth.roles.includes("SUPER_ADMIN") ||
      requiredPermissions.every((permission) =>
        req.auth!.permissions.includes(permission),
      );

    if (!hasPermission) {
      next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "PERMISSION_DENIED",
          { requiredPermissions },
        ),
      );
      return;
    }

    next();
  };
}

export function requireAnyPermission(...requiredPermissions: string[]) {
  return function anyPermissionMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.auth) {
      next(
        new AppError(
          "Authentication is required",
          401,
          "AUTHENTICATION_REQUIRED",
        ),
      );
      return;
    }

    const hasPermission =
      req.auth.roles.includes("SUPER_ADMIN") ||
      requiredPermissions.some((permission) =>
        req.auth!.permissions.includes(permission),
      );

    if (!hasPermission) {
      next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "PERMISSION_DENIED",
          { requiredPermissions },
        ),
      );
      return;
    }

    next();
  };
}
