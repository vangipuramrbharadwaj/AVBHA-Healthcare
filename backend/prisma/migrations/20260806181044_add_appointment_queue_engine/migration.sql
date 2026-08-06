-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QueueEntryStatus" AS ENUM ('WAITING', 'CALLED', 'IN_PROGRESS', 'HELD', 'SKIPPED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "QueuePriority" AS ENUM ('NORMAL', 'PRIORITY', 'VIP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "QueueSource" AS ENUM ('APPOINTMENT', 'WALK_IN', 'EMERGENCY');

-- CreateTable
CREATE TABLE "appointment_queues" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "queue_date" DATE NOT NULL,
    "queue_code" VARCHAR(30) NOT NULL,
    "token_prefix" VARCHAR(10) NOT NULL DEFAULT 'A',
    "next_token_number" INTEGER NOT NULL DEFAULT 1,
    "current_token" VARCHAR(30),
    "status" "QueueStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "appointment_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_queue_entries" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_id" UUID,
    "queue_id" UUID NOT NULL,
    "token_number" INTEGER NOT NULL,
    "token_code" VARCHAR(30) NOT NULL,
    "priority" "QueuePriority" NOT NULL DEFAULT 'NORMAL',
    "source" "QueueSource" NOT NULL DEFAULT 'APPOINTMENT',
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'WAITING',
    "check_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "called_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "held_at" TIMESTAMP(3),
    "skipped_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "appointment_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointment_queues_hospital_id_queue_date_idx" ON "appointment_queues"("hospital_id", "queue_date");

-- CreateIndex
CREATE INDEX "appointment_queues_branch_id_queue_date_idx" ON "appointment_queues"("branch_id", "queue_date");

-- CreateIndex
CREATE INDEX "appointment_queues_department_id_queue_date_idx" ON "appointment_queues"("department_id", "queue_date");

-- CreateIndex
CREATE INDEX "appointment_queues_doctor_id_queue_date_idx" ON "appointment_queues"("doctor_id", "queue_date");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_queues_hospital_id_branch_id_doctor_id_queue_da_key" ON "appointment_queues"("hospital_id", "branch_id", "doctor_id", "queue_date");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_queue_entries_appointment_id_key" ON "appointment_queue_entries"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_queue_entries_hospital_id_check_in_at_idx" ON "appointment_queue_entries"("hospital_id", "check_in_at");

-- CreateIndex
CREATE INDEX "appointment_queue_entries_queue_id_status_idx" ON "appointment_queue_entries"("queue_id", "status");

-- CreateIndex
CREATE INDEX "appointment_queue_entries_doctor_id_check_in_at_idx" ON "appointment_queue_entries"("doctor_id", "check_in_at");

-- CreateIndex
CREATE INDEX "appointment_queue_entries_patient_id_check_in_at_idx" ON "appointment_queue_entries"("patient_id", "check_in_at");

-- CreateIndex
CREATE INDEX "appointment_queue_entries_priority_status_idx" ON "appointment_queue_entries"("priority", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_queue_entries_queue_id_token_number_key" ON "appointment_queue_entries"("queue_id", "token_number");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_queue_entries_queue_id_token_code_key" ON "appointment_queue_entries"("queue_id", "token_code");

-- AddForeignKey
ALTER TABLE "appointment_queues" ADD CONSTRAINT "appointment_queues_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queues" ADD CONSTRAINT "appointment_queues_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queues" ADD CONSTRAINT "appointment_queues_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queues" ADD CONSTRAINT "appointment_queues_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_queue_entries" ADD CONSTRAINT "appointment_queue_entries_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "appointment_queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
