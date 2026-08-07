import { appConfig } from "../config/env";
import { ApiClientError, type ApiErrorResponse, type ApiSuccessResponse } from "../types/api";
import { clearSession, loadSession, saveSession } from "../utils/storage";
import type { RefreshResponse } from "../types/auth";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

function requestHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-ID", crypto.randomUUID());

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const session = loadSession();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
      headers.set("X-Hospital-ID", session.user.hospitalId);
      if (session.user.branchId) {
        headers.set("X-Branch-ID", session.user.branchId);
      }
    }
  }

  return headers;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError(
      "The server returned an unreadable response",
      response.status,
      "INVALID_SERVER_RESPONSE",
      response.headers.get("x-request-id") ?? undefined,
    );
  }
}

function notifySessionExpired(): void {
  window.dispatchEvent(new CustomEvent("avbha:session-expired"));
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = loadSession();
    if (!session?.refreshToken) return false;

    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Request-ID": crypto.randomUUID(),
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      const payload = (await parseJson(response)) as
        | ApiSuccessResponse<RefreshResponse>
        | ApiErrorResponse;

      if (!response.ok || !payload || payload.success !== true) {
        clearSession();
        notifySessionExpired();
        return false;
      }

      saveSession({
        ...session,
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      });
      return true;
    } catch {
      clearSession();
      notifySessionExpired();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth: _auth, retryOnUnauthorized: _retry, ...requestInit } = options;

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...requestInit,
    headers: requestHeaders(options),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (
    response.status === 401 &&
    options.auth !== false &&
    options.retryOnUnauthorized !== false
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  const payload = (await parseJson(response)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success !== true) {
    const errorPayload = payload && payload.success === false ? payload : null;
    throw new ApiClientError(
      errorPayload?.message ?? `Request failed with HTTP ${response.status}`,
      response.status,
      errorPayload?.code ?? "HTTP_ERROR",
      errorPayload?.requestId ?? response.headers.get("x-request-id") ?? undefined,
      errorPayload?.details,
    );
  }

  return payload.data;
}
