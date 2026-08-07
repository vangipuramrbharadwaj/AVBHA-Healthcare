import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const required = [
  "src/modules/inventory/inventory.controller.ts",
  "src/modules/inventory/inventory.routes.ts",
  "src/modules/inventory/inventory.repository.ts",
  "src/modules/inventory/inventory.service.ts",
  "src/modules/inventory/inventory.schema.ts",
  "src/modules/inventory/inventory.permissions.ts",
  "src/modules/inventory/inventory.test.ts",
];

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    throw new Error(`Phase 12 required file is missing or empty: ${file}`);
  }
}

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");

for (const model of [
  "InventoryCategory",
  "InventoryItem",
  "InventoryStore",
  "InventorySupplier",
  "InventoryStock",
  "InventoryStockTransaction",
  "InventoryPurchaseOrder",
  "InventoryPurchaseOrderItem",
  "InventoryGoodsReceipt",
  "InventoryGoodsReceiptItem",
  "InventoryMaterialRequest",
  "InventoryMaterialRequestItem",
  "InventoryTransfer",
  "InventoryTransferItem",
]) {
  if (!schema.includes(`model ${model} {`)) {
    throw new Error(`Inventory Prisma model is missing: ${model}`);
  }
}

const app = fs.readFileSync(path.join(root, "src/app.ts"), "utf8");
if (!app.includes('app.use("/api/v1/inventory", inventoryRouter);')) {
  throw new Error("Inventory router is not mounted in app.ts");
}

const routes = fs.readFileSync(
  path.join(root, "src/modules/inventory/inventory.routes.ts"),
  "utf8",
);

if (!routes.includes("authenticate, enforceTenant")) {
  throw new Error("Inventory tenant/authentication middleware is missing");
}

console.log("Phase 12 Central Inventory source audit completed successfully.");
