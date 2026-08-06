-- CreateEnum
CREATE TYPE "OpdVisitStatus" AS ENUM ('REGISTERED', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpdVisitType" AS ENUM ('NEW', 'FOLLOW_UP', 'REVIEW', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiagnosisType" AS ENUM ('PROVISIONAL', 'FINAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "ClinicalOrderType" AS ENUM ('LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'PHARMACY');

-- CreateTable
CREATE TABLE "opd_visits" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_id" UUID,
    "visit_number" VARCHAR(40) NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "visit_type" "OpdVisitType" NOT NULL DEFAULT 'NEW',
    "status" "OpdVisitStatus" NOT NULL DEFAULT 'REGISTERED',
    "chief_complaint" TEXT,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "opd_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_vital_signs" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "temperature_celsius" DECIMAL(5,2),
    "pulse_rate" INTEGER,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "spo2" INTEGER,
    "height_cm" DECIMAL(7,2),
    "weight_kg" DECIMAL(7,2),
    "bmi" DECIMAL(7,2),
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,

    CONSTRAINT "opd_vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_consultations" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT',
    "history" TEXT,
    "examination_notes" TEXT,
    "clinical_notes" TEXT,
    "advice" TEXT,
    "doctor_notes" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "opd_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_diagnoses" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "diagnosis_type" "DiagnosisType" NOT NULL DEFAULT 'PROVISIONAL',
    "diagnosis_code" VARCHAR(30),
    "diagnosis_name" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "opd_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_prescriptions" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "opd_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_prescription_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "medicine_name" VARCHAR(200) NOT NULL,
    "dosage" VARCHAR(100),
    "frequency" VARCHAR(100),
    "duration_days" INTEGER,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "opd_prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_clinical_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "order_type" "ClinicalOrderType" NOT NULL,
    "order_name" VARCHAR(250) NOT NULL,
    "instructions" TEXT,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordered_by" UUID,

    CONSTRAINT "opd_clinical_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_follow_ups" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "follow_up_date" DATE NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "opd_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opd_visits_appointment_id_key" ON "opd_visits"("appointment_id");

-- CreateIndex
CREATE INDEX "opd_visits_hospital_id_visit_date_idx" ON "opd_visits"("hospital_id", "visit_date");

-- CreateIndex
CREATE INDEX "opd_visits_patient_id_visit_date_idx" ON "opd_visits"("patient_id", "visit_date");

-- CreateIndex
CREATE INDEX "opd_visits_doctor_id_visit_date_idx" ON "opd_visits"("doctor_id", "visit_date");

-- CreateIndex
CREATE INDEX "opd_visits_status_idx" ON "opd_visits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "opd_visits_hospital_id_visit_number_key" ON "opd_visits"("hospital_id", "visit_number");

-- CreateIndex
CREATE INDEX "opd_vital_signs_hospital_id_idx" ON "opd_vital_signs"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_vital_signs_visit_id_idx" ON "opd_vital_signs"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "opd_consultations_visit_id_key" ON "opd_consultations"("visit_id");

-- CreateIndex
CREATE INDEX "opd_consultations_hospital_id_idx" ON "opd_consultations"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_diagnoses_hospital_id_idx" ON "opd_diagnoses"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_diagnoses_visit_id_idx" ON "opd_diagnoses"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "opd_prescriptions_visit_id_key" ON "opd_prescriptions"("visit_id");

-- CreateIndex
CREATE INDEX "opd_prescriptions_hospital_id_idx" ON "opd_prescriptions"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_prescription_items_hospital_id_idx" ON "opd_prescription_items"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_prescription_items_prescription_id_idx" ON "opd_prescription_items"("prescription_id");

-- CreateIndex
CREATE INDEX "opd_clinical_orders_hospital_id_idx" ON "opd_clinical_orders"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_clinical_orders_visit_id_idx" ON "opd_clinical_orders"("visit_id");

-- CreateIndex
CREATE INDEX "opd_follow_ups_hospital_id_idx" ON "opd_follow_ups"("hospital_id");

-- CreateIndex
CREATE INDEX "opd_follow_ups_visit_id_idx" ON "opd_follow_ups"("visit_id");

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_vital_signs" ADD CONSTRAINT "opd_vital_signs_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_consultations" ADD CONSTRAINT "opd_consultations_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_diagnoses" ADD CONSTRAINT "opd_diagnoses_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_prescriptions" ADD CONSTRAINT "opd_prescriptions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_prescription_items" ADD CONSTRAINT "opd_prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "opd_prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_clinical_orders" ADD CONSTRAINT "opd_clinical_orders_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_follow_ups" ADD CONSTRAINT "opd_follow_ups_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
