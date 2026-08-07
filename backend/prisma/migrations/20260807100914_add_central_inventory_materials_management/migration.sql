-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "InventoryStockTransactionType" AS ENUM ('OPENING', 'PURCHASE_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CONSUMPTION', 'DAMAGE', 'EXPIRY');

-- CreateEnum
CREATE TYPE "InventoryPurchaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_ISSUED', 'ISSUED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryTransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "category_code" VARCHAR(30) NOT NULL,
    "category_name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "category_id" UUID,
    "item_code" VARCHAR(40) NOT NULL,
    "item_name" VARCHAR(160) NOT NULL,
    "generic_name" VARCHAR(160),
    "item_type" VARCHAR(40) NOT NULL DEFAULT 'CONSUMABLE',
    "unit_of_measure" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "reorder_level" DECIMAL(14,3),
    "minimum_stock" DECIMAL(14,3),
    "maximum_stock" DECIMAL(14,3),
    "track_batch" BOOLEAN NOT NULL DEFAULT false,
    "track_expiry" BOOLEAN NOT NULL DEFAULT false,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stores" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "store_code" VARCHAR(30) NOT NULL,
    "store_name" VARCHAR(120) NOT NULL,
    "store_type" VARCHAR(30) NOT NULL DEFAULT 'CENTRAL',
    "is_central" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_suppliers" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "supplier_code" VARCHAR(30) NOT NULL,
    "supplier_name" VARCHAR(160) NOT NULL,
    "contact_person" VARCHAR(120),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "gst_number" VARCHAR(30),
    "drug_license" VARCHAR(80),
    "address" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_key" VARCHAR(100) NOT NULL DEFAULT 'NO_BATCH',
    "batch_number" VARCHAR(80),
    "expiry_date" DATE,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(14,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_transactions" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "transaction_type" "InventoryStockTransactionType" NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "batch_key" VARCHAR(100) NOT NULL DEFAULT 'NO_BATCH',
    "batch_number" VARCHAR(80),
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_cost" DECIMAL(14,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "inventory_stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_purchase_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "supplier_id" UUID NOT NULL,
    "destination_store_id" UUID NOT NULL,
    "purchase_number" VARCHAR(40) NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_date" DATE,
    "status" "InventoryPurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "inventory_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_purchase_order_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "ordered_quantity" DECIMAL(14,3) NOT NULL,
    "received_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(14,2),

    CONSTRAINT "inventory_purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_goods_receipts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "receipt_number" VARCHAR(40) NOT NULL,
    "receipt_date" DATE NOT NULL,
    "supplier_invoice_number" VARCHAR(80),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "inventory_goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_goods_receipt_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "goods_receipt_id" UUID NOT NULL,
    "purchase_order_item_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_number" VARCHAR(80),
    "expiry_date" DATE,
    "received_quantity" DECIMAL(14,3) NOT NULL,
    "accepted_quantity" DECIMAL(14,3) NOT NULL,
    "rejected_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(14,2),

    CONSTRAINT "inventory_goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_material_requests" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "from_store_id" UUID NOT NULL,
    "request_number" VARCHAR(40) NOT NULL,
    "request_date" DATE NOT NULL,
    "status" "InventoryRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "inventory_material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_material_request_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "requested_qty" DECIMAL(14,3) NOT NULL,
    "issued_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "inventory_material_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transfers" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "from_store_id" UUID NOT NULL,
    "to_store_id" UUID NOT NULL,
    "transfer_number" VARCHAR(40) NOT NULL,
    "transfer_date" DATE NOT NULL,
    "status" "InventoryTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "inventory_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transfer_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_number" VARCHAR(80),
    "quantity" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "inventory_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_categories_hospital_id_status_idx" ON "inventory_categories"("hospital_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_hospital_id_category_code_key" ON "inventory_categories"("hospital_id", "category_code");

-- CreateIndex
CREATE INDEX "inventory_items_hospital_id_category_id_status_idx" ON "inventory_items"("hospital_id", "category_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_hospital_id_item_code_key" ON "inventory_items"("hospital_id", "item_code");

-- CreateIndex
CREATE INDEX "inventory_stores_hospital_id_branch_id_status_idx" ON "inventory_stores"("hospital_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "inventory_stores_department_id_idx" ON "inventory_stores"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stores_hospital_id_store_code_key" ON "inventory_stores"("hospital_id", "store_code");

-- CreateIndex
CREATE INDEX "inventory_suppliers_hospital_id_status_idx" ON "inventory_suppliers"("hospital_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_suppliers_hospital_id_supplier_code_key" ON "inventory_suppliers"("hospital_id", "supplier_code");

-- CreateIndex
CREATE INDEX "inventory_stock_hospital_id_store_id_idx" ON "inventory_stock"("hospital_id", "store_id");

-- CreateIndex
CREATE INDEX "inventory_stock_item_id_expiry_date_idx" ON "inventory_stock"("item_id", "expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_hospital_id_store_id_item_id_batch_key_key" ON "inventory_stock"("hospital_id", "store_id", "item_id", "batch_key");

-- CreateIndex
CREATE INDEX "inventory_stock_transactions_hospital_id_store_id_created_a_idx" ON "inventory_stock_transactions"("hospital_id", "store_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_stock_transactions_item_id_created_at_idx" ON "inventory_stock_transactions"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_stock_transactions_reference_type_reference_id_idx" ON "inventory_stock_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_hospital_id_status_order_date_idx" ON "inventory_purchase_orders"("hospital_id", "status", "order_date");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_supplier_id_idx" ON "inventory_purchase_orders"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_purchase_orders_hospital_id_purchase_number_key" ON "inventory_purchase_orders"("hospital_id", "purchase_number");

-- CreateIndex
CREATE INDEX "inventory_purchase_order_items_hospital_id_purchase_order_i_idx" ON "inventory_purchase_order_items"("hospital_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_order_items_item_id_idx" ON "inventory_purchase_order_items"("item_id");

-- CreateIndex
CREATE INDEX "inventory_goods_receipts_hospital_id_receipt_date_idx" ON "inventory_goods_receipts"("hospital_id", "receipt_date");

-- CreateIndex
CREATE INDEX "inventory_goods_receipts_purchase_order_id_idx" ON "inventory_goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_goods_receipts_hospital_id_receipt_number_key" ON "inventory_goods_receipts"("hospital_id", "receipt_number");

-- CreateIndex
CREATE INDEX "inventory_goods_receipt_items_hospital_id_goods_receipt_id_idx" ON "inventory_goods_receipt_items"("hospital_id", "goods_receipt_id");

-- CreateIndex
CREATE INDEX "inventory_goods_receipt_items_item_id_idx" ON "inventory_goods_receipt_items"("item_id");

-- CreateIndex
CREATE INDEX "inventory_material_requests_hospital_id_status_request_date_idx" ON "inventory_material_requests"("hospital_id", "status", "request_date");

-- CreateIndex
CREATE INDEX "inventory_material_requests_department_id_idx" ON "inventory_material_requests"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_material_requests_hospital_id_request_number_key" ON "inventory_material_requests"("hospital_id", "request_number");

-- CreateIndex
CREATE INDEX "inventory_material_request_items_hospital_id_request_id_idx" ON "inventory_material_request_items"("hospital_id", "request_id");

-- CreateIndex
CREATE INDEX "inventory_material_request_items_item_id_idx" ON "inventory_material_request_items"("item_id");

-- CreateIndex
CREATE INDEX "inventory_transfers_hospital_id_status_transfer_date_idx" ON "inventory_transfers"("hospital_id", "status", "transfer_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transfers_hospital_id_transfer_number_key" ON "inventory_transfers"("hospital_id", "transfer_number");

-- CreateIndex
CREATE INDEX "inventory_transfer_items_hospital_id_transfer_id_idx" ON "inventory_transfer_items"("hospital_id", "transfer_id");

-- CreateIndex
CREATE INDEX "inventory_transfer_items_item_id_idx" ON "inventory_transfer_items"("item_id");
