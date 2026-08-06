-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'HEALTH_CHECK', 'VACCINATION', 'TELECONSULTATION', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentVisitType" AS ENUM ('NEW', 'FOLLOW_UP', 'REVIEW');

-- CreateEnum
CREATE TYPE "AppointmentPriority" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "appointment_number" VARCHAR(40) NOT NULL,
    "appointment_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "appointment_type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "visit_type" "AppointmentVisitType" NOT NULL DEFAULT 'NEW',
    "priority" "AppointmentPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "chief_complaint" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "source" VARCHAR(50),
    "referred_by" VARCHAR(150),
    "confirmation_mode" VARCHAR(30),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "rescheduled_from_id" UUID,
    "checked_in_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_hospital_id_appointment_date_idx" ON "appointments"("hospital_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_branch_id_appointment_date_idx" ON "appointments"("branch_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_department_id_appointment_date_idx" ON "appointments"("department_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_start_time_idx" ON "appointments"("doctor_id", "start_time");

-- CreateIndex
CREATE INDEX "appointments_patient_id_appointment_date_idx" ON "appointments"("patient_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_hospital_id_appointment_number_key" ON "appointments"("hospital_id", "appointment_number");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
