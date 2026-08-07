import assert from "node:assert/strict";
import test from "node:test";
import {
  liveness,
  versionInfo,
} from "./system-health.service";

test("liveness reports application alive", () => {
  const result = liveness();

  assert.equal(result.status, "alive");
  assert.equal(
    result.application,
    "AVBHA Healthcare HMS",
  );
  assert.ok(result.uptimeSeconds >= 0);
});

test("version endpoint exposes safe runtime metadata", () => {
  const result = versionInfo();

  assert.equal(
    result.application,
    "AVBHA Healthcare HMS",
  );
  assert.ok(result.version.length > 0);
  assert.ok(result.nodeVersion.startsWith("v"));
  assert.ok(result.environment.length > 0);
});
