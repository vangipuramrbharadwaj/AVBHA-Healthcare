import { integrationConfig } from "./integration.config";

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  requestId?: string;
  timestamp?: string;
  details?: unknown;
}

export interface ApiCallOptions {
  method?: string;
  token?: string;
  requestId?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiCallResult<T = unknown> {
  status: number;
  headers: Headers;
  body: ApiEnvelope<T> | unknown;
  rawText: string;
}

export async function apiCall<T = unknown>(
  path: string,
  options: ApiCallOptions = {},
): Promise<ApiCallResult<T>> {
  const config = integrationConfig();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token !== undefined) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.requestId !== undefined) {
    headers["X-Request-ID"] = options.requestId;
  }

  const response = await fetch(
    `${config.baseUrl}${path}`,
    {
      method: options.method ?? "GET",
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    },
  );

  const rawText = await response.text();

  let body: unknown = rawText;
  if (rawText.length > 0) {
    try {
      body = JSON.parse(rawText) as unknown;
    } catch {
      body = rawText;
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    body,
    rawText,
  };
}
