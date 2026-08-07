import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const checks = [
  [
    "src/modules/patients/patients.repository.ts",
    "PHASE 11.2B: centralized UHID allocator",
  ],
  [
    "src/modules/appointments/appointments.service.ts",
    "PHASE 11.2B: nextNumber",
  ],
  [
    "src/modules/opd/opd.service.ts",
    "PHASE 11.2B: nextVisitNumber",
  ],
  [
    "src/modules/ipd/ipd.service.ts",
    "PHASE 11.2B: nextAdmissionNumber",
  ],
  [
    "src/modules/laboratory/laboratory.service.ts",
    "PHASE 11.2B: nextOrderNumber",
  ],
  [
    "src/modules/radiology/radiology.service.ts",
    "PHASE 11.2B: nextOrderNumber",
  ],
  [
    "src/modules/pharmacy/pharmacy.service.ts",
    "PHASE 11.2B: pharmacy document allocator",
  ],
  [
    "src/modules/billing/billing.service.ts",
    "PHASE 11.2B: billing document allocator",
  ],
  [
    "src/modules/operation-theatre/operation-theatre.service.ts",
    "PHASE 11.2B: nextBookingNumber",
  ],
];

for (const [relativePath, marker] of checks) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${relativePath}`);
  }

  const text = fs.readFileSync(file, "utf8");

  if (!text.includes(marker)) {
    throw new Error(
      `Replacement marker was not found in ${relativePath}`,
    );
  }
}

const queueFile = path.join(
  root,
  "src/modules/appointments/appointment-queue.service.ts",
);

const queueText = fs.readFileSync(queueFile, "utf8");

if (
  !queueText.includes(
    "nextTokenNumber: { increment: 1 }",
  )
) {
  throw new Error(
    "Existing atomic appointment queue token increment was not found",
  );
}

console.log(
  "Phase 11.2B source verification completed successfully.",
);
