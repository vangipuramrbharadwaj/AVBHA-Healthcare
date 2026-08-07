import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(relative) {
  return path.join(root, relative);
}

function read(relative) {
  return fs.readFileSync(file(relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(file(relative), content);
}

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText)) {
    console.log(`✓ ${label} already applied`);
    return content;
  }

  if (!content.includes(oldText)) {
    throw new Error(`Could not locate ${label}. No changes written for this step.`);
  }

  console.log(`✓ Applying ${label}`);
  return content.replace(oldText, newText);
}

// 1. Patient status LIST filter: PostgreSQL enum cast.
{
  const relative = "src/modules/patients/patients.repository.ts";
  let content = read(relative);

  content = replaceOnce(
    content,
    'conditions.push(Prisma.sql`status = ${query.status}`);',
    'conditions.push(Prisma.sql`status = ${query.status}::"RecordStatus"`);',
    "patient list RecordStatus cast",
  );

  write(relative, content);
}

// 2. Update schema accepts primary emergency contact data.
{
  const relative = "src/modules/patients/patients.schema.ts";
  let content = read(relative);

  const oldText = `export const updatePatientSchema = patientBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });`;

  const newText = `export const updatePatientSchema = patientBaseSchema
  .partial()
  .extend({
    emergencyContacts: z
      .array(patientEmergencyContactSchema)
      .max(5)
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });`;

  content = replaceOnce(
    content,
    oldText,
    newText,
    "patient update emergencyContacts schema",
  );

  write(relative, content);
}

// 3. Update repository must ignore nested emergencyContacts in dynamic SQL
//    and safely upsert the primary emergency contact inside the same transaction.
{
  const relative = "src/modules/patients/patients.repository.ts";
  let content = read(relative);

  const oldLoop = `    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) {
        continue;
      }

      const column = fieldMap[key];
      if (!column) {
        continue;
      }

      if (key === "status") {
        sets.push(
          Prisma.sql\`\${Prisma.raw(column)} = \${value as never}::"RecordStatus"\`,
        );
        continue;
      }

      sets.push(
        Prisma.sql\`\${Prisma.raw(column)} = \${value as never}\`,
      );
    }`;

  const newLoop = `    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || key === "emergencyContacts") {
        continue;
      }

      const column = fieldMap[key];
      if (!column) {
        continue;
      }

      if (key === "status") {
        sets.push(
          Prisma.sql\`\${Prisma.raw(column)} = \${value as never}::"RecordStatus"\`,
        );
        continue;
      }

      sets.push(
        Prisma.sql\`\${Prisma.raw(column)} = \${value as never}\`,
      );
    }`;

  if (content.includes('key === "emergencyContacts"')) {
    console.log("✓ emergencyContacts excluded from patient scalar UPDATE already applied");
  } else if (content.includes(oldLoop)) {
    content = content.replace(oldLoop, newLoop);
    console.log("✓ Applying emergencyContacts exclusion from patient scalar UPDATE");
  } else {
    throw new Error(
      "Could not locate current patient update field loop. " +
      "Make sure the earlier RecordStatus edit fix is applied first.",
    );
  }

  const insertBefore = `    const rows = await transaction.$queryRaw<Record<string, unknown>[]>(Prisma.sql\`
      UPDATE patients`;

  const emergencyBlock = `    if (input.emergencyContacts !== undefined && input.emergencyContacts.length > 0) {
      const contact = input.emergencyContacts[0];

      const existingContact = await transaction.patientEmergencyContact.findFirst({
        where: {
          hospitalId,
          patientId: id,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      });

      if (existingContact) {
        await transaction.patientEmergencyContact.update({
          where: { id: existingContact.id },
          data: {
            contactName: contact.contactName,
            relationship: contact.relationship ?? null,
            mobile: contact.mobile,
            alternateMobile: contact.alternateMobile ?? null,
            email: contact.email ?? null,
            isPrimary: true,
          },
        });
      } else {
        await transaction.patientEmergencyContact.create({
          data: {
            hospitalId,
            patientId: id,
            contactName: contact.contactName,
            relationship: contact.relationship ?? null,
            mobile: contact.mobile,
            alternateMobile: contact.alternateMobile ?? null,
            email: contact.email ?? null,
            isPrimary: true,
          },
        });
      }
    }

`;

  if (content.includes("const existingContact = await transaction.patientEmergencyContact.findFirst")) {
    console.log("✓ emergency contact upsert already applied");
  } else if (content.includes(insertBefore)) {
    content = content.replace(insertBefore, emergencyBlock + insertBefore);
    console.log("✓ Applying primary emergency contact upsert");
  } else {
    throw new Error("Could not locate patient UPDATE query insertion point.");
  }

  write(relative, content);
}

console.log("");
console.log("Phase 2 backend runtime fixes applied successfully.");
console.log("Run: npx prisma validate && npx prisma generate && npx tsc --noEmit");
