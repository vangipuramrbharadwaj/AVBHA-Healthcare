import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appPath = path.join(process.cwd(), "src", "app.ts");

if (!fs.existsSync(appPath)) {
  throw new Error(
    "src/app.ts was not found. Run this script from the backend folder.",
  );
}

let text = fs.readFileSync(appPath, "utf8");

const importLine = 'import { operationTheatreRouter } from "./modules/operation-theatre";';
if (!text.includes(importLine)) {
  text = `${importLine}\n${text}`;
}

const mountLine = 'app.use("/api/v1/operation-theatre", operationTheatreRouter);';
if (!text.includes(mountLine)) {
  const anchor = 'app.use("/api/v1/billing", billingRouter);';

  if (!text.includes(anchor)) {
    throw new Error("Billing route mount was not found in src/app.ts");
  }

  text = text.replace(anchor, `${anchor}\n${mountLine}`);
}

fs.writeFileSync(appPath, text, "utf8");
console.log("OT application route applied successfully");
