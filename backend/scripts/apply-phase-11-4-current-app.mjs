import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appPath = path.join(root, "src", "app.ts");
const backupPath = path.join(
  root,
  ".phase11-4-backup",
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
    "PHASE 11.4 SYSTEM HEALTH ROUTER",
  )
) {
  console.log(
    "Phase 11.4 app integration is already applied.",
  );
  process.exit(0);
}

let text = original;

const importLine =
  'import { systemHealthRouter } from "./modules/system-health";';

if (!text.includes(importLine)) {
  text = `${importLine}\n${text}`;
}

// Remove the old inline /api/v1/health route.
// This parser finds the app.get call and removes the complete balanced statement.
const routeStart = text.indexOf(
  'app.get("/api/v1/health"',
);

if (routeStart >= 0) {
  let index = routeStart;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let quote = null;
  let escaped = false;
  let seenOpeningParen = false;
  let routeEnd = -1;

  for (; index < text.length; index += 1) {
    const char = text[index];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (
      char === '"' ||
      char === "'" ||
      char === "`"
    ) {
      quote = char;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      seenOpeningParen = true;
    } else if (char === ")") {
      parenDepth -= 1;
    } else if (char === "{") {
      braceDepth += 1;
    } else if (char === "}") {
      braceDepth -= 1;
    } else if (char === "[") {
      bracketDepth += 1;
    } else if (char === "]") {
      bracketDepth -= 1;
    }

    if (
      seenOpeningParen &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      char === ";"
    ) {
      routeEnd = index + 1;
      break;
    }
  }

  if (routeEnd < 0) {
    throw new Error(
      "Existing inline /api/v1/health route could not be parsed. No changes were written.",
    );
  }

  text =
    text.slice(0, routeStart) +
    text.slice(routeEnd);
}

// Remove imports that were only required by the previous inline health endpoint.
text = text.replace(
  /import\s*\{\s*prisma\s*\}\s*from\s*["']\.\/database\/prisma["'];?\s*/m,
  "",
);

// Keep env import because app.ts still uses env for CORS.
// Keep successResponse only if app.ts still uses it elsewhere.
if (!text.includes("successResponse(")) {
  text = text.replace(
    /import\s*\{\s*successResponse\s*\}\s*from\s*["']\.\/shared\/http\/api-response["'];?\s*/m,
    "",
  );
}

const authMount =
  'app.use("/api/v1/auth", authenticationRouter);';

if (!text.includes(authMount)) {
  throw new Error(
    "Authentication route mount was not found in src/app.ts. No changes were written.",
  );
}

text = text.replace(
  authMount,
  `// PHASE 11.4 SYSTEM HEALTH ROUTER
app.use("/api/v1", systemHealthRouter);

${authMount}`,
);

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
  "Phase 11.4 system health routes integrated successfully.",
);
console.log(
  "Backup saved at .phase11-4-backup/src/app.ts",
);
