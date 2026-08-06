import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = req.header("x-request-id");

  const requestId =
    incomingRequestId && incomingRequestId.length <= 100
      ? incomingRequestId
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}