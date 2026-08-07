import assert from "node:assert/strict";
import type {
  ApiCallResult,
  ApiEnvelope,
} from "./integration.client";

function asEnvelope(
  result: ApiCallResult,
): ApiEnvelope {
  assert.equal(
    typeof result.body,
    "object",
    "API response body must be an object",
  );
  assert.notEqual(
    result.body,
    null,
    "API response body must not be null",
  );

  return result.body as ApiEnvelope;
}

export function assertStandardEnvelope(
  result: ApiCallResult,
): ApiEnvelope {
  const body = asEnvelope(result);

  assert.equal(
    typeof body.success,
    "boolean",
    "Response must contain boolean success",
  );
  assert.equal(
    typeof body.message,
    "string",
    "Response must contain message",
  );
  assert.equal(
    typeof body.requestId,
    "string",
    "Response must contain requestId",
  );
  assert.equal(
    typeof body.timestamp,
    "string",
    "Response must contain timestamp",
  );
  assert.equal(
    Number.isNaN(Date.parse(body.timestamp ?? "")),
    false,
    "timestamp must be ISO-compatible",
  );

  const responseRequestId =
    result.headers.get("x-request-id");

  assert.equal(
    typeof responseRequestId,
    "string",
    "X-Request-ID response header is required",
  );

  assert.equal(
    responseRequestId,
    body.requestId,
    "Header and response request IDs must match",
  );

  return body;
}

export function assertSuccess(
  result: ApiCallResult,
  expectedStatus = 200,
): ApiEnvelope {
  assert.equal(result.status, expectedStatus);
  const body = assertStandardEnvelope(result);
  assert.equal(body.success, true);
  return body;
}

export function assertError(
  result: ApiCallResult,
  acceptedStatuses: number[],
): ApiEnvelope {
  assert.ok(
    acceptedStatuses.includes(result.status),
    `Expected one of ${acceptedStatuses.join(", ")} but received ${result.status}: ${result.rawText}`,
  );

  const body = assertStandardEnvelope(result);
  assert.equal(body.success, false);
  assert.equal(
    typeof body.code,
    "string",
    "Error response must include code",
  );
  return body;
}
