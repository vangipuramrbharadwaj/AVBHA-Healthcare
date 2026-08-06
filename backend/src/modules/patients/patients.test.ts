import assert from "node:assert/strict";
import test from "node:test";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

test("patient permissions remain stable", () => {
  assert.equal(PATIENT_PERMISSIONS.VIEW, "patients.view");
  assert.equal(PATIENT_PERMISSIONS.CREATE, "patients.create");
});
