import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const filePath = path.join(
  process.cwd(),
  "src/shared/sequences/document-sequence.types.ts",
);

if (!fs.existsSync(filePath)) {
  throw new Error("Phase 11 document-sequence.types.ts was not found.");
}

let text = fs.readFileSync(filePath, "utf8");

const entries = [
  ['INVENTORY_PURCHASE_ORDER', '"INVENTORY_PURCHASE_ORDER"'],
  ['INVENTORY_GOODS_RECEIPT', '"INVENTORY_GOODS_RECEIPT"'],
  ['INVENTORY_MATERIAL_REQUEST', '"INVENTORY_MATERIAL_REQUEST"'],
  ['INVENTORY_TRANSFER', '"INVENTORY_TRANSFER"'],
];

for (const [key, value] of entries) {
  if (text.includes(`${key}:`)) continue;

  const marker = '  OT_SPECIMEN: "OT_SPECIMEN",';
  if (!text.includes(marker)) {
    throw new Error("Could not find DOCUMENT_TYPES insertion marker.");
  }

  text = text.replace(
    marker,
    `${marker}\n  ${key}: ${value},`,
  );
}

fs.writeFileSync(filePath, text, "utf8");
console.log("Phase 12 inventory document sequence types applied successfully.");
