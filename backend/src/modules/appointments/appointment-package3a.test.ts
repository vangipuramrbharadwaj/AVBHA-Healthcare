import assert from "node:assert/strict";
import test from "node:test";
import {
  createQueueEntrySchema,
  createQueueSchema,
} from "./appointment-queue.schema";

test("queue schema accepts valid input", () => {
  const value = createQueueSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    departmentId: "22222222-2222-4222-8222-222222222222",
    doctorId: "33333333-3333-4333-8333-333333333333",
    queueDate: "2026-08-07",
    queueCode: "CARD-01",
  });

  assert.equal(value.tokenPrefix, "A");
});

test("queue entry defaults correctly", () => {
  const value = createQueueEntrySchema.parse({
    queueId: "11111111-1111-4111-8111-111111111111",
    patientId: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(value.priority, "NORMAL");
  assert.equal(value.source, "APPOINTMENT");
});
