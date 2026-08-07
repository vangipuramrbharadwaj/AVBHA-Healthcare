import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".phase11-2b-backup",
  ".phase11-3-backup",
  ".phase11-4-backup",
]);

function walk(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      ignoredDirectories.has(entry.name)
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".integration.test.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

const srcPath = path.join(root, "src");

if (!fs.existsSync(srcPath)) {
  throw new Error(
    "src directory was not found. Run this script from backend.",
  );
}

const tests = walk(srcPath).sort();

if (tests.length === 0) {
  throw new Error("No unit test files were discovered.");
}

console.log(
  `Discovered ${tests.length} non-integration test files.`,
);

const relativeTests = tests.map((file) =>
  path.relative(root, file),
);

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...relativeTests],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(
  "All discovered non-integration tests passed.",
);
