from pathlib import Path
import re

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

def replace_model(source: str, model_name: str, updater):
    pattern = re.compile(rf"model\s+{re.escape(model_name)}\s*\{{.*?\n\}}", re.S)
    match = pattern.search(source)
    if not match:
        raise SystemExit(f"Model {model_name} was not found")
    updated = updater(match.group(0))
    return source[:match.start()] + updated + source[match.end():]

def normalize_relations(block: str, prefixes: list[str], additions: list[str]) -> str:
    lines = []
    for line in block.splitlines():
        stripped = line.strip()
        if any(stripped.startswith(prefix) for prefix in prefixes):
            continue
        lines.append(line)

    map_index = next(
        (i for i, line in enumerate(lines) if line.strip().startswith("@@map(")),
        None,
    )
    if map_index is None:
        raise SystemExit("Could not find @@map marker")

    for addition in additions:
        lines.insert(map_index, addition)
        map_index += 1

    return "\n".join(lines)

text = replace_model(
    text,
    "Hospital",
    lambda block: normalize_relations(
        block,
        [
            "patientFamilyRelationships",
            "patientAlerts",
            "patientMergeRequests",
            "patientIdentifiers",
        ],
        [
            "  patientFamilyRelationships PatientFamilyRelationship[]",
            "  patientAlerts              PatientAlert[]",
            "  patientMergeRequests       PatientMergeRequest[]",
            "  patientIdentifiers         PatientIdentifier[]",
        ],
    ),
)

text = replace_model(
    text,
    "Patient",
    lambda block: normalize_relations(
        block,
        [
            "patientFamilyRelationships",
            "patientAlerts",
            "patientMergeRequests",
            "patientIdentifiers",
            "familyRelationshipsFrom",
            "familyRelationshipsTo",
            "alerts",
            "mergeRequestsAsSource",
            "mergeRequestsAsTarget",
            "identifiers",
        ],
        [
            '  familyRelationshipsFrom PatientFamilyRelationship[] @relation("PatientFamilyFrom")',
            '  familyRelationshipsTo   PatientFamilyRelationship[] @relation("PatientFamilyTo")',
            "  alerts                  PatientAlert[]",
            '  mergeRequestsAsSource   PatientMergeRequest[] @relation("MergeSource")',
            '  mergeRequestsAsTarget   PatientMergeRequest[] @relation("MergeTarget")',
            "  identifiers             PatientIdentifier[]",
        ],
    ),
)

models = '''
model PatientFamilyRelationship {
  id                 String       @id @default(uuid()) @db.Uuid
  hospitalId         String       @map("hospital_id") @db.Uuid
  patientId          String       @map("patient_id") @db.Uuid
  relatedPatientId   String       @map("related_patient_id") @db.Uuid
  relationshipType   String       @map("relationship_type") @db.VarChar(60)
  isEmergencyContact Boolean      @default(false) @map("is_emergency_contact")
  isPrimaryContact   Boolean      @default(false) @map("is_primary_contact")
  notes              String?
  status             RecordStatus @default(ACTIVE)
  createdAt          DateTime     @default(now()) @map("created_at")
  createdBy          String?      @map("created_by") @db.Uuid
  updatedAt          DateTime     @updatedAt @map("updated_at")
  updatedBy          String?      @map("updated_by") @db.Uuid
  deletedAt          DateTime?    @map("deleted_at")

  hospital       Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient        Patient  @relation("PatientFamilyFrom", fields: [patientId], references: [id], onDelete: Cascade)
  relatedPatient Patient  @relation("PatientFamilyTo", fields: [relatedPatientId], references: [id], onDelete: Cascade)

  @@unique([hospitalId, patientId, relatedPatientId, relationshipType])
  @@index([hospitalId])
  @@index([patientId])
  @@index([relatedPatientId])
  @@map("patient_family_relationships")
}

model PatientAlert {
  id             String       @id @default(uuid()) @db.Uuid
  hospitalId     String       @map("hospital_id") @db.Uuid
  patientId      String       @map("patient_id") @db.Uuid
  alertType      String       @map("alert_type") @db.VarChar(60)
  title          String       @db.VarChar(200)
  description    String?
  severity       String       @default("INFO") @db.VarChar(20)
  startsAt       DateTime?    @map("starts_at")
  expiresAt      DateTime?    @map("expires_at")
  active         Boolean      @default(true)
  acknowledged   Boolean      @default(false)
  acknowledgedBy String?      @map("acknowledged_by") @db.Uuid
  acknowledgedAt DateTime?    @map("acknowledged_at")
  notes          String?
  status         RecordStatus @default(ACTIVE)
  createdAt      DateTime     @default(now()) @map("created_at")
  createdBy      String?      @map("created_by") @db.Uuid
  updatedAt      DateTime     @updatedAt @map("updated_at")
  updatedBy      String?      @map("updated_by") @db.Uuid
  deletedAt      DateTime?    @map("deleted_at")

  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient  Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([hospitalId])
  @@index([patientId, active])
  @@index([severity])
  @@index([expiresAt])
  @@map("patient_alerts")
}

model PatientMergeRequest {
  id              String    @id @default(uuid()) @db.Uuid
  hospitalId      String    @map("hospital_id") @db.Uuid
  sourcePatientId String    @map("source_patient_id") @db.Uuid
  targetPatientId String    @map("target_patient_id") @db.Uuid
  reason          String
  status          String    @default("PENDING") @db.VarChar(30)
  requestedBy     String    @map("requested_by") @db.Uuid
  requestedAt     DateTime  @default(now()) @map("requested_at")
  reviewedBy      String?   @map("reviewed_by") @db.Uuid
  reviewedAt      DateTime? @map("reviewed_at")
  reviewNotes     String?   @map("review_notes")
  completedAt     DateTime? @map("completed_at")
  mergeSummary    Json?     @map("merge_summary")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  hospital      Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  sourcePatient Patient  @relation("MergeSource", fields: [sourcePatientId], references: [id], onDelete: Restrict)
  targetPatient Patient  @relation("MergeTarget", fields: [targetPatientId], references: [id], onDelete: Restrict)

  @@index([hospitalId])
  @@index([sourcePatientId])
  @@index([targetPatientId])
  @@index([status])
  @@map("patient_merge_requests")
}

model PatientIdentifier {
  id              String    @id @default(uuid()) @db.Uuid
  hospitalId      String    @map("hospital_id") @db.Uuid
  patientId       String    @map("patient_id") @db.Uuid
  identifierType  String    @map("identifier_type") @db.VarChar(40)
  identifierValue String    @map("identifier_value") @db.VarChar(200)
  displayValue    String?   @map("display_value") @db.VarChar(200)
  active          Boolean   @default(true)
  issuedAt        DateTime? @map("issued_at")
  expiresAt       DateTime? @map("expires_at")
  metadata        Json?
  createdAt       DateTime  @default(now()) @map("created_at")
  createdBy       String?   @map("created_by") @db.Uuid
  updatedAt       DateTime  @updatedAt @map("updated_at")
  updatedBy       String?   @map("updated_by") @db.Uuid

  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient  Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([hospitalId, identifierType, identifierValue])
  @@index([hospitalId])
  @@index([patientId])
  @@index([active])
  @@map("patient_identifiers")
}
'''

for model_name in [
    "PatientFamilyRelationship",
    "PatientAlert",
    "PatientMergeRequest",
    "PatientIdentifier",
]:
    matches = list(
        re.finditer(
            rf"\nmodel\s+{model_name}\s*\{{.*?\n\}}",
            text,
            flags=re.S,
        )
    )
    for match in reversed(matches):
        text = text[:match.start()] + text[match.end():]

text = text.rstrip() + "\n\n" + models.strip() + "\n"
schema_path.write_text(text, encoding="utf-8")
print("Patient Package 3 Prisma schema applied successfully")
