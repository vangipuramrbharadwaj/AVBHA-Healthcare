import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const backupRoot = path.join(
  root,
  ".phase11-2b-backup",
);

const targets = {
  patients: "src/modules/patients/patients.repository.ts",
  appointments: "src/modules/appointments/appointments.service.ts",
  opd: "src/modules/opd/opd.service.ts",
  ipd: "src/modules/ipd/ipd.service.ts",
  laboratory: "src/modules/laboratory/laboratory.service.ts",
  radiology: "src/modules/radiology/radiology.service.ts",
  pharmacy: "src/modules/pharmacy/pharmacy.service.ts",
  billing: "src/modules/billing/billing.service.ts",
  operationTheatre:
    "src/modules/operation-theatre/operation-theatre.service.ts",
};

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  const file = absolute(relativePath);

  if (!fs.existsSync(file)) {
    throw new Error(`Required file was not found: ${relativePath}`);
  }

  return fs.readFileSync(file, "utf8");
}

function backup(relativePath, text) {
  const destination = path.join(backupRoot, relativePath);

  if (fs.existsSync(destination)) {
    return;
  }

  fs.mkdirSync(path.dirname(destination), {
    recursive: true,
  });
  fs.writeFileSync(destination, text, "utf8");
}

function save(relativePath, original, updated) {
  if (original === updated) {
    return;
  }

  backup(relativePath, original);
  fs.writeFileSync(
    absolute(relativePath),
    updated,
    "utf8",
  );
  console.log(`Updated ${relativePath}`);
}

function addNamedImport(text, names) {
  const importLine =
    `import { ${names.join(", ")} } ` +
    `from "../../shared/sequences/document-number.presets";`;

  if (text.includes(importLine)) {
    return text;
  }

  return `${importLine}\n${text}`;
}

function findFunctionRange(text, functionName) {
  const candidates = [
    `export async function ${functionName}`,
    `async function ${functionName}`,
    `export function ${functionName}`,
    `function ${functionName}`,
  ];

  let start = -1;

  for (const candidate of candidates) {
    start = text.indexOf(candidate);
    if (start >= 0) {
      break;
    }
  }

  if (start < 0) {
    throw new Error(
      `Function ${functionName} was not found`,
    );
  }

  const openBrace = text.indexOf("{", start);
  if (openBrace < 0) {
    throw new Error(
      `Opening brace for ${functionName} was not found`,
    );
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openBrace; index < text.length; index += 1) {
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

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          end: index + 1,
        };
      }
    }
  }

  throw new Error(
    `Closing brace for ${functionName} was not found`,
  );
}

function replaceFunction(
  text,
  functionName,
  replacement,
) {
  const range = findFunctionRange(
    text,
    functionName,
  );

  return (
    text.slice(0, range.start) +
    replacement.trim() +
    text.slice(range.end)
  );
}

function patchPatients() {
  const file = targets.patients;
  const original = read(file);

  if (
    original.includes(
      "PHASE 11.2B: centralized UHID allocator",
    )
  ) {
    return;
  }

  let text = addNamedImport(
    original,
    ["nextPatientUhid"],
  );

  text = replaceFunction(
    text,
    "generateUhid",
    `
export async function generateUhid(
  hospitalId: string,
): Promise<string> {
  // PHASE 11.2B: centralized UHID allocator
  return nextPatientUhid(hospitalId);
}
`,
  );

  save(file, original, text);
}

function patchSimpleDateGenerator(
  file,
  functionName,
  importName,
) {
  const original = read(file);

  if (
    original.includes(
      `PHASE 11.2B: ${functionName}`,
    )
  ) {
    return;
  }

  let text = addNamedImport(
    original,
    [importName],
  );

  text = replaceFunction(
    text,
    functionName,
    `
async function ${functionName}(
  hospitalId: string,
  date: Date,
): Promise<string> {
  // PHASE 11.2B: ${functionName}
  return ${importName}(hospitalId, date);
}
`,
  );

  save(file, original, text);
}

function patchPharmacy() {
  const file = targets.pharmacy;
  const original = read(file);

  if (
    original.includes(
      "PHASE 11.2B: pharmacy document allocator",
    )
  ) {
    return;
  }

  let text = addNamedImport(
    original,
    [
      "nextPharmacyDispenseNumber",
      "nextPharmacyGrnNumber",
      "nextPharmacyPurchaseNumber",
      "nextPharmacySaleNumber",
    ],
  );

  text = replaceFunction(
    text,
    "nextDocumentNumber",
    `
async function nextDocumentNumber(
  hospitalId: string,
  prefix: string,
  type: "sale" | "dispense" | "purchase" | "receipt",
): Promise<string> {
  // PHASE 11.2B: pharmacy document allocator
  switch (type) {
    case "sale":
      return nextPharmacySaleNumber(hospitalId);
    case "dispense":
      return nextPharmacyDispenseNumber(hospitalId);
    case "purchase":
      return nextPharmacyPurchaseNumber(hospitalId);
    case "receipt":
      return nextPharmacyGrnNumber(hospitalId);
  }
}
`,
  );

  save(file, original, text);
}

function patchBilling() {
  const file = targets.billing;
  const original = read(file);

  if (
    original.includes(
      "PHASE 11.2B: billing document allocator",
    )
  ) {
    return;
  }

  let text = addNamedImport(
    original,
    [
      "nextBillingAdvanceNumber",
      "nextBillingInvoiceNumber",
      "nextBillingReceiptNumber",
      "nextBillingRefundNumber",
    ],
  );

  text = replaceFunction(
    text,
    "nextNumber",
    `
async function nextNumber(
  hospitalId: string,
  prefix: string,
  type: "invoice" | "payment" | "refund" | "advance",
): Promise<string> {
  // PHASE 11.2B: billing document allocator
  switch (type) {
    case "invoice":
      return nextBillingInvoiceNumber(hospitalId);
    case "payment":
      return nextBillingReceiptNumber(hospitalId);
    case "refund":
      return nextBillingRefundNumber(hospitalId);
    case "advance":
      return nextBillingAdvanceNumber(hospitalId);
  }
}
`,
  );

  save(file, original, text);
}

function patchOperationTheatre() {
  const file = targets.operationTheatre;
  const original = read(file);

  if (
    original.includes(
      "PHASE 11.2B: nextBookingNumber",
    )
  ) {
    return;
  }

  let text = addNamedImport(
    original,
    [
      "nextOtBookingNumber",
      "nextOtSpecimenNumber",
    ],
  );

  text = replaceFunction(
    text,
    "nextBookingNumber",
    `
async function nextBookingNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  // PHASE 11.2B: nextBookingNumber
  return nextOtBookingNumber(hospitalId, date);
}
`,
  );

  text = replaceFunction(
    text,
    "nextSpecimenNumber",
    `
async function nextSpecimenNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  // PHASE 11.2B: nextSpecimenNumber
  return nextOtSpecimenNumber(hospitalId, date);
}
`,
  );

  save(file, original, text);
}

patchPatients();

patchSimpleDateGenerator(
  targets.appointments,
  "nextNumber",
  "nextAppointmentNumber",
);

patchSimpleDateGenerator(
  targets.opd,
  "nextVisitNumber",
  "nextOpdVisitNumber",
);

patchSimpleDateGenerator(
  targets.ipd,
  "nextAdmissionNumber",
  "nextIpdAdmissionNumber",
);

patchSimpleDateGenerator(
  targets.laboratory,
  "nextOrderNumber",
  "nextLabOrderNumber",
);

patchSimpleDateGenerator(
  targets.radiology,
  "nextOrderNumber",
  "nextRadiologyOrderNumber",
);

patchPharmacy();
patchBilling();
patchOperationTheatre();

console.log("");
console.log(
  "Phase 11.2B number generator replacements applied successfully.",
);
console.log(
  "Appointment queue token generation was intentionally left unchanged.",
);
console.log(
  `Backups are stored in ${path.relative(root, backupRoot)}`,
);
