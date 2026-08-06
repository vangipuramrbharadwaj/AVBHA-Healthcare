import assert from "node:assert/strict";
import test from "node:test";
import {
  clinicalOrderSchema,
  consultationSchema,
  createVisitSchema,
  diagnosisSchema,
  prescriptionSchema,
  vitalsSchema,
} from "./opd.schema";

test("OPD visit schema accepts valid input", () => {
  const value = createVisitSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    departmentId: "22222222-2222-4222-8222-222222222222",
    doctorId: "33333333-3333-4333-8333-333333333333",
    patientId: "44444444-4444-4444-8444-444444444444",
  });
  assert.equal(value.visitType, "NEW");
});

test("vitals validate SPO2", () => {
  const value = vitalsSchema.parse({ spo2: 98 });
  assert.equal(value.spo2, 98);
});

test("consultation defaults to in progress", () => {
  const value = consultationSchema.parse({});
  assert.equal(value.status, "IN_PROGRESS");
});

test("diagnosis accepts valid input", () => {
  const value = diagnosisSchema.parse({
    diagnosisName: "Viral fever",
  });
  assert.equal(value.diagnosisType, "PROVISIONAL");
});

test("prescription requires medicine", () => {
  assert.throws(() => prescriptionSchema.parse({ items: [] }));
});

test("clinical order accepts laboratory", () => {
  const value = clinicalOrderSchema.parse({
    orderType: "LABORATORY",
    orderName: "Complete Blood Count",
  });
  assert.equal(value.priority, "NORMAL");
});
