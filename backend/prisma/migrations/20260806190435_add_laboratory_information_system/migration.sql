-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_PENDING', 'SAMPLE_COLLECTED', 'IN_PROCESS', 'RESULT_ENTERED', 'VERIFIED', 'REPORTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabOrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "LabSampleStatus" AS ENUM ('PENDING', 'COLLECTED', 'RECEIVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LabResultStatus" AS ENUM ('DRAFT', 'ENTERED', 'VERIFIED', 'RELEASED', 'AMENDED');

-- CreateEnum
CREATE TYPE "LabValueType" AS ENUM ('NUMERIC', 'TEXT', 'BOOLEAN', 'CHOICE');

-- CreateTable
CREATE TABLE "lab_test_catalog" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "test_code" VARCHAR(40) NOT NULL,
    "test_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(120),
    "sample_type" VARCHAR(80) NOT NULL,
    "container_type" VARCHAR(80),
    "turnaround_minutes" INTEGER,
    "price" DECIMAL(12,2),
    "instructions" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_test_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_parameters" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "parameter_code" VARCHAR(40) NOT NULL,
    "parameter_name" VARCHAR(200) NOT NULL,
    "value_type" "LabValueType" NOT NULL DEFAULT 'NUMERIC',
    "unit" VARCHAR(50),
    "reference_range" VARCHAR(200),
    "critical_low" DECIMAL(14,4),
    "critical_high" DECIMAL(14,4),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_test_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID,
    "doctor_id" UUID,
    "patient_id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "priority" "LabOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "clinical_notes" TEXT,
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordered_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "price" DECIMAL(12,2),
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_samples" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "sample_number" VARCHAR(50) NOT NULL,
    "barcode" VARCHAR(100),
    "sample_type" VARCHAR(80) NOT NULL,
    "status" "LabSampleStatus" NOT NULL DEFAULT 'PENDING',
    "collected_at" TIMESTAMP(3),
    "collected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "status" "LabResultStatus" NOT NULL DEFAULT 'DRAFT',
    "interpretation" TEXT,
    "remarks" TEXT,
    "entered_at" TIMESTAMP(3),
    "entered_by" UUID,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "released_at" TIMESTAMP(3),
    "released_by" UUID,
    "amendment_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_result_values" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "result_id" UUID NOT NULL,
    "parameter_id" UUID NOT NULL,
    "numeric_value" DECIMAL(18,6),
    "text_value" TEXT,
    "boolean_value" BOOLEAN,
    "choice_value" VARCHAR(200),
    "unit" VARCHAR(50),
    "reference_range" VARCHAR(200),
    "abnormal_flag" VARCHAR(20),
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_result_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_test_catalog_hospital_id_status_idx" ON "lab_test_catalog"("hospital_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lab_test_catalog_hospital_id_test_code_key" ON "lab_test_catalog"("hospital_id", "test_code");

-- CreateIndex
CREATE INDEX "lab_test_parameters_hospital_id_idx" ON "lab_test_parameters"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_test_parameters_test_id_parameter_code_key" ON "lab_test_parameters"("test_id", "parameter_code");

-- CreateIndex
CREATE INDEX "lab_orders_hospital_id_ordered_at_idx" ON "lab_orders"("hospital_id", "ordered_at");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_ordered_at_idx" ON "lab_orders"("patient_id", "ordered_at");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_hospital_id_order_number_key" ON "lab_orders"("hospital_id", "order_number");

-- CreateIndex
CREATE INDEX "lab_order_items_hospital_id_idx" ON "lab_order_items"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_order_items_order_id_test_id_key" ON "lab_order_items"("order_id", "test_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_samples_order_item_id_key" ON "lab_samples"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_samples_barcode_key" ON "lab_samples"("barcode");

-- CreateIndex
CREATE INDEX "lab_samples_order_id_idx" ON "lab_samples"("order_id");

-- CreateIndex
CREATE INDEX "lab_samples_status_idx" ON "lab_samples"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lab_samples_hospital_id_sample_number_key" ON "lab_samples"("hospital_id", "sample_number");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_order_item_id_key" ON "lab_results"("order_item_id");

-- CreateIndex
CREATE INDEX "lab_results_hospital_id_idx" ON "lab_results"("hospital_id");

-- CreateIndex
CREATE INDEX "lab_results_order_id_idx" ON "lab_results"("order_id");

-- CreateIndex
CREATE INDEX "lab_results_status_idx" ON "lab_results"("status");

-- CreateIndex
CREATE INDEX "lab_result_values_hospital_id_idx" ON "lab_result_values"("hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_result_values_result_id_parameter_id_key" ON "lab_result_values"("result_id", "parameter_id");

-- AddForeignKey
ALTER TABLE "lab_test_parameters" ADD CONSTRAINT "lab_test_parameters_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "lab_test_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "lab_test_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "lab_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "lab_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_values" ADD CONSTRAINT "lab_result_values_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_values" ADD CONSTRAINT "lab_result_values_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "lab_test_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
