-- CreateEnum
CREATE TYPE "RadiologyModality" AS ENUM ('XRAY', 'CT', 'MRI', 'ULTRASOUND', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'DEXA', 'PET_CT', 'NUCLEAR_MEDICINE', 'OTHER');

-- CreateEnum
CREATE TYPE "RadiologyOrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "RadiologyOrderStatus" AS ENUM ('ORDERED', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'REPORTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RadiologyStudyStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PATIENT_READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RadiologyReportStatus" AS ENUM ('DRAFT', 'PRELIMINARY', 'VERIFIED', 'RELEASED', 'AMENDED');

-- CreateEnum
CREATE TYPE "ContrastRoute" AS ENUM ('ORAL', 'INTRAVENOUS', 'RECTAL', 'INTRATHECAL', 'OTHER');

-- CreateTable
CREATE TABLE "radiology_procedure_catalog" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "procedure_code" VARCHAR(40) NOT NULL,
    "procedure_name" VARCHAR(200) NOT NULL,
    "modality" "RadiologyModality" NOT NULL,
    "body_part" VARCHAR(100),
    "laterality" VARCHAR(30),
    "requires_contrast" BOOLEAN NOT NULL DEFAULT false,
    "requires_preparation" BOOLEAN NOT NULL DEFAULT false,
    "preparation_instructions" TEXT,
    "estimated_minutes" INTEGER,
    "price" DECIMAL(12,2),
    "report_template" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "radiology_procedure_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID,
    "doctor_id" UUID,
    "patient_id" UUID NOT NULL,
    "opd_visit_id" UUID,
    "ipd_admission_id" UUID,
    "order_number" VARCHAR(40) NOT NULL,
    "priority" "RadiologyOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "RadiologyOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "clinical_notes" TEXT,
    "provisional_diagnosis" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_by" UUID,
    "scheduled_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_order_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "procedure_id" UUID NOT NULL,
    "status" "RadiologyOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "scheduled_at" TIMESTAMP(3),
    "price" DECIMAL(12,2),
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_studies" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "accession_number" VARCHAR(50) NOT NULL,
    "modality" "RadiologyModality" NOT NULL,
    "status" "RadiologyStudyStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "check_in_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "technician_id" UUID,
    "radiologist_id" UUID,
    "patient_preparation" TEXT,
    "pregnancy_status" VARCHAR(30),
    "creatinine_value" DECIMAL(8,2),
    "pacs_study_uid" VARCHAR(200),
    "dicom_study_uid" VARCHAR(200),
    "workstation_name" VARCHAR(120),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_contrast_administrations" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "study_id" UUID NOT NULL,
    "contrast_name" VARCHAR(150) NOT NULL,
    "route" "ContrastRoute" NOT NULL,
    "dose" DECIMAL(10,2),
    "dose_unit" VARCHAR(30),
    "lot_number" VARCHAR(80),
    "administered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administered_by" UUID,
    "reaction_observed" BOOLEAN NOT NULL DEFAULT false,
    "reaction_details" TEXT,
    "notes" TEXT,

    CONSTRAINT "radiology_contrast_administrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_reports" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "study_id" UUID NOT NULL,
    "status" "RadiologyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "clinical_history" TEXT,
    "technique" TEXT,
    "findings" TEXT,
    "impression" TEXT,
    "recommendations" TEXT,
    "comparison_study" TEXT,
    "reported_at" TIMESTAMP(3),
    "reported_by" UUID,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "released_at" TIMESTAMP(3),
    "released_by" UUID,
    "amendment_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_attachments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "study_id" UUID NOT NULL,
    "file_name" VARCHAR(250) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(120),
    "file_size" BIGINT,
    "attachment_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "radiology_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "radiology_procedure_catalog_hospital_id_status_idx" ON "radiology_procedure_catalog"("hospital_id", "status");

-- CreateIndex
CREATE INDEX "radiology_procedure_catalog_modality_idx" ON "radiology_procedure_catalog"("modality");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_procedure_catalog_hospital_id_procedure_code_key" ON "radiology_procedure_catalog"("hospital_id", "procedure_code");

-- CreateIndex
CREATE INDEX "radiology_orders_hospital_id_requested_at_idx" ON "radiology_orders"("hospital_id", "requested_at");

-- CreateIndex
CREATE INDEX "radiology_orders_patient_id_requested_at_idx" ON "radiology_orders"("patient_id", "requested_at");

-- CreateIndex
CREATE INDEX "radiology_orders_status_idx" ON "radiology_orders"("status");

-- CreateIndex
CREATE INDEX "radiology_orders_priority_idx" ON "radiology_orders"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_orders_hospital_id_order_number_key" ON "radiology_orders"("hospital_id", "order_number");

-- CreateIndex
CREATE INDEX "radiology_order_items_hospital_id_idx" ON "radiology_order_items"("hospital_id");

-- CreateIndex
CREATE INDEX "radiology_order_items_order_id_idx" ON "radiology_order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_order_items_order_id_procedure_id_key" ON "radiology_order_items"("order_id", "procedure_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_studies_order_item_id_key" ON "radiology_studies"("order_item_id");

-- CreateIndex
CREATE INDEX "radiology_studies_order_id_idx" ON "radiology_studies"("order_id");

-- CreateIndex
CREATE INDEX "radiology_studies_status_idx" ON "radiology_studies"("status");

-- CreateIndex
CREATE INDEX "radiology_studies_scheduled_at_idx" ON "radiology_studies"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_studies_hospital_id_accession_number_key" ON "radiology_studies"("hospital_id", "accession_number");

-- CreateIndex
CREATE INDEX "radiology_contrast_administrations_hospital_id_idx" ON "radiology_contrast_administrations"("hospital_id");

-- CreateIndex
CREATE INDEX "radiology_contrast_administrations_study_id_idx" ON "radiology_contrast_administrations"("study_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_reports_order_item_id_key" ON "radiology_reports"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_reports_study_id_key" ON "radiology_reports"("study_id");

-- CreateIndex
CREATE INDEX "radiology_reports_hospital_id_idx" ON "radiology_reports"("hospital_id");

-- CreateIndex
CREATE INDEX "radiology_reports_order_id_idx" ON "radiology_reports"("order_id");

-- CreateIndex
CREATE INDEX "radiology_reports_status_idx" ON "radiology_reports"("status");

-- CreateIndex
CREATE INDEX "radiology_attachments_hospital_id_idx" ON "radiology_attachments"("hospital_id");

-- CreateIndex
CREATE INDEX "radiology_attachments_study_id_idx" ON "radiology_attachments"("study_id");

-- AddForeignKey
ALTER TABLE "radiology_orders" ADD CONSTRAINT "radiology_orders_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_orders" ADD CONSTRAINT "radiology_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_orders" ADD CONSTRAINT "radiology_orders_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_orders" ADD CONSTRAINT "radiology_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_orders" ADD CONSTRAINT "radiology_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_order_items" ADD CONSTRAINT "radiology_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "radiology_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_order_items" ADD CONSTRAINT "radiology_order_items_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "radiology_procedure_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_studies" ADD CONSTRAINT "radiology_studies_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "radiology_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_studies" ADD CONSTRAINT "radiology_studies_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "radiology_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_contrast_administrations" ADD CONSTRAINT "radiology_contrast_administrations_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "radiology_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_reports" ADD CONSTRAINT "radiology_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "radiology_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_reports" ADD CONSTRAINT "radiology_reports_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "radiology_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_reports" ADD CONSTRAINT "radiology_reports_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "radiology_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_attachments" ADD CONSTRAINT "radiology_attachments_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "radiology_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
