-- CreateTable
CREATE TABLE "document_sequences" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "branch_id" UUID,
    "scope_key" VARCHAR(64) NOT NULL,
    "document_type" VARCHAR(60) NOT NULL,
    "period_key" VARCHAR(20) NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "current_value" BIGINT NOT NULL DEFAULT 0,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_sequences_hospital_id_document_type_idx" ON "document_sequences"("hospital_id", "document_type");

-- CreateIndex
CREATE INDEX "document_sequences_branch_id_idx" ON "document_sequences"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_hospital_id_scope_key_document_type_peri_key" ON "document_sequences"("hospital_id", "scope_key", "document_type", "period_key");
