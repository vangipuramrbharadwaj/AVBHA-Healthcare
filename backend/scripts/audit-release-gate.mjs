import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Release gate required file is missing: ${relativePath}`,
    );
  }

  return fs.readFileSync(absolutePath, "utf8");
}

const requiredFiles = [
  "prisma/schema.prisma",
  "src/server.ts",
  "src/app.ts",
  "src/shared/http/api-response.ts",
  "src/shared/sequences/document-sequence.service.ts",
  "src/shared/sequences/document-number.presets.ts",
  "src/integration/health.integration.test.ts",
  "src/integration/error-handling.integration.test.ts",
  "src/modules/system-health/system-health.routes.ts",
];

for (const relativePath of requiredFiles) {
  read(relativePath);
}

const schema = read("prisma/schema.prisma");

const requiredModels = [
  "Hospital",
  "HospitalBranch",
  "Department",
  "Designation",
  "Employee",
  "Doctor",
  "Patient",
  "Appointment",
  "AppointmentQueue",
  "OpdVisit",
  "IpdAdmission",
  "LabOrder",
  "RadiologyOrder",
  "PharmacyMedicine",
  "BillingInvoice",
  "OtBooking",
  "DocumentSequence",
];

for (const model of requiredModels) {
  if (!schema.includes(`model ${model} {`)) {
    throw new Error(
      `Required Prisma model is missing: ${model}`,
    );
  }
}

const app = read("src/app.ts");

const requiredAppMounts = [
  'app.use("/api/v1/patients"',
  'app.use("/api/v1/appointments"',
  'app.use("/api/v1/opd"',
  'app.use("/api/v1/ipd"',
  'app.use("/api/v1/laboratory"',
  'app.use("/api/v1/radiology"',
  'app.use("/api/v1/pharmacy"',
  'app.use("/api/v1/billing"',
  'app.use("/api/v1/operation-theatre"',
  'app.use("/api/v1", systemHealthRouter)',
  "app.use(requestTraceMiddleware)",
  "app.use(standardNotFoundMiddleware)",
  "app.use(standardErrorMiddleware)",
];

for (const marker of requiredAppMounts) {
  if (!app.includes(marker)) {
    throw new Error(
      `Required app integration marker is missing: ${marker}`,
    );
  }
}

/*
 * IMPORTANT:
 * We intentionally DO NOT fail merely because a module contains
 * prisma.<model>.count(...). Count queries are valid for pagination,
 * dashboards and statistics.
 *
 * Instead, verify the exact Phase 11.2B replacement markers that were
 * inserted into each legacy number-generator function.
 */
const centralizedGeneratorChecks = [
  [
    "src/modules/patients/patients.repository.ts",
    "PHASE 11.2B: centralized UHID allocator",
    "Patient UHID",
  ],
  [
    "src/modules/appointments/appointments.service.ts",
    "PHASE 11.2B: nextNumber",
    "Appointment number",
  ],
  [
    "src/modules/opd/opd.service.ts",
    "PHASE 11.2B: nextVisitNumber",
    "OPD visit number",
  ],
  [
    "src/modules/ipd/ipd.service.ts",
    "PHASE 11.2B: nextAdmissionNumber",
    "IPD admission number",
  ],
  [
    "src/modules/laboratory/laboratory.service.ts",
    "PHASE 11.2B: nextOrderNumber",
    "Laboratory order number",
  ],
  [
    "src/modules/radiology/radiology.service.ts",
    "PHASE 11.2B: nextOrderNumber",
    "Radiology order number",
  ],
  [
    "src/modules/pharmacy/pharmacy.service.ts",
    "PHASE 11.2B: pharmacy document allocator",
    "Pharmacy document numbers",
  ],
  [
    "src/modules/billing/billing.service.ts",
    "PHASE 11.2B: billing document allocator",
    "Billing document numbers",
  ],
  [
    "src/modules/operation-theatre/operation-theatre.service.ts",
    "PHASE 11.2B: nextBookingNumber",
    "OT booking number",
  ],
  [
    "src/modules/operation-theatre/operation-theatre.service.ts",
    "PHASE 11.2B: nextSpecimenNumber",
    "OT specimen number",
  ],
];

for (const [relativePath, marker, label] of centralizedGeneratorChecks) {
  const text = read(relativePath);

  if (!text.includes(marker)) {
    throw new Error(
      `${label} is not using the Phase 11.2B centralized sequence engine`,
    );
  }
}

const presets = read(
  "src/shared/sequences/document-number.presets.ts",
);

const requiredPresetFunctions = [
  "nextPatientUhid",
  "nextAppointmentNumber",
  "nextOpdVisitNumber",
  "nextIpdAdmissionNumber",
  "nextLabOrderNumber",
  "nextRadiologyOrderNumber",
  "nextPharmacyPurchaseNumber",
  "nextPharmacyGrnNumber",
  "nextPharmacySaleNumber",
  "nextPharmacyDispenseNumber",
  "nextBillingInvoiceNumber",
  "nextBillingReceiptNumber",
  "nextBillingRefundNumber",
  "nextBillingAdvanceNumber",
  "nextOtBookingNumber",
  "nextOtSpecimenNumber",
];

for (const functionName of requiredPresetFunctions) {
  if (!presets.includes(`function ${functionName}`)) {
    throw new Error(
      `Centralized document-number preset is missing: ${functionName}`,
    );
  }
}

const queueService = read(
  "src/modules/appointments/appointment-queue.service.ts",
);

if (
  !queueService.includes(
    "nextTokenNumber: { increment: 1 }",
  )
) {
  throw new Error(
    "Atomic appointment queue token increment is missing.",
  );
}

console.log(
  "Phase 11.6 release source audit completed successfully.",
);
