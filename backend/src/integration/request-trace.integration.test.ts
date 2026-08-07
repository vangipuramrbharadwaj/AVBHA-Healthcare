import assert from "node:assert/strict";
import test from "node:test";
import { apiCall } from "./integration.client";
import {
  assertStandardEnvelope,
  assertSuccess,
} from "./integration.assertions";

test("valid incoming request ID is preserved end-to-end", async () => {
  const requestId = "e2e-avbha-11-5-001";
  const result = await apiCall("/api/v1/live", {
    requestId,
  });

  const body = assertSuccess(result);

  assert.equal(
    result.headers.get("x-request-id"),
    requestId,
  );
  assert.equal(body.requestId, requestId);
});

test("invalid incoming request ID is replaced", async () => {
  const result = await apiCall("/api/v1/live", {
    requestId: "invalid request id with spaces",
  });

  const body = assertStandardEnvelope(result);

  assert.equal(result.status, 200);
  assert.notEqual(
    result.headers.get("x-request-id"),
    "invalid request id with spaces",
  );
  assert.notEqual(
    body.requestId,
    "invalid request id with spaces",
  );
});
