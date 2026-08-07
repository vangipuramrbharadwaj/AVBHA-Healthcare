import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appPath = path.join(process.cwd(), "src", "app.ts");

if (!fs.existsSync(appPath)) {
  throw new Error("src/app.ts was not found");
}

const text = fs.readFileSync(appPath, "utf8");

const required = [
  'import { requestTraceMiddleware } from "./middleware/request-trace.middleware";',
  'import { standardNotFoundMiddleware } from "./middleware/not-found.middleware";',
  'import { standardErrorMiddleware } from "./middleware/standard-error.middleware";',
  "app.use(requestTraceMiddleware);",
  "app.use(standardNotFoundMiddleware);",
  "app.use(standardErrorMiddleware);",
  "PHASE 11.3 CURRENT APP INTEGRATION",
];

for (const value of required) {
  if (!text.includes(value)) {
    throw new Error(
      `Phase 11.3 app integration is missing: ${value}`,
    );
  }
}

const forbidden = [
  "app.use(requestIdMiddleware);",
  "app.use(notFoundMiddleware);",
  "app.use(errorMiddleware);",
];

for (const value of forbidden) {
  if (text.includes(value)) {
    throw new Error(
      `Legacy middleware is still mounted: ${value}`,
    );
  }
}

const terminalIndex = text.lastIndexOf(
  "app.use(standardNotFoundMiddleware);",
);

const lastApiRoute = text.lastIndexOf('app.use("/api/v1/');

if (terminalIndex < lastApiRoute) {
  throw new Error(
    "Standard 404 middleware is mounted before the final API route",
  );
}

console.log(
  "Phase 11.3 current app source audit completed successfully.",
);
