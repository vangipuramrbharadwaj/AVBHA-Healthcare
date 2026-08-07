import type {
  NextFunction,
  Request,
  Response,
} from "express";

interface RouteNotFoundError extends Error {
  statusCode: number;
  code: string;
}

export function standardNotFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const error = new Error(
    `Route ${req.method} ${req.originalUrl} was not found`,
  ) as RouteNotFoundError;

  error.statusCode = 404;
  error.code = "ROUTE_NOT_FOUND";

  next(error);
}
