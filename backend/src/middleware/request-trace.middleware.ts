import type {
  NextFunction,
  Request,
  Response,
} from "express";
import {
  normalizeRequestId,
  REQUEST_ID_HEADER,
} from "../shared/http/request-trace";

export function requestTraceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = normalizeRequestId(
    req.header(REQUEST_ID_HEADER),
  );

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}
