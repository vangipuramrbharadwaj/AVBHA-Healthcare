import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPeriodKey,
  formatDocumentNumber,
} from "./document-sequence.service";

test("year period key is generated correctly", () => {
  const date = new Date(2026, 7, 7, 10, 30, 0);
  assert.equal(buildPeriodKey("YEAR", date), "2026");
});

test("month period key is generated correctly", () => {
  const date = new Date(2026, 7, 7, 10, 30, 0);
  assert.equal(buildPeriodKey("MONTH", date), "202608");
});

test("date period key is generated correctly", () => {
  const date = new Date(2026, 7, 7, 10, 30, 0);
  assert.equal(buildPeriodKey("DATE", date), "20260807");
});

test("global period key is generated correctly", () => {
  const date = new Date(2026, 7, 7, 10, 30, 0);
  assert.equal(buildPeriodKey("NONE", date), "GLOBAL");
});

test("year-based document number is formatted correctly", () => {
  assert.equal(
    formatDocumentNumber("UHID", "2026", 42n, 6),
    "UHID-2026-000042",
  );
});

test("global document number is formatted correctly", () => {
  assert.equal(
    formatDocumentNumber("EMP", "GLOBAL", 7n, 6),
    "EMP-000007",
  );
});
