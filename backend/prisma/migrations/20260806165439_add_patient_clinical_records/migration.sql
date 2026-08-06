-- CreateTable
CREATE TABLE "patient_insurances" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "provider_name" VARCHAR(150) NOT NULL,
    "policy_number" VARCHAR(100) NOT NULL,
    "member_id" VARCHAR(100),
    "plan_name" VARCHAR(150),
    "coverage_type" VARCHAR(60),
    "valid_from" DATE,
    "valid_to" DATE,
    "sum_insured" DECIMAL(14,2),
    "tpa_name" VARCHAR(150),
    "tpa_contact" VARCHAR(50),
    "preauth_required" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "allergen" VARCHAR(150) NOT NULL,
    "allergy_type" VARCHAR(60),
    "reaction" TEXT,
    "severity" VARCHAR(30),
    "onset_date" DATE,
    "source" VARCHAR(80),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chronic_diseases" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "disease_name" VARCHAR(150) NOT NULL,
    "diagnosis_date" DATE,
    "diagnosing_doctor" VARCHAR(150),
    "current_treatment" TEXT,
    "control_status" VARCHAR(50),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_chronic_diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medical_histories" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "history_type" VARCHAR(60) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_date" DATE,
    "provider" VARCHAR(150),
    "location" VARCHAR(150),
    "outcome" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_medical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_documents" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "document_type" VARCHAR(60) NOT NULL,
    "document_name" VARCHAR(200) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size" BIGINT,
    "document_date" DATE,
    "expiry_date" DATE,
    "description" TEXT,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_timeline_events" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "event_title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "source_module" VARCHAR(80),
    "source_entity_id" UUID,
    "event_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "patient_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_insurances_hospital_id_idx" ON "patient_insurances"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_insurances_patient_id_idx" ON "patient_insurances"("patient_id");

-- CreateIndex
CREATE INDEX "patient_insurances_valid_to_idx" ON "patient_insurances"("valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "patient_insurances_hospital_id_patient_id_policy_number_key" ON "patient_insurances"("hospital_id", "patient_id", "policy_number");

-- CreateIndex
CREATE INDEX "patient_allergies_hospital_id_idx" ON "patient_allergies"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_allergies_patient_id_idx" ON "patient_allergies"("patient_id");

-- CreateIndex
CREATE INDEX "patient_allergies_severity_idx" ON "patient_allergies"("severity");

-- CreateIndex
CREATE INDEX "patient_chronic_diseases_hospital_id_idx" ON "patient_chronic_diseases"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_chronic_diseases_patient_id_idx" ON "patient_chronic_diseases"("patient_id");

-- CreateIndex
CREATE INDEX "patient_medical_histories_hospital_id_idx" ON "patient_medical_histories"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_medical_histories_patient_id_idx" ON "patient_medical_histories"("patient_id");

-- CreateIndex
CREATE INDEX "patient_medical_histories_event_date_idx" ON "patient_medical_histories"("event_date");

-- CreateIndex
CREATE INDEX "patient_documents_hospital_id_idx" ON "patient_documents"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_documents_patient_id_idx" ON "patient_documents"("patient_id");

-- CreateIndex
CREATE INDEX "patient_documents_document_type_idx" ON "patient_documents"("document_type");

-- CreateIndex
CREATE INDEX "patient_timeline_events_hospital_id_idx" ON "patient_timeline_events"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_timeline_events_patient_id_event_at_idx" ON "patient_timeline_events"("patient_id", "event_at");

-- CreateIndex
CREATE INDEX "patient_timeline_events_event_type_idx" ON "patient_timeline_events"("event_type");

-- AddForeignKey
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chronic_diseases" ADD CONSTRAINT "patient_chronic_diseases_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chronic_diseases" ADD CONSTRAINT "patient_chronic_diseases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_timeline_events" ADD CONSTRAINT "patient_timeline_events_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_timeline_events" ADD CONSTRAINT "patient_timeline_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
