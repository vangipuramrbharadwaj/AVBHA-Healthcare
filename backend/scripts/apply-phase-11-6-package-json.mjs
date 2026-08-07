import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const packagePath = path.join(
  process.cwd(),
  "package.json",
);

if (!fs.existsSync(packagePath)) {
  throw new Error(
    "package.json was not found. Run this script from backend.",
  );
}

const packageJson = JSON.parse(
  fs.readFileSync(packagePath, "utf8"),
);

packageJson.scripts ??= {};

packageJson.scripts["test:unit:all"] =
  "node scripts/run-all-tests.mjs";

packageJson.scripts["audit:release"] =
  "node scripts/audit-release-gate.mjs";

packageJson.scripts["verify:static"] =
  "prisma validate && prisma generate && tsc --noEmit && node scripts/audit-release-gate.mjs";

packageJson.scripts["verify"] =
  "npm run verify:static && npm run test:unit:all";

packageJson.scripts["release:gate"] =
  "bash ./release-gate.sh";

fs.writeFileSync(
  packagePath,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);

console.log(
  "Phase 11.6 verification scripts added to package.json successfully.",
);
