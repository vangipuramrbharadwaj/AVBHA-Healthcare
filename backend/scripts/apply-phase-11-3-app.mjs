import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appPath = path.join(root, "src", "app.ts");
const backupPath = path.join(
  root,
  ".phase11-3-backup",
  "src",
  "app.ts",
);

if (!fs.existsSync(appPath)) {
  throw new Error(
    "src/app.ts was not found. Run this script from the backend folder.",
  );
}

const original = fs.readFileSync(appPath, "utf8");

if (
  original.includes(
    "PHASE 11.3: request trace middleware",
  )
) {
  console.log(
    "Phase 11.3 app integration is already applied.",
  );
  process.exit(0);
}

let text = original;

const imports = [
  'import { requestTraceMiddleware } from "./middleware/request-trace.middleware";',
  'import { notFoundMiddleware } from "./middleware/not-found.middleware";',
  'import { standardErrorMiddleware } from "./middleware/standard-error.middleware";',
];

for (const importLine of imports) {
  if (!text.includes(importLine)) {
    text = `${importLine}\n${text}`;
  }
}

const appPatterns = [
  /const\s+app\s*=\s*express\(\)\s*;/,
  /export\s+const\s+app\s*=\s*express\(\)\s*;/,
];

let appMatch = null;

for (const pattern of appPatterns) {
  appMatch = text.match(pattern);
  if (appMatch) {
    break;
  }
}

if (!appMatch || appMatch.index === undefined) {
  throw new Error(
    "Could not find Express app creation in src/app.ts",
  );
}

const appEnd =
  appMatch.index + appMatch[0].length;

text =
  text.slice(0, appEnd) +
  `\n\n// PHASE 11.3: request trace middleware\napp.use(requestTraceMiddleware);` +
  text.slice(appEnd);

const terminalBlock = `
// PHASE 11.3: terminal HTTP middleware
app.use(notFoundMiddleware);
app.use(standardErrorMiddleware);
`;

const exportCandidates = [
  "\nexport default app",
  "\nexport { app }",
  "\nexport {app}",
];

let exportIndex = -1;

for (const candidate of exportCandidates) {
  exportIndex = text.lastIndexOf(candidate);
  if (exportIndex >= 0) {
    break;
  }
}

if (exportIndex < 0) {
  throw new Error(
    "Could not find the final app export in src/app.ts. No changes were written.",
  );
}

text =
  text.slice(0, exportIndex) +
  terminalBlock +
  text.slice(exportIndex);

fs.mkdirSync(path.dirname(backupPath), {
  recursive: true,
});

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(
    backupPath,
    original,
    "utf8",
  );
}

fs.writeFileSync(appPath, text, "utf8");

console.log(
  "Phase 11.3 request tracing and standardized error middleware applied successfully.",
);
console.log(
  "Original app.ts backup: .phase11-3-backup/src/app.ts",
);
