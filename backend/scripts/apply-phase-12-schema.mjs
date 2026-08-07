import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error("prisma/schema.prisma was not found. Run this script from backend.");
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
  PURCHASE_RECEIPT
  MATERIAL_ISSUE
  MATERIAL_RETURN
  TRANSFER_OUT
  TRANSFER_IN
  ADJUSTMENT_IN
  ADJUSTMENT_OUT
  CONSUMPTION
  DAMAGE
  EXPIRY
}`,
`enum InventoryPurchaseStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PARTIALLY_RECEIVED
  RECEIVED
  REJECTED
  CANCELLED
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
`enum InventoryTransferStatus {
  DRAFT
  SUBMITTED
  IN_TRANSIT
  COMPLETED
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
  createdBy    String?      @map("created_by") @db.Uuid
  updatedAt    DateTime     @updatedAt @map("updated_at")
  updatedBy    String?      @map("updated_by") @db.Uuid
  deletedAt    DateTime?    @map("deleted_at")

  @@unique([hospitalId, categoryCode])
  @@index([hospitalId, status])
  @@map("inventory_categories")
}`,
`model InventoryItem {
  id            String              @id @default(uuid()) @db.Uuid
  hospitalId    String              @map("hospital_id") @db.Uuid
  categoryId    String?             @map("category_id") @db.Uuid
  itemCode      String              @map("item_code") @db.VarChar(40)
  itemName      String              @map("item_name") @db.VarChar(160)
  genericName   String?             @map("generic_name") @db.VarChar(160)
  itemType      String              @default("CONSUMABLE") @map("item_type") @db.VarChar(40)
  unitOfMeasure String              @map("unit_of_measure") @db.VarChar(30)
  description   String?
  reorderLevel  Decimal?            @map("reorder_level") @db.Decimal(14, 3)
  minimumStock  Decimal?            @map("minimum_stock") @db.Decimal(14, 3)
  maximumStock  Decimal?            @map("maximum_stock") @db.Decimal(14, 3)
  trackBatch    Boolean             @default(false) @map("track_batch")
  trackExpiry   Boolean             @default(false) @map("track_expiry")
  billable      Boolean             @default(false)
  status        InventoryItemStatus @default(ACTIVE)
  createdAt     DateTime            @default(now()) @map("created_at")
  createdBy     String?             @map("created_by") @db.Uuid
  updatedAt     DateTime            @updatedAt @map("updated_at")
  updatedBy     String?             @map("updated_by") @db.Uuid
  deletedAt     DateTime?           @map("deleted_at")

  @@unique([hospitalId, itemCode])
  @@index([hospitalId, categoryId, status])
  @@map("inventory_items")
}`,
`model InventoryStore {
  id           String       @id @default(uuid()) @db.Uuid
  hospitalId   String       @map("hospital_id") @db.Uuid
  branchId     String?      @map("branch_id") @db.Uuid
  departmentId String?      @map("department_id") @db.Uuid
  storeCode    String       @map("store_code") @db.VarChar(30)
  storeName    String       @map("store_name") @db.VarChar(120)
  storeType    String       @default("CENTRAL") @map("store_type") @db.VarChar(30)
  isCentral    Boolean      @default(false) @map("is_central")
  status       RecordStatus @default(ACTIVE)
  createdAt    DateTime     @default(now()) @map("created_at")
  createdBy    String?      @map("created_by") @db.Uuid
  updatedAt    DateTime     @updatedAt @map("updated_at")
  updatedBy    String?      @map("updated_by") @db.Uuid
  deletedAt    DateTime?    @map("deleted_at")

  @@unique([hospitalId, storeCode])
  @@index([hospitalId, branchId, status])
  @@index([departmentId])
  @@map("inventory_stores")
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
  drugLicense   String?      @map("drug_license") @db.VarChar(80)
  address       String?
  status        RecordStatus @default(ACTIVE)
  createdAt     DateTime     @default(now()) @map("created_at")
  createdBy     String?      @map("created_by") @db.Uuid
  updatedAt     DateTime     @updatedAt @map("updated_at")
  updatedBy     String?      @map("updated_by") @db.Uuid
  deletedAt     DateTime?    @map("deleted_at")

  @@unique([hospitalId, supplierCode])
  @@index([hospitalId, status])
  @@map("inventory_suppliers")
}`,
`model InventoryStock {
  id          String    @id @default(uuid()) @db.Uuid
  hospitalId  String    @map("hospital_id") @db.Uuid
  storeId     String    @map("store_id") @db.Uuid
  itemId      String    @map("item_id") @db.Uuid
  batchKey    String    @default("NO_BATCH") @map("batch_key") @db.VarChar(100)
  batchNumber String?   @map("batch_number") @db.VarChar(80)
  expiryDate  DateTime? @map("expiry_date") @db.Date
  quantity    Decimal   @default(0) @db.Decimal(14, 3)
  unitCost    Decimal?  @map("unit_cost") @db.Decimal(14, 2)
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@unique([hospitalId, storeId, itemId, batchKey])
  @@index([hospitalId, storeId])
  @@index([itemId, expiryDate])
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
  batchKey        String                        @default("NO_BATCH") @map("batch_key") @db.VarChar(100)
  batchNumber     String?                       @map("batch_number") @db.VarChar(80)
  quantity        Decimal                       @db.Decimal(14, 3)
  unitCost        Decimal?                      @map("unit_cost") @db.Decimal(14, 2)
  notes           String?
  createdAt       DateTime                      @default(now()) @map("created_at")
  createdBy       String?                       @map("created_by") @db.Uuid

  @@index([hospitalId, storeId, createdAt])
  @@index([itemId, createdAt])
  @@index([referenceType, referenceId])
  @@map("inventory_stock_transactions")
}`,
`model InventoryPurchaseOrder {
  id             String                  @id @default(uuid()) @db.Uuid
  hospitalId     String                  @map("hospital_id") @db.Uuid
  branchId       String?                 @map("branch_id") @db.Uuid
  supplierId     String                  @map("supplier_id") @db.Uuid
  destinationStoreId String              @map("destination_store_id") @db.Uuid
  purchaseNumber String                  @map("purchase_number") @db.VarChar(40)
  orderDate      DateTime                @map("order_date") @db.Date
  expectedDate   DateTime?               @map("expected_date") @db.Date
  status         InventoryPurchaseStatus @default(DRAFT)
  notes          String?
  approvedBy     String?                 @map("approved_by") @db.Uuid
  approvedAt     DateTime?               @map("approved_at")
  createdAt      DateTime                @default(now()) @map("created_at")
  createdBy      String?                 @map("created_by") @db.Uuid
  updatedAt      DateTime                @updatedAt @map("updated_at")
  updatedBy      String?                 @map("updated_by") @db.Uuid

  @@unique([hospitalId, purchaseNumber])
  @@index([hospitalId, status, orderDate])
  @@index([supplierId])
  @@map("inventory_purchase_orders")
}`,
`model InventoryPurchaseOrderItem {
  id               String  @id @default(uuid()) @db.Uuid
  hospitalId       String  @map("hospital_id") @db.Uuid
  purchaseOrderId  String  @map("purchase_order_id") @db.Uuid
  itemId           String  @map("item_id") @db.Uuid
  orderedQuantity  Decimal @map("ordered_quantity") @db.Decimal(14, 3)
  receivedQuantity Decimal @default(0) @map("received_quantity") @db.Decimal(14, 3)
  unitCost         Decimal? @map("unit_cost") @db.Decimal(14, 2)

  @@index([hospitalId, purchaseOrderId])
  @@index([itemId])
  @@map("inventory_purchase_order_items")
}`,
`model InventoryGoodsReceipt {
  id            String   @id @default(uuid()) @db.Uuid
  hospitalId    String   @map("hospital_id") @db.Uuid
  purchaseOrderId String @map("purchase_order_id") @db.Uuid
  storeId       String   @map("store_id") @db.Uuid
  receiptNumber String   @map("receipt_number") @db.VarChar(40)
  receiptDate   DateTime @map("receipt_date") @db.Date
  supplierInvoiceNumber String? @map("supplier_invoice_number") @db.VarChar(80)
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  createdBy     String?  @map("created_by") @db.Uuid

  @@unique([hospitalId, receiptNumber])
  @@index([hospitalId, receiptDate])
  @@index([purchaseOrderId])
  @@map("inventory_goods_receipts")
}`,
`model InventoryGoodsReceiptItem {
  id             String    @id @default(uuid()) @db.Uuid
  hospitalId     String    @map("hospital_id") @db.Uuid
  goodsReceiptId String    @map("goods_receipt_id") @db.Uuid
  purchaseOrderItemId String @map("purchase_order_item_id") @db.Uuid
  itemId         String    @map("item_id") @db.Uuid
  batchNumber    String?   @map("batch_number") @db.VarChar(80)
  expiryDate     DateTime? @map("expiry_date") @db.Date
  receivedQuantity Decimal @map("received_quantity") @db.Decimal(14, 3)
  acceptedQuantity Decimal @map("accepted_quantity") @db.Decimal(14, 3)
  rejectedQuantity Decimal @default(0) @map("rejected_quantity") @db.Decimal(14, 3)
  unitCost       Decimal?  @map("unit_cost") @db.Decimal(14, 2)

  @@index([hospitalId, goodsReceiptId])
  @@index([itemId])
  @@map("inventory_goods_receipt_items")
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
  notes         String?
  approvedBy    String?                @map("approved_by") @db.Uuid
  approvedAt    DateTime?              @map("approved_at")
  createdAt     DateTime               @default(now()) @map("created_at")
  createdBy     String?                @map("created_by") @db.Uuid
  updatedAt     DateTime               @updatedAt @map("updated_at")
  updatedBy     String?                @map("updated_by") @db.Uuid

  @@unique([hospitalId, requestNumber])
  @@index([hospitalId, status, requestDate])
  @@index([departmentId])
  @@map("inventory_material_requests")
}`,
`model InventoryMaterialRequestItem {
  id           String  @id @default(uuid()) @db.Uuid
  hospitalId   String  @map("hospital_id") @db.Uuid
  requestId    String  @map("request_id") @db.Uuid
  itemId       String  @map("item_id") @db.Uuid
  requestedQty Decimal @map("requested_qty") @db.Decimal(14, 3)
  issuedQty    Decimal @default(0) @map("issued_qty") @db.Decimal(14, 3)
  notes        String?

  @@index([hospitalId, requestId])
  @@index([itemId])
  @@map("inventory_material_request_items")
}`,
`model InventoryTransfer {
  id            String                  @id @default(uuid()) @db.Uuid
  hospitalId    String                  @map("hospital_id") @db.Uuid
  fromStoreId   String                  @map("from_store_id") @db.Uuid
  toStoreId     String                  @map("to_store_id") @db.Uuid
  transferNumber String                 @map("transfer_number") @db.VarChar(40)
  transferDate  DateTime                @map("transfer_date") @db.Date
  status        InventoryTransferStatus @default(DRAFT)
  notes         String?
  completedAt   DateTime?               @map("completed_at")
  createdAt     DateTime                @default(now()) @map("created_at")
  createdBy     String?                 @map("created_by") @db.Uuid
  updatedAt     DateTime                @updatedAt @map("updated_at")
  updatedBy     String?                 @map("updated_by") @db.Uuid

  @@unique([hospitalId, transferNumber])
  @@index([hospitalId, status, transferDate])
  @@map("inventory_transfers")
}`,
`model InventoryTransferItem {
  id          String   @id @default(uuid()) @db.Uuid
  hospitalId  String   @map("hospital_id") @db.Uuid
  transferId  String   @map("transfer_id") @db.Uuid
  itemId      String   @map("item_id") @db.Uuid
  batchNumber String?  @map("batch_number") @db.VarChar(80)
  quantity    Decimal  @db.Decimal(14, 3)

  @@index([hospitalId, transferId])
  @@index([itemId])
  @@map("inventory_transfer_items")
}`
];

function removeBlock(source, kind, name) {
  const startPattern = new RegExp(`\\n${kind}\\s+${name}\\s*\\{`, "m");
  const match = startPattern.exec(source);
  if (!match) return source;

  const start = match.index + 1;
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = -1;

  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end < 0) throw new Error(`Unable to parse ${kind} ${name}`);
  return source.slice(0, start) + source.slice(end);
}

for (const block of blocks) {
  const firstLine = block.trim().split("\n")[0];
  const [kind, name] = firstLine.split(/\s+/);
  schema = removeBlock(schema, kind, name);
  schema = `${schema.trimEnd()}\n\n${block.trim()}\n`;
}

fs.writeFileSync(schemaPath, schema, "utf8");
console.log("Phase 12 Central Inventory Prisma schema applied successfully.");
