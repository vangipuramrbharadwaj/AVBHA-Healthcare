-- CreateEnum
CREATE TYPE "OtRoomStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OtBookingStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'PRE_OP_READY', 'PATIENT_IN_OT', 'IN_PROGRESS', 'COMPLETED', 'RECOVERY', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "OtBookingPriority" AS ENUM ('ELECTIVE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "OtTeamRole" AS ENUM ('PRIMARY_SURGEON', 'ASSISTANT_SURGEON', 'ANAESTHETIST', 'SCRUB_NURSE', 'CIRCULATING_NURSE', 'TECHNICIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "OtChecklistStatus" AS ENUM ('PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED');

-- CreateEnum
CREATE TYPE "OtAnaesthesiaType" AS ENUM ('GENERAL', 'SPINAL', 'EPIDURAL', 'LOCAL', 'REGIONAL', 'SEDATION', 'COMBINED', 'OTHER');

-- CreateEnum
CREATE TYPE "OtRecoveryStatus" AS ENUM ('PENDING', 'IN_RECOVERY', 'STABLE', 'TRANSFERRED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "OtComplicationSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateTable
CREATE TABLE "ot_rooms" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "room_code" VARCHAR(30) NOT NULL,
    "room_name" VARCHAR(120) NOT NULL,
    "floor" VARCHAR(50),
    "room_type" VARCHAR(80),
    "equipment_notes" TEXT,
    "status" "OtRoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "ot_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_procedure_catalog" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "procedure_code" VARCHAR(40) NOT NULL,
    "procedure_name" VARCHAR(200) NOT NULL,
    "speciality" VARCHAR(120),
    "estimated_minutes" INTEGER,
    "base_charge" DECIMAL(14,2),
    "default_anaesthesia_type" "OtAnaesthesiaType",
    "preparation_instructions" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ot_procedure_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_bookings" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "ipd_admission_id" UUID,
    "opd_visit_id" UUID,
    "ot_room_id" UUID NOT NULL,
    "procedure_id" UUID NOT NULL,
    "booking_number" VARCHAR(40) NOT NULL,
    "priority" "OtBookingPriority" NOT NULL DEFAULT 'ELECTIVE',
    "status" "OtBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "primary_surgeon_id" UUID NOT NULL,
    "anaesthetist_id" UUID,
    "pre_operative_diagnosis" TEXT,
    "post_operative_diagnosis" TEXT,
    "indication" TEXT,
    "special_instructions" TEXT,
    "estimated_blood_loss_ml" INTEGER,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "ot_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_booking_team" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "role" "OtTeamRole" NOT NULL,
    "lead" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_booking_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_checklist_items" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "phase" VARCHAR(50) NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_label" VARCHAR(250) NOT NULL,
    "status" "OtChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_consents" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "consent_type" VARCHAR(80) NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "consented_at" TIMESTAMP(3),
    "consented_by_name" VARCHAR(150),
    "relationship" VARCHAR(80),
    "witness_name" VARCHAR(150),
    "document_path" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "ot_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_anaesthesia_assessments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "anaesthesia_type" "OtAnaesthesiaType" NOT NULL,
    "asa_grade" VARCHAR(20),
    "airway_assessment" TEXT,
    "allergies" TEXT,
    "comorbidities" TEXT,
    "fasting_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "pre_medication" TEXT,
    "special_risks" TEXT,
    "fit_for_anaesthesia" BOOLEAN NOT NULL DEFAULT false,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_anaesthesia_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_intraoperative_notes" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "note_type" VARCHAR(50) NOT NULL,
    "note" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID NOT NULL,
    "blood_loss_ml" INTEGER,
    "urine_output_ml" INTEGER,
    "fluids_given_ml" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_intraoperative_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_consumables" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "item_code" VARCHAR(60),
    "item_name" VARCHAR(200) NOT NULL,
    "batch_number" VARCHAR(80),
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30),
    "unit_cost" DECIMAL(14,2),
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "ot_consumables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_implants" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "implant_name" VARCHAR(200) NOT NULL,
    "manufacturer" VARCHAR(150),
    "serial_number" VARCHAR(120),
    "batch_number" VARCHAR(80),
    "expiry_date" DATE,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(14,2),
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "ot_implants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_specimens" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "specimen_number" VARCHAR(50) NOT NULL,
    "specimen_type" VARCHAR(120) NOT NULL,
    "site" VARCHAR(120),
    "investigation" VARCHAR(150),
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collected_by" UUID,
    "sent_to_lab_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_specimens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_recovery_records" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "status" "OtRecoveryStatus" NOT NULL DEFAULT 'PENDING',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID NOT NULL,
    "consciousness_level" VARCHAR(80),
    "pain_score" INTEGER,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "pulse_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "spo2" INTEGER,
    "temperature_celsius" DECIMAL(5,2),
    "nausea_vomiting" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_recovery_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_complications" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "complication_type" VARCHAR(120) NOT NULL,
    "severity" "OtComplicationSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "action_taken" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reported_by" UUID NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_complications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ot_rooms_hospital_id_branch_id_status_idx" ON "ot_rooms"("hospital_id", "branch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ot_rooms_hospital_id_branch_id_room_code_key" ON "ot_rooms"("hospital_id", "branch_id", "room_code");

-- CreateIndex
CREATE INDEX "ot_procedure_catalog_hospital_id_status_idx" ON "ot_procedure_catalog"("hospital_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ot_procedure_catalog_hospital_id_procedure_code_key" ON "ot_procedure_catalog"("hospital_id", "procedure_code");

-- CreateIndex
CREATE INDEX "ot_bookings_hospital_id_scheduled_start_idx" ON "ot_bookings"("hospital_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "ot_bookings_patient_id_scheduled_start_idx" ON "ot_bookings"("patient_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "ot_bookings_ot_room_id_scheduled_start_scheduled_end_idx" ON "ot_bookings"("ot_room_id", "scheduled_start", "scheduled_end");

-- CreateIndex
CREATE INDEX "ot_bookings_primary_surgeon_id_scheduled_start_scheduled_en_idx" ON "ot_bookings"("primary_surgeon_id", "scheduled_start", "scheduled_end");

-- CreateIndex
CREATE INDEX "ot_bookings_status_idx" ON "ot_bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ot_bookings_hospital_id_booking_number_key" ON "ot_bookings"("hospital_id", "booking_number");

-- CreateIndex
CREATE INDEX "ot_booking_team_hospital_id_idx" ON "ot_booking_team"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_booking_team_employee_id_idx" ON "ot_booking_team"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "ot_booking_team_booking_id_employee_id_role_key" ON "ot_booking_team"("booking_id", "employee_id", "role");

-- CreateIndex
CREATE INDEX "ot_checklist_items_hospital_id_idx" ON "ot_checklist_items"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_checklist_items_booking_id_phase_idx" ON "ot_checklist_items"("booking_id", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "ot_checklist_items_booking_id_phase_item_code_key" ON "ot_checklist_items"("booking_id", "phase", "item_code");

-- CreateIndex
CREATE INDEX "ot_consents_hospital_id_idx" ON "ot_consents"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_consents_booking_id_idx" ON "ot_consents"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "ot_anaesthesia_assessments_booking_id_key" ON "ot_anaesthesia_assessments"("booking_id");

-- CreateIndex
CREATE INDEX "ot_anaesthesia_assessments_hospital_id_idx" ON "ot_anaesthesia_assessments"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_intraoperative_notes_hospital_id_idx" ON "ot_intraoperative_notes"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_intraoperative_notes_booking_id_recorded_at_idx" ON "ot_intraoperative_notes"("booking_id", "recorded_at");

-- CreateIndex
CREATE INDEX "ot_consumables_hospital_id_idx" ON "ot_consumables"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_consumables_booking_id_idx" ON "ot_consumables"("booking_id");

-- CreateIndex
CREATE INDEX "ot_implants_hospital_id_idx" ON "ot_implants"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_implants_booking_id_idx" ON "ot_implants"("booking_id");

-- CreateIndex
CREATE INDEX "ot_specimens_booking_id_idx" ON "ot_specimens"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "ot_specimens_hospital_id_specimen_number_key" ON "ot_specimens"("hospital_id", "specimen_number");

-- CreateIndex
CREATE INDEX "ot_recovery_records_hospital_id_idx" ON "ot_recovery_records"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_recovery_records_booking_id_recorded_at_idx" ON "ot_recovery_records"("booking_id", "recorded_at");

-- CreateIndex
CREATE INDEX "ot_complications_hospital_id_idx" ON "ot_complications"("hospital_id");

-- CreateIndex
CREATE INDEX "ot_complications_booking_id_occurred_at_idx" ON "ot_complications"("booking_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ot_complications_severity_idx" ON "ot_complications"("severity");

-- AddForeignKey
ALTER TABLE "ot_bookings" ADD CONSTRAINT "ot_bookings_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_bookings" ADD CONSTRAINT "ot_bookings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_bookings" ADD CONSTRAINT "ot_bookings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_bookings" ADD CONSTRAINT "ot_bookings_ot_room_id_fkey" FOREIGN KEY ("ot_room_id") REFERENCES "ot_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_bookings" ADD CONSTRAINT "ot_bookings_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "ot_procedure_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_booking_team" ADD CONSTRAINT "ot_booking_team_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_checklist_items" ADD CONSTRAINT "ot_checklist_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_consents" ADD CONSTRAINT "ot_consents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_anaesthesia_assessments" ADD CONSTRAINT "ot_anaesthesia_assessments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_intraoperative_notes" ADD CONSTRAINT "ot_intraoperative_notes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_consumables" ADD CONSTRAINT "ot_consumables_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_implants" ADD CONSTRAINT "ot_implants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_specimens" ADD CONSTRAINT "ot_specimens_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_recovery_records" ADD CONSTRAINT "ot_recovery_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_complications" ADD CONSTRAINT "ot_complications_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "ot_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
