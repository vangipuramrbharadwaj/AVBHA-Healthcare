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
  errorCode: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
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
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
  };
}

export function errorResponse(
  message: string,
  errorCode: string,
  requestId?: string,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...(details !== undefined ? { details } : {}),
  };
}