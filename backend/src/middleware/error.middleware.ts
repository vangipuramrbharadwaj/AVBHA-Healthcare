import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../shared/errors/app-error";
import { errorResponse } from "../shared/http/api-response";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json(
    errorResponse(
      `Route ${req.method} ${req.originalUrl} was not found`,
      "ROUTE_NOT_FOUND",
      req.requestId,
    ),
  );
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  logger.error(
    {
      error,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    },
    "Request failed",
  );

  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      errorResponse(
        error.message,
        error.errorCode,
        req.requestId,
        error.details,
      ),
    );

    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json(
        errorResponse(
          "A record with the same unique value already exists",
          "DUPLICATE_RECORD",
          req.requestId,
          env.NODE_ENV === "development" ? error.meta : undefined,
        ),
      );

      return;
    }

    if (error.code === "P2025") {
      res.status(404).json(
        errorResponse(
          "The requested record was not found",
          "RECORD_NOT_FOUND",
          req.requestId,
        ),
      );

      return;
    }
  }

  res.status(500).json(
    errorResponse(
      "An unexpected server error occurred",
      "INTERNAL_SERVER_ERROR",
      req.requestId,
      env.NODE_ENV === "development"
        ? {
            message: error instanceof Error ? error.message : String(error),
          }
        : undefined,
    ),
  );
};