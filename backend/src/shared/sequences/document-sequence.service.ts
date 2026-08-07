import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  NextDocumentNumberInput,
  SequenceAllocation,
  SequencePeriod,
} from "./document-sequence.types";

const DEFAULT_PADDING = 6;

export function buildPeriodKey(
  period: SequencePeriod,
  date: Date,
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (period) {
    case "NONE":
      return "GLOBAL";
    case "YEAR":
      return String(year);
    case "MONTH":
      return `${year}${month}`;
    case "DATE":
      return `${year}${month}${day}`;
  }
}

export function formatDocumentNumber(
  prefix: string,
  periodKey: string,
  sequence: bigint,
  padding: number,
): string {
  const sequencePart = sequence.toString().padStart(padding, "0");

  return periodKey === "GLOBAL"
    ? `${prefix}-${sequencePart}`
    : `${prefix}-${periodKey}-${sequencePart}`;
}

interface SequenceRow {
  current_value: bigint;
}

export async function nextDocumentNumber(
  input: NextDocumentNumberInput,
): Promise<SequenceAllocation> {
  const period = input.period ?? "YEAR";
  const date = input.date ?? new Date();
  const padding = input.padding ?? DEFAULT_PADDING;
  const scopeKey = input.branchId ?? "GLOBAL";
  const periodKey = buildPeriodKey(period, date);

  if (!/^[A-Z0-9-]{1,20}$/.test(input.prefix)) {
    throw new Error("Invalid document sequence prefix");
  }

  if (!Number.isInteger(padding) || padding < 1 || padding > 12) {
    throw new Error("Invalid document sequence padding");
  }

  const branchId =
    input.branchId !== undefined && input.branchId !== null
      ? input.branchId
      : null;

  const rows = await prisma.$queryRaw<SequenceRow[]>(Prisma.sql`
    INSERT INTO "document_sequences" (
      "id",
      "hospital_id",
      "branch_id",
      "scope_key",
      "document_type",
      "period_key",
      "prefix",
      "current_value",
      "padding",
      "created_at",
      "updated_at"
    )
    VALUES (
      gen_random_uuid(),
      ${input.hospitalId}::uuid,
      ${branchId}::uuid,
      ${scopeKey},
      ${input.documentType},
      ${periodKey},
      ${input.prefix},
      1,
      ${padding},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (
      "hospital_id",
      "scope_key",
      "document_type",
      "period_key"
    )
    DO UPDATE SET
      "current_value" = "document_sequences"."current_value" + 1,
      "prefix" = EXCLUDED."prefix",
      "padding" = EXCLUDED."padding",
      "branch_id" = EXCLUDED."branch_id",
      "updated_at" = CURRENT_TIMESTAMP
    RETURNING "current_value"
  `);

  const row = rows[0];
  if (!row) {
    throw new Error("Unable to allocate document sequence");
  }

  return {
    number: formatDocumentNumber(
      input.prefix,
      periodKey,
      row.current_value,
      padding,
    ),
    sequence: row.current_value,
    periodKey,
    scopeKey,
  };
}
