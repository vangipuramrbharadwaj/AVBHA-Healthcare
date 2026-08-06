import assert from "node:assert/strict";
import test from "node:test";
import {
  contrastSchema,
  createOrderSchema,
  createProcedureSchema,
  reportSchema,
  scheduleStudySchema,
  studyStatusSchema,
} from "./radiology.schema";

test("radiology procedure accepts CT modality", () => {
  const value = createProcedureSchema.parse({
    procedureCode: "CT-BRAIN",
    procedureName: "CT Brain",
    modality: "CT",
  });

  assert.equal(value.modality, "CT");
});

test("radiology order requires at least one procedure", () => {
  assert.throws(() =>
    createOrderSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      requestedProcedureIds: [],
    }),
  );
});

test("study schedule accepts valid date", () => {
  const value = scheduleStudySchema.parse({
    scheduledAt: "2026-08-07T10:30:00.000Z",
  });

  assert.ok(value.scheduledAt instanceof Date);
});

test("study status accepts completed", () => {
  const value = studyStatusSchema.parse({
    status: "COMPLETED",
  });

  assert.equal(value.status, "COMPLETED");
});

test("contrast administration accepts intravenous route", () => {
  const value = contrastSchema.parse({
    contrastName: "Iohexol",
    route: "INTRAVENOUS",
  });

  assert.equal(value.reactionObserved, false);
});

test("report defaults to draft", () => {
  const value = reportSchema.parse({
    findings: "No acute abnormality.",
  });

  assert.equal(value.status, "DRAFT");
});
