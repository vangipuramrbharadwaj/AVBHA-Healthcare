import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

export function normalizeRequestId(value: unknown): string {
  if (typeof value !== "string") {
    return randomUUID();
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > 128 ||
    !/^[A-Za-z0-9._:-]+$/.test(trimmed)
  ) {
    return randomUUID();
  }

  return trimmed;
}
