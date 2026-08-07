import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appPath = path.join(root, "src", "app.ts");
const routesPath = path.join(
  root,
  "src",
  "modules",
  "system-health",
  "system-health.routes.ts",
);

for (const file of [appPath, routesPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Required Phase 11.4 file is missing: ${path.relative(root, file)}`,
    );
  }
}

const app = fs.readFileSync(appPath, "utf8");
const routes = fs.readFileSync(routesPath, "utf8");

const appChecks = [
  'import { systemHealthRouter } from "./modules/system-health";',
  'app.use("/api/v1", systemHealthRouter);',
  "PHASE 11.4 SYSTEM HEALTH ROUTER",
];

for (const value of appChecks) {
  if (!app.includes(value)) {
    throw new Error(
      `Phase 11.4 app integration is missing: ${value}`,
    );
  }
}

if (app.includes('app.get("/api/v1/health"')) {
  throw new Error(
    "Legacy inline /api/v1/health route is still present",
  );
}

const endpoints = [
  '"/health"',
  '"/live"',
  '"/ready"',
  '"/database"',
  '"/version"',
  '"/monitoring"',
];

for (const endpoint of endpoints) {
  if (!routes.includes(endpoint)) {
    throw new Error(
      `Phase 11.4 endpoint is missing: ${endpoint}`,
    );
  }
}

console.log(
  "Phase 11.4 source audit completed successfully.",
);
