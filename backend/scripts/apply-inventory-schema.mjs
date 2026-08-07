import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error("prisma/schema.prisma was not found. Run from backend.");
}

let schema = fs.readFileSync(schemaPath, "utf8");

const blocks = [
`enum InventoryItemStatus {
  ACTIVE
  INACTIVE
  DISCONTINUED
}`,
`enum InventoryStockTransactionType {
  OPENING
  PURCHASE
  ISSUE
  RETURN_IN
  RETURN_OUT
  TRANSFER_IN
  TRANSFER_OUT
  ADJUSTMENT_IN
  ADJUSTMENT_OUT
  CONSUMPTION
  DAMAGE
  EXPIRY
}`,
`enum InventoryRequestStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PARTIALLY_ISSUED
  ISSUED
  REJECTED
  CANCELLED
}`,
`enum InventoryPurchaseStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}`,
`model InventoryCategory {
  id           String       @id @default(uuid()) @db.Uuid
  hospitalId   String       @map("hospital_id") @db.Uuid
  categoryCode String       @map("category_code") @db.VarChar(30)
  categoryName String       @map("category_name") @db.VarChar(120)
  description  String?
  status       RecordStatus @default(ACTIVE)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  deletedAt    DateTime?    @map("deleted_at")

  @@unique([hospitalId, categoryCode])
  @@index([hospitalId])
  @@map("inventory_categories")
}`,
`model InventoryItem {
  id              String              @id @default(uuid()) @db.Uuid
  hospitalId      String              @map("hospital_id") @db.Uuid
  categoryId      String?             @map("category_id") @db.Uuid
  itemCode        String              @map("item_code") @db.VarChar(40)
  itemName        String              @map("item_name") @db.VarChar(160)
  unitOfMeasure   String              @map("unit_of_measure") @db.VarChar(30)
  description     String?
  reorderLevel    Decimal?            @map("reorder_level") @db.Decimal(14, 3)
  minimumStock    Decimal?            @map("minimum_stock") @db.Decimal(14, 3)
  maximumStock    Decimal?            @map("maximum_stock") @db.Decimal(14, 3)
  trackExpiry     Boolean             @default(false) @map("track_expiry")
  trackBatch      Boolean             @default(false) @map("track_batch")
  status          InventoryItemStatus @default(ACTIVE)
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")
  deletedAt       DateTime?           @map("deleted_at")

  @@unique([hospitalId, itemCode])
  @@index([hospitalId])
  @@index([categoryId])
  @@map("inventory_items")
}`,
`model InventoryStore {
  id         String       @id @default(uuid()) @db.Uuid
  hospitalId String       @map("hospital_id") @db.Uuid
  branchId   String?      @map("branch_id") @db.Uuid
  storeCode  String       @map("store_code") @db.VarChar(30)
  storeName  String       @map("store_name") @db.VarChar(120)
  storeType  String       @default("CENTRAL") @map("store_type") @db.VarChar(30)
  status     RecordStatus @default(ACTIVE)
  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")
  deletedAt  DateTime?    @map("deleted_at")

  @@unique([hospitalId, storeCode])
  @@index([hospitalId])
  @@index([branchId])
  @@map("inventory_stores")
}`,
`model InventoryStock {
  id           String   @id @default(uuid()) @db.Uuid
  hospitalId   String   @map("hospital_id") @db.Uuid
  storeId      String   @map("store_id") @db.Uuid
  itemId       String   @map("item_id") @db.Uuid
  batchNumber  String?  @map("batch_number") @db.VarChar(80)
  expiryDate   DateTime? @map("expiry_date") @db.Date
  quantity     Decimal  @default(0) @db.Decimal(14, 3)
  unitCost     Decimal? @map("unit_cost") @db.Decimal(14, 2)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([hospitalId, storeId, itemId, batchNumber])
  @@index([hospitalId])
  @@index([storeId])
  @@index([itemId])
  @@map("inventory_stock")
}`,
`model InventoryStockTransaction {
  id              String                        @id @default(uuid()) @db.Uuid
  hospitalId      String                        @map("hospital_id") @db.Uuid
  storeId         String                        @map("store_id") @db.Uuid
  itemId          String                        @map("item_id") @db.Uuid
  transactionType InventoryStockTransactionType @map("transaction_type")
  referenceType   String?                       @map("reference_type") @db.VarChar(50)
  referenceId     String?                       @map("reference_id") @db.Uuid
  batchNumber     String?                       @map("batch_number") @db.VarChar(80)
  quantity        Decimal                       @db.Decimal(14, 3)
  unitCost        Decimal?                      @map("unit_cost") @db.Decimal(14, 2)
  notes           String?
  createdBy       String?                       @map("created_by") @db.Uuid
  createdAt       DateTime                      @default(now()) @map("created_at")

  @@index([hospitalId])
  @@index([storeId])
  @@index([itemId])
  @@map("inventory_stock_transactions")
}`,
`model InventorySupplier {
  id            String       @id @default(uuid()) @db.Uuid
  hospitalId    String       @map("hospital_id") @db.Uuid
  supplierCode  String       @map("supplier_code") @db.VarChar(30)
  supplierName  String       @map("supplier_name") @db.VarChar(160)
  contactPerson String?      @map("contact_person") @db.VarChar(120)
  phone         String?      @db.VarChar(20)
  email         String?      @db.VarChar(150)
  gstNumber     String?      @map("gst_number") @db.VarChar(30)
  address       String?
  status        RecordStatus @default(ACTIVE)
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")

  @@unique([hospitalId, supplierCode])
  @@index([hospitalId])
  @@map("inventory_suppliers")
}`,
`model InventoryPurchaseOrder {
  id             String                  @id @default(uuid()) @db.Uuid
  hospitalId     String                  @map("hospital_id") @db.Uuid
  branchId       String?                 @map("branch_id") @db.Uuid
  supplierId     String                  @map("supplier_id") @db.Uuid
  purchaseNumber String                  @map("purchase_number") @db.VarChar(40)
  orderDate      DateTime                @map("order_date") @db.Date
  status         InventoryPurchaseStatus @default(DRAFT)
  notes          String?
  createdBy      String?                 @map("created_by") @db.Uuid
  createdAt      DateTime                @default(now()) @map("created_at")
  updatedAt      DateTime                @updatedAt @map("updated_at")

  @@unique([hospitalId, purchaseNumber])
  @@index([hospitalId])
  @@index([supplierId])
  @@map("inventory_purchase_orders")
}`,
`model InventoryPurchaseOrderItem {
  id              String   @id @default(uuid()) @db.Uuid
  hospitalId      String   @map("hospital_id") @db.Uuid
  purchaseOrderId String   @map("purchase_order_id") @db.Uuid
  itemId          String   @map("item_id") @db.Uuid
  orderedQuantity Decimal  @map("ordered_quantity") @db.Decimal(14, 3)
  receivedQuantity Decimal @default(0) @map("received_quantity") @db.Decimal(14, 3)
  unitCost        Decimal? @map("unit_cost") @db.Decimal(14, 2)

  @@index([hospitalId])
  @@index([purchaseOrderId])
  @@index([itemId])
  @@map("inventory_purchase_order_items")
}`,
`model InventoryMaterialRequest {
  id            String                 @id @default(uuid()) @db.Uuid
  hospitalId    String                 @map("hospital_id") @db.Uuid
  branchId      String?                @map("branch_id") @db.Uuid
  departmentId  String?                @map("department_id") @db.Uuid
  fromStoreId   String                 @map("from_store_id") @db.Uuid
  requestNumber String                 @map("request_number") @db.VarChar(40)
  requestDate   DateTime               @map("request_date") @db.Date
  status        InventoryRequestStatus @default(DRAFT)
  requestedBy   String?                @map("requested_by") @db.Uuid
  approvedBy    String?                @map("approved_by") @db.Uuid
  approvedAt    DateTime?              @map("approved_at")
  notes         String?
  createdAt     DateTime               @default(now()) @map("created_at")
  updatedAt     DateTime               @updatedAt @map("updated_at")

  @@unique([hospitalId, requestNumber])
  @@index([hospitalId])
  @@index([departmentId])
  @@index([fromStoreId])
  @@map("inventory_material_requests")
}`,
`model InventoryMaterialRequestItem {
  id              String   @id @default(uuid()) @db.Uuid
  hospitalId      String   @map("hospital_id") @db.Uuid
  requestId       String   @map("request_id") @db.Uuid
  itemId          String   @map("item_id") @db.Uuid
  requestedQty    Decimal  @map("requested_qty") @db.Decimal(14, 3)
  issuedQty       Decimal  @default(0) @map("issued_qty") @db.Decimal(14, 3)
  notes           String?

  @@index([hospitalId])
  @@index([requestId])
  @@index([itemId])
  @@map("inventory_material_request_items")
}`
];

for (const block of blocks) {
  const firstLine = block.trim().split("\n")[0];
  const name = firstLine.split(/\s+/)[1];

  const re = new RegExp(`\\n(?:model|enum)\\s+${name}\\s*(?:\\{|\\{)[\\s\\S]*?\\n\\}`, "m");
  schema = schema.replace(re, "");
  schema = `${schema.trimEnd()}\n\n${block.trim()}\n`;
}

fs.writeFileSync(schemaPath, schema, "utf8");
console.log("Central Inventory Prisma schema applied successfully");
