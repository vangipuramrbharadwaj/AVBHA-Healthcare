import assert from "node:assert/strict";
import test from "node:test";
import {
  admissionSchema,
  bedSchema,
  dischargeSchema,
  intakeOutputSchema,
  nursingSchema,
  vitalsSchema,
} from "./ipd.schema";

test("IPD admission accepts valid input", () => {
  const value = admissionSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    departmentId: "22222222-2222-4222-8222-222222222222",
    doctorId: "33333333-3333-4333-8333-333333333333",
    patientId: "44444444-4444-4444-8444-444444444444",
  });

  assert.equal(value.admissionType, "ELECTIVE");
});

test("bed schema accepts valid input", () => {
  const value = bedSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    roomId: "22222222-2222-4222-8222-222222222222",
    bedCode: "B-101",
    bedName: "Bed 101",
    bedType: "GENERAL",
  });

  assert.equal(value.bedType, "GENERAL");
});

test("nursing note requires note text", () => {
  assert.throws(() =>
    nursingSchema.parse({
      noteType: "GENERAL",
      note: "",
    }),
  );
});

test("IPD vitals validate SPO2", () => {
  assert.equal(vitalsSchema.parse({ spo2: 97 }).spo2, 97);
});

test("intake/output accepts quantity", () => {
  const value = intakeOutputSchema.parse({
    recordType: "INTAKE",
    category: "Oral fluids",
    quantityMl: 250,
  });

  assert.equal(value.quantityMl, 250);
});

test("discharge requires final diagnosis", () => {
  assert.throws(() =>
    dischargeSchema.parse({
      dischargeType: "NORMAL",
      finalDiagnosis: "",
    }),
  );
});
