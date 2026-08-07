import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { successResponse } from "../../shared/http/api-response";
import * as service from "./system-health.service";

export async function healthController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.health();

    res.status(
      result.status === "healthy" ? 200 : 503,
    ).json(
      successResponse(
        result,
        result.status === "healthy"
          ? "AVBHA Healthcare API is healthy"
          : "AVBHA Healthcare API is degraded",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export function liveController(
  req: Request,
  res: Response,
): void {
  res.status(200).json(
    successResponse(
      service.liveness(),
      "AVBHA Healthcare API is alive",
      req.requestId,
    ),
  );
}

export async function readyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.readiness();

    res.status(
      result.status === "ready" ? 200 : 503,
    ).json(
      successResponse(
        result,
        result.status === "ready"
          ? "AVBHA Healthcare API is ready"
          : "AVBHA Healthcare API is not ready",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function databaseController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.databaseStatus();

    res.status(
      result.status === "connected" ? 200 : 503,
    ).json(
      successResponse(
        result,
        result.status === "connected"
          ? "Database is connected"
          : "Database is unavailable",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export function versionController(
  req: Request,
  res: Response,
): void {
  res.status(200).json(
    successResponse(
      service.versionInfo(),
      "Application version retrieved successfully",
      req.requestId,
    ),
  );
}

export async function monitoringController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.monitoring();

    res.status(
      result.database.status === "connected"
        ? 200
        : 503,
    ).json(
      successResponse(
        result,
        "Runtime monitoring information retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
