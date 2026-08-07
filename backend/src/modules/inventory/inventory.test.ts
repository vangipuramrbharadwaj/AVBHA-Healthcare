import assert from "node:assert/strict";
import test from "node:test";
import {
  createGoodsReceiptSchema,
  createInventoryItemSchema,
  createMaterialRequestSchema,
  createPurchaseOrderSchema,
  createTransferSchema,
  stockAdjustmentSchema,
} from "./inventory.schema";

test("inventory item schema applies tracking defaults", () => {
  const result = createInventoryItemSchema.parse({
    itemCode: "glove-nit-m",
    itemName: "Nitrile Gloves Medium",
    unitOfMeasure: "box",
  });

  assert.equal(result.itemCode, "GLOVE-NIT-M");
  assert.equal(result.unitOfMeasure, "BOX");
  assert.equal(result.trackBatch, false);
  assert.equal(result.trackExpiry, false);
});

test("purchase order requires at least one item", () => {
  assert.throws(() =>
    createPurchaseOrderSchema.parse({
      supplierId: "00000000-0000-0000-0000-000000000001",
      destinationStoreId: "00000000-0000-0000-0000-000000000002",
      items: [],
    }),
  );
});

test("goods receipt validates accepted and rejected quantities", () => {
  assert.throws(() =>
    createGoodsReceiptSchema.parse({
      purchaseOrderId: "00000000-0000-0000-0000-000000000001",
      storeId: "00000000-0000-0000-0000-000000000002",
      items: [{
        purchaseOrderItemId: "00000000-0000-0000-0000-000000000003",
        itemId: "00000000-0000-0000-0000-000000000004",
        receivedQuantity: 10,
        acceptedQuantity: 9,
        rejectedQuantity: 2,
      }],
    }),
  );
});

test("material request requires at least one item", () => {
  assert.throws(() =>
    createMaterialRequestSchema.parse({
      fromStoreId: "00000000-0000-0000-0000-000000000001",
      items: [],
    }),
  );
});

test("stock adjustment rejects zero quantity", () => {
  assert.throws(() =>
    stockAdjustmentSchema.parse({
      storeId: "00000000-0000-0000-0000-000000000001",
      itemId: "00000000-0000-0000-0000-000000000002",
      quantity: 0,
      direction: "IN",
    }),
  );
});

test("inventory transfer requires different stores", () => {
  const store = "00000000-0000-0000-0000-000000000001";
  assert.throws(() =>
    createTransferSchema.parse({
      fromStoreId: store,
      toStoreId: store,
      items: [{
        itemId: "00000000-0000-0000-0000-000000000002",
        quantity: 1,
      }],
    }),
  );
});
