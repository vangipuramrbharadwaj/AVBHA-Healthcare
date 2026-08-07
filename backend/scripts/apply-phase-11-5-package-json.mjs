import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const packagePath = path.join(
  process.cwd(),
  "package.json",
);

if (!fs.existsSync(packagePath)) {
  throw new Error(
    "package.json was not found. Run this script from the backend folder.",
  );
}

const packageJson = JSON.parse(
  fs.readFileSync(packagePath, "utf8"),
);

packageJson.scripts ??= {};

packageJson.scripts["test:integration"] =
  "node --import tsx --test src/integration/*.integration.test.ts";

packageJson.scripts["test:integration:core"] =
  "node --import tsx --test src/integration/health.integration.test.ts src/integration/request-trace.integration.test.ts src/integration/error-handling.integration.test.ts src/integration/full-regression.integration.test.ts";

fs.writeFileSync(
  packagePath,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);

console.log(
  "Phase 11.5 integration test scripts added to package.json successfully.",
);
