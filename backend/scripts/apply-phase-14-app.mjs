import fs from "node:fs";

const appPath = "src/app.ts";
let text = fs.readFileSync(appPath, "utf8");

const importLine = 'import { reportsRouter } from "./modules/reports";';
const routeLine = 'app.use("/api/v1/reports", reportsRouter);';

if (!text.includes(importLine)) {
  text = `${importLine}\n${text}`;
}

if (!text.includes(routeLine)) {
  const anchor = 'app.use("/api/v1/dashboard", dashboardRouter);';

  if (!text.includes(anchor)) {
    throw new Error("Dashboard route anchor was not found. app.ts was not changed.");
  }

  text = text.replace(anchor, `${anchor}\n${routeLine}`);
}

fs.writeFileSync(appPath, text, "utf8");
console.log("Phase 14 Reports router applied successfully.");
