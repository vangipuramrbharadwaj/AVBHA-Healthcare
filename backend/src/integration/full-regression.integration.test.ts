import assert from "node:assert/strict";
import test from "node:test";
import { apiCall } from "./integration.client";
import {
  assertStandardEnvelope,
  assertSuccess,
} from "./integration.assertions";

test("backend readiness chain succeeds", async () => {
  const live = await apiCall("/api/v1/live");
  assertSuccess(live);

  const ready = await apiCall("/api/v1/ready");
  const readyBody = assertSuccess(ready);

  assert.equal(
    (readyBody.data as { status?: string }).status,
    "ready",
  );

  const database = await apiCall(
    "/api/v1/database",
  );
  const databaseBody = assertSuccess(database);

  assert.equal(
    (
      databaseBody.data as {
        status?: string;
      }
    ).status,
    "connected",
  );

  const health = await apiCall("/api/v1/health");
  const healthBody = assertStandardEnvelope(health);

  assert.equal(health.status, 200);
  assert.equal(healthBody.success, true);
});
