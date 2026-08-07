import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appPath = path.join(process.cwd(), "src", "app.ts");

if (!fs.existsSync(appPath)) {
  throw new Error("src/app.ts was not found. Run from backend.");
}

const original = fs.readFileSync(appPath, "utf8");

if (original.includes('app.use("/api/v1/inventory", inventoryRouter);')) {
  console.log("Inventory route is already mounted.");
  process.exit(0);
}

let text = original;

const importLine =
  'import { inventoryRouter } from "./modules/inventory";';

if (!text.includes(importLine)) {
  text = `${importLine}\n${text}`;
}

const anchor =
  'app.use("/api/v1/pharmacy", pharmacyRouter);';

if (!text.includes(anchor)) {
  throw new Error(
    "Pharmacy route mount was not found. No changes were written.",
  );
}

text = text.replace(
  anchor,
  `${anchor}\napp.use("/api/v1/inventory", inventoryRouter);`,
);

fs.writeFileSync(appPath, text, "utf8");
console.log("Inventory application route applied successfully");
