import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./appointments.schema";
import { APPOINTMENT_PERMISSIONS } from "./appointments.permissions";

test("appointment schema accepts valid input", () => {
  const value = createAppointmentSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    departmentId: "22222222-2222-4222-8222-222222222222",
    patientId: "33333333-3333-4333-8333-333333333333",
    doctorId: "44444444-4444-4444-8444-444444444444",
    appointmentDate: "2026-08-07",
    startTime: "2026-08-07T10:00:00.000Z",
    endTime: "2026-08-07T10:15:00.000Z",
  });
  assert.equal(value.status, "BOOKED");
  assert.equal(value.durationMinutes, 15);
});

test("cancellation requires reason", () => {
  assert.throws(() => cancelAppointmentSchema.parse({}));
});

test("reschedule rejects end before start", () => {
  assert.throws(() =>
    rescheduleAppointmentSchema.parse({
      appointmentDate: "2026-08-07",
      startTime: "2026-08-07T11:00:00.000Z",
      endTime: "2026-08-07T10:00:00.000Z",
    }),
  );
});

test("cancel and reschedule use existing seeded update permission", () => {
  assert.equal(APPOINTMENT_PERMISSIONS.CANCEL, "appointments.update");
  assert.equal(APPOINTMENT_PERMISSIONS.RESCHEDULE, "appointments.update");
});
