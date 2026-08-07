import fs from "node:fs";

const checks = [
  ["src/app.ts", 'app.use("/api/v1/reports", reportsRouter);'],
  ["src/modules/reports/reports.routes.ts", "authenticate, enforceTenant"],
  ["src/modules/reports/reports.routes.ts", "REPORT_PERMISSIONS.VIEW"],
  ["src/modules/reports/reports.repository.ts", "billingInvoice.aggregate"],
  ["src/modules/reports/reports.repository.ts", "inventoryStock.findMany"],
  ["src/modules/reports/reports.service.ts", "REPORT_BRANCH_ACCESS_DENIED"],
];

for (const [file, marker] of checks) {
  if (!fs.existsSync(file)) {
    throw new Error(`Phase 14 required file is missing: ${file}`);
  }

  if (!fs.readFileSync(file, "utf8").includes(marker)) {
    throw new Error(`Phase 14 audit failed: ${marker} missing from ${file}`);
  }
}

console.log("Phase 14 Reports, Analytics & MIS source audit completed successfully.");
