from pathlib import Path

schema_path = Path(__file__).resolve().parents[1] / "prisma" / "schema.prisma"
text = schema_path.read_text(encoding="utf-8")

hospital_marker = "  patientEmergencyContacts PatientEmergencyContact[]"
hospital_add = '''  patientInsurances        PatientInsurance[]
  patientAllergies          PatientAllergy[]
  patientChronicDiseases    PatientChronicDisease[]
  patientMedicalHistories   PatientMedicalHistory[]
  patientDocuments          PatientDocument[]
  patientTimelineEvents     PatientTimelineEvent[]'''

if hospital_add not in text:
    if hospital_marker not in text:
        raise SystemExit("Hospital patient relation marker was not found.")
    text = text.replace(hospital_marker, hospital_marker + "\n" + hospital_add)

patient_marker = "  emergencyContacts PatientEmergencyContact[]"
patient_add = '''  insurances         PatientInsurance[]
  allergies          PatientAllergy[]
  chronicDiseases    PatientChronicDisease[]
  medicalHistories   PatientMedicalHistory[]
  documents          PatientDocument[]
  timelineEvents     PatientTimelineEvent[]'''

if patient_add not in text:
    if patient_marker not in text:
        raise SystemExit("Patient relation marker was not found.")
    text = text.replace(patient_marker, patient_marker + "\n" + patient_add)

models = '''

model PatientInsurance {
  id         String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId  String @map("patient_id") @db.Uuid
  providerName String @map("provider_name") @db.VarChar(150)
  policyNumber String @map("policy_number") @db.VarChar(100)
  memberId String? @map("member_id") @db.VarChar(100)
  planName String? @map("plan_name") @db.VarChar(150)
  coverageType String? @map("coverage_type") @db.VarChar(60)
  validFrom DateTime? @map("valid_from") @db.Date
  validTo DateTime? @map("valid_to") @db.Date
  sumInsured Decimal? @map("sum_insured") @db.Decimal(14, 2)
  tpaName String? @map("tpa_name") @db.VarChar(150)
  tpaContact String? @map("tpa_contact") @db.VarChar(50)
  preAuthRequired Boolean @default(false) @map("preauth_required")
  isPrimary Boolean @default(false) @map("is_primary")
  notes String?
  status RecordStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String? @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@unique([hospitalId, patientId, policyNumber])
  @@index([hospitalId])
  @@index([patientId])
  @@index([validTo])
  @@map("patient_insurances")
}

model PatientAllergy {
  id String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  allergen String @db.VarChar(150)
  allergyType String? @map("allergy_type") @db.VarChar(60)
  reaction String?
  severity String? @db.VarChar(30)
  onsetDate DateTime? @map("onset_date") @db.Date
  source String? @db.VarChar(80)
  verified Boolean @default(false)
  verifiedBy String? @map("verified_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at")
  notes String?
  status RecordStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String? @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([hospitalId])
  @@index([patientId])
  @@index([severity])
  @@map("patient_allergies")
}

model PatientChronicDisease {
  id String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  diseaseName String @map("disease_name") @db.VarChar(150)
  diagnosisDate DateTime? @map("diagnosis_date") @db.Date
  diagnosingDoctor String? @map("diagnosing_doctor") @db.VarChar(150)
  currentTreatment String? @map("current_treatment")
  controlStatus String? @map("control_status") @db.VarChar(50)
  notes String?
  status RecordStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String? @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([hospitalId])
  @@index([patientId])
  @@map("patient_chronic_diseases")
}

model PatientMedicalHistory {
  id String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  historyType String @map("history_type") @db.VarChar(60)
  title String @db.VarChar(200)
  description String?
  eventDate DateTime? @map("event_date") @db.Date
  provider String? @db.VarChar(150)
  location String? @db.VarChar(150)
  outcome String?
  notes String?
  status RecordStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String? @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([hospitalId])
  @@index([patientId])
  @@index([eventDate])
  @@map("patient_medical_histories")
}

model PatientDocument {
  id String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  documentType String @map("document_type") @db.VarChar(60)
  documentName String @map("document_name") @db.VarChar(200)
  filePath String @map("file_path")
  mimeType String? @map("mime_type") @db.VarChar(100)
  fileSize BigInt? @map("file_size")
  documentDate DateTime? @map("document_date") @db.Date
  expiryDate DateTime? @map("expiry_date") @db.Date
  description String?
  confidential Boolean @default(false)
  verified Boolean @default(false)
  verifiedBy String? @map("verified_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at")
  status RecordStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String? @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([hospitalId])
  @@index([patientId])
  @@index([documentType])
  @@map("patient_documents")
}

model PatientTimelineEvent {
  id String @id @default(uuid()) @db.Uuid
  hospitalId String @map("hospital_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  eventType String @map("event_type") @db.VarChar(80)
  eventTitle String @map("event_title") @db.VarChar(200)
  description String?
  sourceModule String? @map("source_module") @db.VarChar(80)
  sourceEntityId String? @map("source_entity_id") @db.Uuid
  eventAt DateTime @default(now()) @map("event_at")
  metadata Json?
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String? @map("created_by") @db.Uuid
  hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Restrict)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([hospitalId])
  @@index([patientId, eventAt])
  @@index([eventType])
  @@map("patient_timeline_events")
}
'''

if "model PatientInsurance {" not in text:
    text = text.rstrip() + models + "\n"

schema_path.write_text(text, encoding="utf-8")
print(f"Updated {schema_path}")
