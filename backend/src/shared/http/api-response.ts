export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  requestId?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  requestId?: string;
  timestamp: string;
  details?: unknown;
}

export function successResponse<T>(
  data: T,
  message = "Request completed successfully",
  requestId?: string,
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(requestId !== undefined ? { requestId } : {}),
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(
  message: string,
  code = "INTERNAL_SERVER_ERROR",
  requestId?: string,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    message,
    code,
    ...(requestId !== undefined ? { requestId } : {}),
    timestamp: new Date().toISOString(),
    ...(details !== undefined ? { details } : {}),
  };
}
