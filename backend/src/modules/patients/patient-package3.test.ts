import assert from "node:assert/strict";
import test from "node:test";
import {
  createFamilyRelationshipSchema,
  createIdentifierSchema,
  createMergeRequestSchema,
  createPatientAlertSchema,
} from "./patient-package3.schema";
import { PATIENT_PERMISSIONS } from "./patients.permissions";

test("family relationship schema accepts valid data", () => {
  const value = createFamilyRelationshipSchema.parse({
    relatedPatientId: "11111111-1111-4111-8111-111111111111",
    relationshipType: "SPOUSE",
  });
  assert.equal(value.relationshipType, "SPOUSE");
});

test("critical patient alert is accepted", () => {
  const value = createPatientAlertSchema.parse({
    alertType: "CLINICAL",
    title: "Severe penicillin allergy",
    severity: "CRITICAL",
  });
  assert.equal(value.severity, "CRITICAL");
});

test("merge request schema accepts valid references", () => {
  const value = createMergeRequestSchema.parse({
    sourcePatientId: "11111111-1111-4111-8111-111111111111",
    targetPatientId: "22222222-2222-4222-8222-222222222222",
    reason: "Duplicate registration",
  });
  assert.equal(value.reason, "Duplicate registration");
});

test("QR identifier schema accepts valid data", () => {
  const value = createIdentifierSchema.parse({
    identifierType: "QR",
    identifierValue: "AVBHA-QR-0001",
  });
  assert.equal(value.identifierType, "QR");
});

test("merge approval permission exists", () => {
  assert.equal(PATIENT_PERMISSIONS.APPROVE, "patients.approve");
});
