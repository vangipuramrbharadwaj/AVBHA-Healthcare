import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceSchema,
  cancelInvoiceSchema,
  invoiceSchema,
  paymentSchema,
  refundSchema,
  serviceCatalogSchema,
} from "./billing.schema";

test("service catalog accepts valid input", () => {
  const value = serviceCatalogSchema.parse({
    serviceCode: "CONS-GEN",
    serviceName: "General Consultation",
    moduleCode: "OPD",
    basePrice: 500,
  });

  assert.equal(value.discountAllowed, true);
});

test("invoice requires at least one item", () => {
  assert.throws(() =>
    invoiceSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      items: [],
    }),
  );
});

test("invoice calculates input defaults", () => {
  const value = invoiceSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    patientId: "22222222-2222-4222-8222-222222222222",
    items: [
      {
        description: "Consultation",
        unitPrice: 500,
      },
    ],
  });

  assert.equal(value.discountAmount, 0);
  assert.equal(value.roundOffAmount, 0);
  assert.equal(value.items[0]?.quantity, 1);
});

test("payment requires positive amount", () => {
  assert.throws(() =>
    paymentSchema.parse({
      paymentMode: "CASH",
      amount: 0,
    }),
  );
});

test("advance accepts UPI payment", () => {
  const value = advanceSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    patientId: "22222222-2222-4222-8222-222222222222",
    paymentMode: "UPI",
    amount: 1000,
  });

  assert.equal(value.paymentMode, "UPI");
});

test("refund requires a reason", () => {
  assert.throws(() =>
    refundSchema.parse({
      amount: 100,
      reason: "",
    }),
  );
});

test("invoice cancellation requires a reason", () => {
  assert.throws(() =>
    cancelInvoiceSchema.parse({
      reason: "",
    }),
  );
});
