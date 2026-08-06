-- CreateTable
CREATE TABLE "patient_family_relationships" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "related_patient_id" UUID NOT NULL,
    "relationship_type" VARCHAR(60) NOT NULL,
    "is_emergency_contact" BOOLEAN NOT NULL DEFAULT false,
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_alerts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "alert_type" VARCHAR(60) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMP(3),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_merge_requests" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "source_patient_id" UUID NOT NULL,
    "target_patient_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "merge_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_merge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_identifiers" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "identifier_type" VARCHAR(40) NOT NULL,
    "identifier_value" VARCHAR(200) NOT NULL,
    "display_value" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_family_relationships_hospital_id_idx" ON "patient_family_relationships"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_family_relationships_patient_id_idx" ON "patient_family_relationships"("patient_id");

-- CreateIndex
CREATE INDEX "patient_family_relationships_related_patient_id_idx" ON "patient_family_relationships"("related_patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_family_relationships_hospital_id_patient_id_related_key" ON "patient_family_relationships"("hospital_id", "patient_id", "related_patient_id", "relationship_type");

-- CreateIndex
CREATE INDEX "patient_alerts_hospital_id_idx" ON "patient_alerts"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_alerts_patient_id_active_idx" ON "patient_alerts"("patient_id", "active");

-- CreateIndex
CREATE INDEX "patient_alerts_severity_idx" ON "patient_alerts"("severity");

-- CreateIndex
CREATE INDEX "patient_merge_requests_hospital_id_idx" ON "patient_merge_requests"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_merge_requests_source_patient_id_idx" ON "patient_merge_requests"("source_patient_id");

-- CreateIndex
CREATE INDEX "patient_merge_requests_target_patient_id_idx" ON "patient_merge_requests"("target_patient_id");

-- CreateIndex
CREATE INDEX "patient_merge_requests_status_idx" ON "patient_merge_requests"("status");

-- CreateIndex
CREATE INDEX "patient_identifiers_hospital_id_idx" ON "patient_identifiers"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_identifiers_patient_id_idx" ON "patient_identifiers"("patient_id");

-- CreateIndex
CREATE INDEX "patient_identifiers_active_idx" ON "patient_identifiers"("active");

-- CreateIndex
CREATE UNIQUE INDEX "patient_identifiers_hospital_id_identifier_type_identifier__key" ON "patient_identifiers"("hospital_id", "identifier_type", "identifier_value");

-- AddForeignKey
ALTER TABLE "patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_related_patient_id_fkey" FOREIGN KEY ("related_patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_alerts" ADD CONSTRAINT "patient_alerts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_alerts" ADD CONSTRAINT "patient_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_source_patient_id_fkey" FOREIGN KEY ("source_patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_target_patient_id_fkey" FOREIGN KEY ("target_patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
