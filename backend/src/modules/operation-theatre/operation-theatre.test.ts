import assert from "node:assert/strict";
import test from "node:test";
import {
  anaesthesiaAssessmentSchema,
  bookingSchema,
  checklistSchema,
  complicationSchema,
  consentSchema,
  procedureSchema,
  recoverySchema,
  roomSchema,
} from "./operation-theatre.schema";

test("OT room schema accepts valid input", () => {
  const value = roomSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    roomCode: "OT-01",
    roomName: "Main Operation Theatre",
  });

  assert.equal(value.roomCode, "OT-01");
});

test("OT procedure schema accepts valid input", () => {
  const value = procedureSchema.parse({
    procedureCode: "APPEN",
    procedureName: "Appendectomy",
    estimatedMinutes: 90,
  });

  assert.equal(value.estimatedMinutes, 90);
});

test("OT booking rejects invalid schedule", () => {
  assert.throws(() =>
    bookingSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      otRoomId: "33333333-3333-4333-8333-333333333333",
      procedureId: "44444444-4444-4444-8444-444444444444",
      scheduledStart: "2026-08-07T10:00:00.000Z",
      scheduledEnd: "2026-08-07T09:00:00.000Z",
      primarySurgeonId: "55555555-5555-4555-8555-555555555555",
    }),
  );
});

test("checklist defaults to pending", () => {
  const value = checklistSchema.parse({
    phase: "SIGN_IN",
    itemCode: "IDENTITY",
    itemLabel: "Patient identity confirmed",
  });

  assert.equal(value.status, "PENDING");
});

test("consent accepts signed state", () => {
  const value = consentSchema.parse({
    consentType: "SURGERY",
    consented: true,
  });

  assert.equal(value.consented, true);
});

test("anaesthesia assessment defaults are applied", () => {
  const value = anaesthesiaAssessmentSchema.parse({
    anaesthesiaType: "GENERAL",
  });

  assert.equal(value.fastingConfirmed, false);
  assert.equal(value.fitForAnaesthesia, false);
});

test("recovery validates SPO2", () => {
  assert.throws(() =>
    recoverySchema.parse({
      spo2: 120,
    }),
  );
});

test("critical complication is accepted", () => {
  const value = complicationSchema.parse({
    complicationType: "BLEEDING",
    severity: "CRITICAL",
    description: "Major intraoperative bleeding",
  });

  assert.equal(value.severity, "CRITICAL");
});
