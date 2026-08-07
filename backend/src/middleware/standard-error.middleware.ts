import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { errorResponse } from "../shared/http/api-response";

type ErrorLike = Error & {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: unknown;
  errors?: unknown;
};

function normalizeStatus(error: ErrorLike): number {
  const candidate = error.statusCode ?? error.status;

  if (
    typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= 400 &&
    candidate <= 599
  ) {
    return candidate;
  }

  return 500;
}

function mapPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  switch (error.code) {
    case "P2002":
      return {
        status: 409,
        code: "DUPLICATE_RECORD",
        message: "A record with the same unique value already exists",
        details: error.meta,
      };

    case "P2003":
      return {
        status: 409,
        code: "FOREIGN_KEY_CONSTRAINT",
        message: "The requested operation conflicts with related data",
        details: error.meta,
      };

    case "P2025":
      return {
        status: 404,
        code: "RECORD_NOT_FOUND",
        message: "The requested record was not found",
        details: error.meta,
      };

    default:
      return {
        status: 500,
        code: "DATABASE_ERROR",
        message: "A database operation failed",
      };
  }
}

export function standardErrorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (error instanceof ZodError) {
    res.status(400).json(
      errorResponse(
        "Request validation failed",
        "VALIDATION_ERROR",
        requestId,
        error.issues,
      ),
    );
    return;
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    const mapped = mapPrismaError(error);

    res.status(mapped.status).json(
      errorResponse(
        mapped.message,
        mapped.code,
        requestId,
        mapped.details,
      ),
    );
    return;
  }

  if (error instanceof Error) {
    const typed = error as ErrorLike;
    const status = normalizeStatus(typed);

    const code =
      typeof typed.code === "string" &&
      typed.code.length > 0
        ? typed.code
        : status >= 500
          ? "INTERNAL_SERVER_ERROR"
          : "REQUEST_FAILED";

    const message =
      status >= 500
        ? "An unexpected server error occurred"
        : typed.message;

    if (status >= 500) {
      console.error(
        JSON.stringify({
          level: "error",
          requestId,
          method: req.method,
          path: req.originalUrl,
          errorName: typed.name,
          errorMessage: typed.message,
          stack: typed.stack,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    res.status(status).json(
      errorResponse(
        message,
        code,
        requestId,
        typed.details ?? typed.errors,
      ),
    );
    return;
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      method: req.method,
      path: req.originalUrl,
      error: String(error),
      timestamp: new Date().toISOString(),
    }),
  );

  res.status(500).json(
    errorResponse(
      "An unexpected server error occurred",
      "INTERNAL_SERVER_ERROR",
      requestId,
    ),
  );
}
