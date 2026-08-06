import assert from "node:assert/strict";
import test from "node:test";
import {
  createAllergySchema,
  createInsuranceSchema,
} from "./patient-clinical.schema";

test("insurance schema accepts valid input", () => {
  const result = createInsuranceSchema.parse({
    providerName: "Example Insurance",
    policyNumber: "POL-001",
  });

  assert.equal(result.providerName, "Example Insurance");
  assert.equal(result.isPrimary, false);
});

test("allergy requires an allergen", () => {
  assert.throws(() => createAllergySchema.parse({}));
});
