import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/app-error";

export function enforceTenant(
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

  const requestedHospitalId =
    req.params.hospitalId ??
    req.body?.hospitalId ??
    req.query.hospitalId ??
    req.get("x-hospital-id");

  if (
    requestedHospitalId &&
    String(requestedHospitalId) !== req.auth.hospitalId
  ) {
    next(
      new AppError(
        "Cross-hospital access is not permitted",
        403,
        "TENANT_ACCESS_DENIED",
      ),
    );
    return;
  }

  req.tenant = {
    hospitalId: req.auth.hospitalId,
    ...(req.auth.branchId ? { branchId: req.auth.branchId } : {}),
  };

  next();
}
