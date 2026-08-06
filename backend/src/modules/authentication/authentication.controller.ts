import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
} from "./authentication.schema";
import * as authenticationService from "./authentication.service";

function requestContext(req: Request) {
  const ipAddress = req.ip;
  const userAgent = req.get("user-agent");

  return {
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authenticationService.login(
      input,
      requestContext(req),
    );

    res.status(200).json(
      successResponse(
        result,
        result.user.mustChangePassword
          ? "Login successful. Password change is required."
          : "Login successful",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = refreshSchema.parse(req.body);
    const result = await authenticationService.refresh(input);

    res.status(200).json(
      successResponse(result, "Token refreshed successfully", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authenticationService.logout(
      req.auth!.userId,
      req.auth!.sessionId,
      requestContext(req),
    );

    res.status(200).json(
      successResponse(null, "Logout successful", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}

export async function logoutAllController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authenticationService.logoutAll(
      req.auth!.userId,
      req.auth!.sessionId,
      requestContext(req),
    );

    res.status(200).json(
      successResponse(
        null,
        "All other sessions were revoked",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = changePasswordSchema.parse(req.body);

    await authenticationService.changePassword(
      req.auth!.userId,
      req.auth!.sessionId,
      input,
      requestContext(req),
    );

    res.status(200).json(
      successResponse(
        null,
        "Password changed successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authenticationService.me(req.auth!.userId);

    res.status(200).json(
      successResponse(result, "User profile retrieved", req.requestId),
    );
  } catch (error) {
    next(error);
  }
}
