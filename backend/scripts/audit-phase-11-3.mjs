import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appPath = path.join(root, "src", "app.ts");
const responsePath = path.join(
  root,
  "src",
  "shared",
  "http",
  "api-response.ts",
);

for (const file of [appPath, responsePath]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Required Phase 11.3 file is missing: ${path.relative(root, file)}`,
    );
  }
}

const app = fs.readFileSync(appPath, "utf8");

const requiredMarkers = [
  "requestTraceMiddleware",
  "notFoundMiddleware",
  "standardErrorMiddleware",
  "PHASE 11.3: request trace middleware",
  "PHASE 11.3: terminal HTTP middleware",
];

for (const marker of requiredMarkers) {
  if (!app.includes(marker)) {
    throw new Error(
      `Phase 11.3 marker is missing from app.ts: ${marker}`,
    );
  }
}

const terminalIndex = app.lastIndexOf(
  "PHASE 11.3: terminal HTTP middleware",
);

const routeIndex = Math.max(
  app.lastIndexOf('app.use("/api/'),
  app.lastIndexOf("app.use('/api/"),
);

if (
  routeIndex >= 0 &&
  terminalIndex < routeIndex
) {
  throw new Error(
    "Terminal error middleware appears before API routes",
  );
}

console.log(
  "Phase 11.3 source audit completed successfully.",
);
