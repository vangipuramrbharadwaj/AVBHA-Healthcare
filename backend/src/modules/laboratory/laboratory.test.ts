import assert from "node:assert/strict";
import test from "node:test";
import {
  collectSampleSchema,
  createOrderSchema,
  createTestSchema,
  resultEntrySchema,
  resultStatusSchema,
} from "./laboratory.schema";

test("laboratory test accepts parameters", () => {
  const value = createTestSchema.parse({
    testCode: "CBC",
    testName: "Complete Blood Count",
    sampleType: "Blood",
    parameters: [
      {
        parameterCode: "HB",
        parameterName: "Hemoglobin",
      },
    ],
  });

  assert.equal(value.parameters.length, 1);
});

test("laboratory order requires test IDs", () => {
  assert.throws(() =>
    createOrderSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      testIds: [],
    }),
  );
});

test("sample collection accepts empty body", () => {
  assert.equal(collectSampleSchema.parse({}).barcode, undefined);
});

test("result entry requires values", () => {
  assert.throws(() =>
    resultEntrySchema.parse({
      values: [],
    }),
  );
});

test("verified status is accepted", () => {
  assert.equal(
    resultStatusSchema.parse({ status: "VERIFIED" }).status,
    "VERIFIED",
  );
});
