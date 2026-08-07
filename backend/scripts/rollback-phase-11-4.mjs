import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const backupPath = path.join(
  root,
  ".phase11-4-backup",
  "src",
  "app.ts",
);
const appPath = path.join(root, "src", "app.ts");

if (!fs.existsSync(backupPath)) {
  throw new Error(
    "Phase 11.4 app.ts backup was not found",
  );
}

fs.copyFileSync(backupPath, appPath);
console.log(
  "src/app.ts restored from Phase 11.4 backup.",
);
