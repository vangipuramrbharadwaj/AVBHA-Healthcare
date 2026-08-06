-- CreateEnum
CREATE TYPE "IpdAdmissionStatus" AS ENUM ('ACTIVE', 'DISCHARGE_PLANNED', 'DISCHARGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IpdAdmissionType" AS ENUM ('ELECTIVE', 'EMERGENCY', 'DAY_CARE', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "IpdBedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "IpdAllocationStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IpdDischargeType" AS ENUM ('NORMAL', 'LAMA', 'TRANSFER', 'DEATH', 'ABSCONDED');

-- CreateTable
CREATE TABLE "ipd_wards" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "ward_code" VARCHAR(30) NOT NULL,
    "ward_name" VARCHAR(120) NOT NULL,
    "ward_type" VARCHAR(50) NOT NULL,
    "floor" VARCHAR(30),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipd_wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_rooms" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "ward_id" UUID NOT NULL,
    "room_code" VARCHAR(30) NOT NULL,
    "room_name" VARCHAR(120) NOT NULL,
    "room_type" VARCHAR(50) NOT NULL,
    "daily_charge" DECIMAL(12,2),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipd_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_beds" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "bed_code" VARCHAR(30) NOT NULL,
    "bed_name" VARCHAR(100) NOT NULL,
    "bed_type" VARCHAR(50) NOT NULL,
    "daily_charge" DECIMAL(12,2),
    "bed_status" "IpdBedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipd_beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_admissions" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "admission_number" VARCHAR(40) NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "admission_type" "IpdAdmissionType" NOT NULL DEFAULT 'ELECTIVE',
    "status" "IpdAdmissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "admission_reason" TEXT,
    "provisional_diagnosis" TEXT,
    "expected_discharge_date" DATE,
    "attendant_name" VARCHAR(150),
    "attendant_phone" VARCHAR(20),
    "notes" TEXT,
    "discharged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ipd_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_bed_allocations" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "bed_id" UUID NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "status" "IpdAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "transfer_reason" TEXT,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "ipd_bed_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_nursing_notes" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "note_type" VARCHAR(50) NOT NULL,
    "note" TEXT NOT NULL,
    "shift" VARCHAR(30),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,

    CONSTRAINT "ipd_nursing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_vital_signs" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "temperature_celsius" DECIMAL(5,2),
    "pulse_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "spo2" INTEGER,
    "blood_sugar" DECIMAL(8,2),
    "pain_score" INTEGER,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,

    CONSTRAINT "ipd_vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_doctor_rounds" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "round_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress_notes" TEXT,
    "examination" TEXT,
    "diagnosis" TEXT,
    "plan" TEXT,
    "orders" TEXT,
    "created_by" UUID,

    CONSTRAINT "ipd_doctor_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_medication_orders" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "medicine_name" VARCHAR(200) NOT NULL,
    "dosage" VARCHAR(100),
    "route" VARCHAR(50),
    "frequency" VARCHAR(100),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "instructions" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ORDERED',
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordered_by" UUID,

    CONSTRAINT "ipd_medication_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_medication_administrations" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "medication_order_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "administered_at" TIMESTAMP(3),
    "dose_given" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "administered_by" UUID,

    CONSTRAINT "ipd_medication_administrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_intake_outputs" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "record_type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "quantity_ml" DECIMAL(10,2) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,
    "notes" TEXT,

    CONSTRAINT "ipd_intake_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_discharge_summaries" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "discharge_type" "IpdDischargeType" NOT NULL,
    "final_diagnosis" TEXT NOT NULL,
    "hospital_course" TEXT,
    "procedures_done" TEXT,
    "condition_at_discharge" TEXT,
    "discharge_advice" TEXT,
    "discharge_medication" TEXT,
    "follow_up_date" DATE,
    "follow_up_instructions" TEXT,
    "prepared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prepared_by" UUID,

    CONSTRAINT "ipd_discharge_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ipd_wards_hospital_id_branch_id_idx" ON "ipd_wards"("hospital_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_wards_hospital_id_ward_code_key" ON "ipd_wards"("hospital_id", "ward_code");

-- CreateIndex
CREATE INDEX "ipd_rooms_ward_id_idx" ON "ipd_rooms"("ward_id");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_rooms_hospital_id_room_code_key" ON "ipd_rooms"("hospital_id", "room_code");

-- CreateIndex
CREATE INDEX "ipd_beds_room_id_bed_status_idx" ON "ipd_beds"("room_id", "bed_status");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_beds_hospital_id_bed_code_key" ON "ipd_beds"("hospital_id", "bed_code");

-- CreateIndex
CREATE INDEX "ipd_admissions_hospital_id_admission_date_idx" ON "ipd_admissions"("hospital_id", "admission_date");

-- CreateIndex
CREATE INDEX "ipd_admissions_patient_id_admission_date_idx" ON "ipd_admissions"("patient_id", "admission_date");

-- CreateIndex
CREATE INDEX "ipd_admissions_status_idx" ON "ipd_admissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_admissions_hospital_id_admission_number_key" ON "ipd_admissions"("hospital_id", "admission_number");

-- CreateIndex
CREATE INDEX "ipd_bed_allocations_admission_id_status_idx" ON "ipd_bed_allocations"("admission_id", "status");

-- CreateIndex
CREATE INDEX "ipd_bed_allocations_bed_id_status_idx" ON "ipd_bed_allocations"("bed_id", "status");

-- CreateIndex
CREATE INDEX "ipd_nursing_notes_admission_id_recorded_at_idx" ON "ipd_nursing_notes"("admission_id", "recorded_at");

-- CreateIndex
CREATE INDEX "ipd_vital_signs_admission_id_recorded_at_idx" ON "ipd_vital_signs"("admission_id", "recorded_at");

-- CreateIndex
CREATE INDEX "ipd_doctor_rounds_admission_id_round_date_idx" ON "ipd_doctor_rounds"("admission_id", "round_date");

-- CreateIndex
CREATE INDEX "ipd_medication_orders_admission_id_status_idx" ON "ipd_medication_orders"("admission_id", "status");

-- CreateIndex
CREATE INDEX "ipd_medication_administrations_medication_order_id_schedule_idx" ON "ipd_medication_administrations"("medication_order_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "ipd_intake_outputs_admission_id_recorded_at_idx" ON "ipd_intake_outputs"("admission_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_discharge_summaries_admission_id_key" ON "ipd_discharge_summaries"("admission_id");

-- CreateIndex
CREATE INDEX "ipd_discharge_summaries_hospital_id_idx" ON "ipd_discharge_summaries"("hospital_id");

-- AddForeignKey
ALTER TABLE "ipd_rooms" ADD CONSTRAINT "ipd_rooms_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "ipd_wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_beds" ADD CONSTRAINT "ipd_beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "ipd_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_bed_allocations" ADD CONSTRAINT "ipd_bed_allocations_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_bed_allocations" ADD CONSTRAINT "ipd_bed_allocations_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "ipd_beds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_nursing_notes" ADD CONSTRAINT "ipd_nursing_notes_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_vital_signs" ADD CONSTRAINT "ipd_vital_signs_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_doctor_rounds" ADD CONSTRAINT "ipd_doctor_rounds_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_medication_orders" ADD CONSTRAINT "ipd_medication_orders_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_medication_administrations" ADD CONSTRAINT "ipd_medication_administrations_medication_order_id_fkey" FOREIGN KEY ("medication_order_id") REFERENCES "ipd_medication_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_intake_outputs" ADD CONSTRAINT "ipd_intake_outputs_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_discharge_summaries" ADD CONSTRAINT "ipd_discharge_summaries_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
