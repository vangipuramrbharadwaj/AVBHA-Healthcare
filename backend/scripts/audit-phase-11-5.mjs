import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "src/integration/integration.config.ts",
  "src/integration/integration.client.ts",
  "src/integration/integration.assertions.ts",
  "src/integration/health.integration.test.ts",
  "src/integration/request-trace.integration.test.ts",
  "src/integration/error-handling.integration.test.ts",
  "src/integration/authenticated-smoke.integration.test.ts",
  "src/integration/sequence-concurrency.integration.test.ts",
  "src/integration/full-regression.integration.test.ts",
];

for (const relativePath of requiredFiles) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing Phase 11.5 file: ${relativePath}`,
    );
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(root, "package.json"),
    "utf8",
  ),
);

if (
  typeof packageJson.scripts?.["test:integration"] !== "string"
) {
  throw new Error(
    "package.json is missing test:integration",
  );
}

if (
  typeof packageJson.scripts?.["test:integration:core"] !== "string"
) {
  throw new Error(
    "package.json is missing test:integration:core",
  );
}

console.log(
  "Phase 11.5 integration source audit completed successfully.",
);
