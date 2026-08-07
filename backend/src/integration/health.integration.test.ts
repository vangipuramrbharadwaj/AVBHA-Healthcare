import assert from "node:assert/strict";
import test from "node:test";
import { apiCall } from "./integration.client";
import {
  assertStandardEnvelope,
  assertSuccess,
} from "./integration.assertions";

const endpoints = [
  "/api/v1/live",
  "/api/v1/health",
  "/api/v1/ready",
  "/api/v1/database",
  "/api/v1/version",
  "/api/v1/monitoring",
];

for (const endpoint of endpoints) {
  test(`health endpoint ${endpoint} responds successfully`, async () => {
    const result = await apiCall(endpoint);
    assertSuccess(result);
  });
}

test("health endpoints include security headers", async () => {
  const result = await apiCall("/api/v1/live");

  assert.equal(result.status, 200);
  assertStandardEnvelope(result);

  assert.equal(
    result.headers.get("x-content-type-options"),
    "nosniff",
  );
  assert.ok(
    result.headers.get("x-frame-options") !== null,
  );
  assert.ok(
    result.headers.get("content-security-policy") !== null,
  );
});
