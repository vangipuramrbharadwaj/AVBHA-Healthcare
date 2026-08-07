import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  throw new Error(`Prisma schema not found: ${schemaPath}. Run this script from the backend folder.`);
}

let schema = fs.readFileSync(schemaPath, "utf8");
schema = schema.replace(/\nmodel\s+DocumentSequence\s*\{[\s\S]*?\n\}/m, "");

const model = `
model DocumentSequence {
  id           String   @id @default(uuid()) @db.Uuid
  hospitalId   String   @map("hospital_id") @db.Uuid
  branchId     String?  @map("branch_id") @db.Uuid
  scopeKey     String   @map("scope_key") @db.VarChar(64)
  documentType String   @map("document_type") @db.VarChar(60)
  periodKey    String   @map("period_key") @db.VarChar(20)
  prefix       String   @db.VarChar(20)
  currentValue BigInt   @default(0) @map("current_value")
  padding      Int      @default(6)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([hospitalId, scopeKey, documentType, periodKey])
  @@index([hospitalId, documentType])
  @@index([branchId])
  @@map("document_sequences")
}
`;

schema = `${schema.trimEnd()}\n\n${model.trim()}\n`;
fs.writeFileSync(schemaPath, schema, "utf8");
console.log("DocumentSequence Prisma model applied successfully");
