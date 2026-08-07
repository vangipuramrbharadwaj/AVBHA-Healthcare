import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRequestId } from "./request-trace";

test("valid request ID is preserved", () => {
  assert.equal(
    normalizeRequestId("avbha-request-123"),
    "avbha-request-123",
  );
});

test("invalid request ID is replaced", () => {
  const value = normalizeRequestId("invalid request id");
  assert.notEqual(value, "invalid request id");
  assert.ok(value.length > 0);
});

test("missing request ID is generated", () => {
  const value = normalizeRequestId(undefined);
  assert.ok(value.length > 0);
});
