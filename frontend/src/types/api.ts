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

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    if (requestId !== undefined) this.requestId = requestId;
    if (details !== undefined) this.details = details;
  }
}
