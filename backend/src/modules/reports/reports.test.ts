import assert from "node:assert/strict";
import test from "node:test";
import { dailyMisQuerySchema, reportQuerySchema } from "./reports.schema";
import { REPORT_PERMISSIONS } from "./reports.permissions";

test("report query accepts a valid date range", () => {
  const result = reportQuerySchema.parse({
    from: "2026-08-01",
    to: "2026-08-07",
  });

  assert.ok(result.from instanceof Date);
  assert.ok(result.to instanceof Date);
});

test("report query rejects reverse date range", () => {
  assert.equal(
    reportQuerySchema.safeParse({
      from: "2026-08-07",
      to: "2026-08-01",
    }).success,
    false,
  );
});

test("report query rejects more than 366 days", () => {
  assert.equal(
    reportQuerySchema.safeParse({
      from: "2025-01-01",
      to: "2026-08-01",
    }).success,
    false,
  );
});

test("daily MIS defaults date", () => {
  const result = dailyMisQuerySchema.parse({});
  assert.ok(result.date instanceof Date);
});

test("reports use existing seeded permission codes", () => {
  assert.equal(REPORT_PERMISSIONS.VIEW, "reports.view");
  assert.equal(REPORT_PERMISSIONS.EXPORT, "reports.export");
  assert.equal(REPORT_PERMISSIONS.PRINT, "reports.print");
});
