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
    "PHASE 11.3 CURRENT APP INTEGRATION",
  )
) {
  console.log("Phase 11.3 is already integrated.");
  process.exit(0);
}

let text = original;

// Remove the legacy error middleware import block.
text = text.replace(
  /import\s*\{\s*errorMiddleware,\s*notFoundMiddleware,\s*\}\s*from\s*["']\.\/middleware\/error\.middleware["'];?\s*/m,
  "",
);

// Remove the legacy request-id import.
text = text.replace(
  /import\s*\{\s*requestIdMiddleware\s*\}\s*from\s*["']\.\/middleware\/request-id\.middleware["'];?\s*/m,
  "",
);

const imports = [
  'import { requestTraceMiddleware } from "./middleware/request-trace.middleware";',
  'import { standardNotFoundMiddleware } from "./middleware/not-found.middleware";',
  'import { standardErrorMiddleware } from "./middleware/standard-error.middleware";',
];

for (const importLine of imports.reverse()) {
  if (!text.includes(importLine)) {
    text = `${importLine}\n${text}`;
  }
}

// Replace the existing request ID middleware.
if (!text.includes("app.use(requestIdMiddleware);")) {
  throw new Error(
    "Expected app.use(requestIdMiddleware) was not found. No changes were written.",
  );
}

text = text.replace(
  "app.use(requestIdMiddleware);",
  `// PHASE 11.3 CURRENT APP INTEGRATION\napp.use(requestTraceMiddleware);`,
);

// Replace the existing terminal middleware.
const terminalPattern =
  /app\.use\(notFoundMiddleware\);\s*app\.use\(errorMiddleware\);\s*$/m;

if (!terminalPattern.test(text)) {
  throw new Error(
    "Expected terminal notFoundMiddleware/errorMiddleware block was not found. No changes were written.",
  );
}

text = text.replace(
  terminalPattern,
  `// PHASE 11.3 standardized terminal middleware
app.use(standardNotFoundMiddleware);
app.use(standardErrorMiddleware);
`,
);

fs.mkdirSync(path.dirname(backupPath), {
  recursive: true,
});

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, original, "utf8");
}

fs.writeFileSync(appPath, text, "utf8");

console.log(
  "Phase 11.3 integration applied successfully to the current AVBHA app.ts.",
);
console.log(
  "Backup saved at .phase11-3-backup/src/app.ts",
);
