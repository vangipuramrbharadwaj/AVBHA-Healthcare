import assert from "node:assert/strict";
import test from "node:test";
import {
  queueActionNotesSchema,
  queueDashboardQuerySchema,
} from "./appointment-queue-actions.schema";

test("queue action accepts optional notes", () => {
  const value = queueActionNotesSchema.parse({
    notes: "Patient requested a short hold",
  });

  assert.equal(
    value.notes,
    "Patient requested a short hold",
  );
});

test("queue action accepts an empty body", () => {
  const value = queueActionNotesSchema.parse({});

  assert.equal(value.notes, undefined);
});

test("queue dashboard accepts a date filter", () => {
  const value = queueDashboardQuerySchema.parse({
    date: "2026-08-07",
  });

  assert.ok(value.date instanceof Date);
});
