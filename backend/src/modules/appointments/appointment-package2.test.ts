import assert from "node:assert/strict";
import test from "node:test";
import {
  createBreakSchema,
  createHolidaySchema,
  createScheduleSchema,
  lockSlotSchema,
} from "./appointment-schedule.schema";

test("doctor schedule accepts valid input", () => {
  const value = createScheduleSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    doctorId: "22222222-2222-4222-8222-222222222222",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    effectiveFrom: "2026-08-01",
  });

  assert.equal(value.slotDuration, 15);
});

test("doctor schedule rejects invalid hours", () => {
  assert.throws(() =>
    createScheduleSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      doctorId: "22222222-2222-4222-8222-222222222222",
      dayOfWeek: 1,
      startTime: "17:00",
      endTime: "09:00",
      effectiveFrom: "2026-08-01",
    }),
  );
});

test("break rejects invalid hours", () => {
  assert.throws(() =>
    createBreakSchema.parse({
      breakName: "Lunch",
      startTime: "14:00",
      endTime: "13:00",
    }),
  );
});

test("partial holiday requires times", () => {
  assert.throws(() =>
    createHolidaySchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      doctorId: "22222222-2222-4222-8222-222222222222",
      holidayDate: "2026-08-15",
      allDay: false,
    }),
  );
});

test("slot lock defaults to five minutes", () => {
  const value = lockSlotSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    doctorId: "22222222-2222-4222-8222-222222222222",
    slotStart: "2026-08-10T09:00:00.000Z",
    slotEnd: "2026-08-10T09:15:00.000Z",
  });

  assert.equal(value.lockMinutes, 5);
});
