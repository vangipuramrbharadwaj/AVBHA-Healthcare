-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "slot_duration" INTEGER NOT NULL DEFAULT 15,
    "max_appointments" INTEGER,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedule_breaks" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "break_name" VARCHAR(100) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "doctor_schedule_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedule_holidays" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "holiday_date" DATE NOT NULL,
    "reason" VARCHAR(300),
    "all_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "doctor_schedule_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_slot_locks" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID,
    "lock_token" VARCHAR(100) NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "appointment_slot_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_schedules_hospital_id_idx" ON "doctor_schedules"("hospital_id");

-- CreateIndex
CREATE INDEX "doctor_schedules_branch_id_idx" ON "doctor_schedules"("branch_id");

-- CreateIndex
CREATE INDEX "doctor_schedules_doctor_id_day_of_week_idx" ON "doctor_schedules"("doctor_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedules_hospital_id_branch_id_doctor_id_day_of_wee_key" ON "doctor_schedules"("hospital_id", "branch_id", "doctor_id", "day_of_week", "start_time", "effective_from");

-- CreateIndex
CREATE INDEX "doctor_schedule_breaks_hospital_id_idx" ON "doctor_schedule_breaks"("hospital_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_breaks_doctor_id_idx" ON "doctor_schedule_breaks"("doctor_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_breaks_schedule_id_idx" ON "doctor_schedule_breaks"("schedule_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_holidays_hospital_id_idx" ON "doctor_schedule_holidays"("hospital_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_holidays_branch_id_idx" ON "doctor_schedule_holidays"("branch_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_holidays_doctor_id_holiday_date_idx" ON "doctor_schedule_holidays"("doctor_id", "holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_slot_locks_lock_token_key" ON "appointment_slot_locks"("lock_token");

-- CreateIndex
CREATE INDEX "appointment_slot_locks_hospital_id_idx" ON "appointment_slot_locks"("hospital_id");

-- CreateIndex
CREATE INDEX "appointment_slot_locks_branch_id_idx" ON "appointment_slot_locks"("branch_id");

-- CreateIndex
CREATE INDEX "appointment_slot_locks_doctor_id_slot_start_idx" ON "appointment_slot_locks"("doctor_id", "slot_start");

-- CreateIndex
CREATE INDEX "appointment_slot_locks_expires_at_idx" ON "appointment_slot_locks"("expires_at");

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "hospital_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedule_breaks" ADD CONSTRAINT "doctor_schedule_breaks_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "doctor_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedule_holidays" ADD CONSTRAINT "doctor_schedule_holidays_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_slot_locks" ADD CONSTRAINT "appointment_slot_locks_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
