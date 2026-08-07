import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appPath = path.join(process.cwd(), "src", "app.ts");

if (!fs.existsSync(appPath)) {
  throw new Error("src/app.ts was not found. Run this script from backend.");
}

let text = fs.readFileSync(appPath, "utf8");

const importLine = 'import { inventoryRouter } from "./modules/inventory";';
if (!text.includes(importLine)) {
  text = `${importLine}\n${text}`;
}

if (!text.includes('app.use("/api/v1/inventory", inventoryRouter);')) {
  const anchor = 'app.use("/api/v1/pharmacy", pharmacyRouter);';
  if (!text.includes(anchor)) {
    throw new Error("Pharmacy route mount was not found. No changes were written.");
  }
  text = text.replace(
    anchor,
    `${anchor}\napp.use("/api/v1/inventory", inventoryRouter);`,
  );
}

fs.writeFileSync(appPath, text, "utf8");
console.log("Phase 12 inventory route applied successfully.");
