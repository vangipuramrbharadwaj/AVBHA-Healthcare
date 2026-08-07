import assert from "node:assert/strict";
import test from "node:test";
import {
  errorResponse,
  successResponse,
} from "./api-response";

test("success response contains standard envelope", () => {
  const result = successResponse(
    { id: "1" },
    "Created",
    "req-123",
  );

  assert.equal(result.success, true);
  assert.equal(result.message, "Created");
  assert.equal(result.requestId, "req-123");
  assert.deepEqual(result.data, { id: "1" });
  assert.equal(Number.isNaN(Date.parse(result.timestamp)), false);
});

test("error response contains standard envelope", () => {
  const result = errorResponse(
    "Invalid request",
    "VALIDATION_ERROR",
    "req-456",
    [{ field: "name" }],
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "VALIDATION_ERROR");
  assert.equal(result.requestId, "req-456");
  assert.deepEqual(result.details, [{ field: "name" }]);
});
