import fs from "node:fs";

const checks = [
  ["prisma/schema.prisma", "enum CommunicationChannel {"],
  ["prisma/schema.prisma", "model CommunicationMessage {"],
  ["prisma/schema.prisma", "model CommunicationTemplate {"],
  ["prisma/schema.prisma", "model CommunicationPreference {"],
  ["src/app.ts", 'app.use("/api/v1/communications", communicationsRouter);'],
  ["src/modules/communications/communications.routes.ts", "authenticate, enforceTenant"],
  ["src/modules/communications/communications.service.ts", "COMMUNICATION_PROVIDER_NOT_CONFIGURED"],
];

for (const [file, marker] of checks) {
  if (!fs.existsSync(file)) {
    throw new Error(`Phase 13 audit failed: ${file} is missing`);
  }

  if (!fs.readFileSync(file, "utf8").includes(marker)) {
    throw new Error(
      `Phase 13 audit failed: ${marker} missing from ${file}`,
    );
  }
}

console.log(
  "Phase 13 Notification & Communication source audit completed successfully.",
);
