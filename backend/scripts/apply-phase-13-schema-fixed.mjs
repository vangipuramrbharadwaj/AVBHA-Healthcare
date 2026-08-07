import fs from "node:fs";

const schemaPath = "prisma/schema.prisma";
const backupPath = "prisma/schema.prisma.phase13.backup";
const marker = "// ===== PHASE 13: NOTIFICATION & COMMUNICATION ENGINE =====";

if (!fs.existsSync(schemaPath)) {
  throw new Error("prisma/schema.prisma was not found");
}

let schema = fs.readFileSync(schemaPath, "utf8");

const markerIndex = schema.indexOf(marker);

if (markerIndex >= 0) {
  schema = schema.slice(0, markerIndex).trimEnd() + "\n";
} else if (fs.existsSync(backupPath)) {
  schema = fs.readFileSync(backupPath, "utf8").trimEnd() + "\n";
}

const block = fs.readFileSync("phase13-schema.prisma", "utf8").trim();

fs.writeFileSync(
  schemaPath,
  `${schema.trimEnd()}\n\n${block}\n`,
  "utf8",
);

console.log("Corrected Phase 13 Prisma schema applied successfully.");
