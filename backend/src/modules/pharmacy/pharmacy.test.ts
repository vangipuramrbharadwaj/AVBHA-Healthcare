import assert from "node:assert/strict";
import test from "node:test";
import {
  batchSchema,
  dispenseSchema,
  goodsReceiptSchema,
  medicineSchema,
  purchaseOrderSchema,
  saleSchema,
  stockAdjustmentSchema,
  supplierSchema,
} from "./pharmacy.schema";

test("supplier schema accepts valid input", () => {
  const value = supplierSchema.parse({
    supplierCode: "SUP-001",
    supplierName: "ABC Pharma Distributors",
  });
  assert.equal(value.supplierCode, "SUP-001");
});

test("medicine schema applies defaults", () => {
  const value = medicineSchema.parse({
    medicineCode: "MED-001",
    brandName: "Paracetamol 500",
  });
  assert.equal(value.controlledDrug, false);
  assert.equal(value.requiresPrescription, true);
});

test("batch schema accepts valid stock", () => {
  const value = batchSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    medicineId: "22222222-2222-4222-8222-222222222222",
    batchNumber: "BATCH-01",
    expiryDate: "2027-12-31",
    purchasePrice: 10,
    sellingPrice: 15,
    availableQuantity: 100,
  });
  assert.equal(value.availableQuantity, 100);
});

test("purchase order requires items", () => {
  assert.throws(() =>
    purchaseOrderSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      supplierId: "22222222-2222-4222-8222-222222222222",
      items: [],
    }),
  );
});

test("goods receipt requires batches", () => {
  assert.throws(() =>
    goodsReceiptSchema.parse({
      batches: [],
    }),
  );
});

test("sale requires at least one item", () => {
  assert.throws(() =>
    saleSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      amountPaid: 0,
      items: [],
    }),
  );
});

test("dispense requires at least one item", () => {
  assert.throws(() =>
    dispenseSchema.parse({
      branchId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      items: [],
    }),
  );
});

test("stock adjustment accepts purchase type", () => {
  const value = stockAdjustmentSchema.parse({
    branchId: "11111111-1111-4111-8111-111111111111",
    medicineId: "22222222-2222-4222-8222-222222222222",
    batchId: "33333333-3333-4333-8333-333333333333",
    transactionType: "PURCHASE",
    quantity: 50,
  });
  assert.equal(value.transactionType, "PURCHASE");
});
