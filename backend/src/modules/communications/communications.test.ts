import assert from "node:assert/strict";
import test from "node:test";
import { CommunicationChannel } from "@prisma/client";
import {
  preferenceSchema,
  sendSchema,
  templateSchema,
} from "./communications.schema";

test("template schema supports in-app notifications", () => {
  const result = templateSchema.parse({
    code: "appointment_booked",
    name: "Appointment booked",
    channel: CommunicationChannel.IN_APP,
    bodyTemplate: "Hello {{name}}",
  });

  assert.equal(result.code, "APPOINTMENT_BOOKED");
  assert.equal(result.active, true);
});

test("communication requires recipient", () => {
  assert.equal(
    sendSchema.safeParse({
      channel: CommunicationChannel.IN_APP,
      body: "Hello",
    }).success,
    false,
  );
});

test("communication requires body or template", () => {
  assert.equal(
    sendSchema.safeParse({
      channel: CommunicationChannel.IN_APP,
      recipientUserId: "11111111-1111-4111-8111-111111111111",
    }).success,
    false,
  );
});

test("communication preference validates", () => {
  const result = preferenceSchema.parse({
    channel: CommunicationChannel.EMAIL,
    eventType: "APPOINTMENT_BOOKED",
    enabled: false,
  });

  assert.equal(result.enabled, false);
});
