import { nextPatientUhid } from "../../shared/sequences/document-number.presets";
import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  CreatePatientInput,
  PatientListQuery,
  UpdatePatientInput,
} from "./patients.schema";

function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizePatientRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    branchId: row.branch_id,
    uhid: row.uhid,
    title: row.title,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    ageYears: row.age_years,
    bloodGroup: row.blood_group,
    maritalStatus: row.marital_status,
    nationality: row.nationality,
    religion: row.religion,
    primaryMobile: row.primary_mobile,
    alternateMobile: row.alternate_mobile,
    email: row.email,
    aadhaarNumber: row.aadhaar_number,
    panNumber: row.pan_number,
    passportNumber: row.passport_number,
    occupation: row.occupation,
    preferredLanguage: row.preferred_language,
    referredBy: row.referred_by,
    referralSource: row.referral_source,
    medicalAlerts: row.medical_alerts,
    allergiesSummary: row.allergies_summary,
    chronicDiseasesSummary: row.chronic_diseases_summary,
    isDeceased: row.is_deceased,
    deceasedAt: row.deceased_at,
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listPatients(
  hospitalId: string,
  query: PatientListQuery,
) {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`hospital_id = ${hospitalId}::uuid`,
    Prisma.sql`deleted_at IS NULL`,
  ];

  if (query.branchId) {
    conditions.push(Prisma.sql`branch_id = ${query.branchId}::uuid`);
  }
  if (query.status) {
    conditions.push(Prisma.sql`status = ${query.status}::"RecordStatus"`);
  }
  if (query.gender) {
    conditions.push(Prisma.sql`gender = ${query.gender}`);
  }
  if (query.search) {
    const search = `%${query.search}%`;
    conditions.push(
      Prisma.sql`(
        uhid ILIKE ${search}
        OR first_name ILIKE ${search}
        OR COALESCE(middle_name, '') ILIKE ${search}
        OR COALESCE(last_name, '') ILIKE ${search}
        OR primary_mobile ILIKE ${search}
        OR COALESCE(email, '') ILIKE ${search}
      )`,
    );
  }

  const whereSql = Prisma.join(conditions, " AND ");
  const offset = (query.page - 1) * query.pageSize;
  const orderColumn =
    query.sortBy === "firstName"
      ? Prisma.raw("first_name")
      : query.sortBy === "uhid"
        ? Prisma.raw("uhid")
        : Prisma.raw("created_at");
  const orderDirection =
    query.sortOrder === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC");

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM patients
      WHERE ${whereSql}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ${query.pageSize}
      OFFSET ${offset}
    `),
    prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM patients
      WHERE ${whereSql}
    `),
  ]);

  const total = Number(countRows[0]?.total ?? 0);

  return {
    items: rows.map(normalizePatientRow),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function findPatient(
  hospitalId: string,
  id: string,
) {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    SELECT *
    FROM patients
    WHERE id = ${id}::uuid
      AND hospital_id = ${hospitalId}::uuid
      AND deleted_at IS NULL
    LIMIT 1
  `);

  if (!rows[0]) {
    return null;
  }

  const [addresses, emergencyContacts] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM patient_addresses
      WHERE hospital_id = ${hospitalId}::uuid
        AND patient_id = ${id}::uuid
      ORDER BY is_primary DESC, created_at ASC
    `),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM patient_emergency_contacts
      WHERE hospital_id = ${hospitalId}::uuid
        AND patient_id = ${id}::uuid
      ORDER BY is_primary DESC, created_at ASC
    `),
  ]);

  return {
    ...normalizePatientRow(rows[0]),
    addresses,
    emergencyContacts,
  };
}

export async function branchExists(
  hospitalId: string,
  branchId: string,
) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM hospital_branches
    WHERE id = ${branchId}::uuid
      AND hospital_id = ${hospitalId}::uuid
      AND deleted_at IS NULL
      AND status = 'ACTIVE'
  `);

  return Number(rows[0]?.count ?? 0) > 0;
}

export async function generateUhid(
  hospitalId: string,
): Promise<string> {
  // PHASE 11.2B: centralized UHID allocator
  return nextPatientUhid(hospitalId);
}

export async function findPotentialDuplicates(
  hospitalId: string,
  input: {
    primaryMobile: string;
    firstName: string;
    dateOfBirth?: Date | null;
  },
) {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    SELECT *
    FROM patients
    WHERE hospital_id = ${hospitalId}::uuid
      AND deleted_at IS NULL
      AND (
        primary_mobile = ${input.primaryMobile}
        OR (
          LOWER(first_name) = LOWER(${input.firstName})
          AND (
            ${input.dateOfBirth ?? null}::date IS NULL
            OR date_of_birth = ${input.dateOfBirth ?? null}::date
          )
        )
      )
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return rows.map(normalizePatientRow);
}

export async function createPatient(
  hospitalId: string,
  userId: string,
  uhid: string,
  input: CreatePatientInput,
) {
  return prisma.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      INSERT INTO patients (
        id, hospital_id, branch_id, uhid, title, first_name, middle_name, last_name,
        gender, date_of_birth, age_years, blood_group, marital_status,
        nationality, religion, primary_mobile, alternate_mobile, email,
        aadhaar_number, pan_number, passport_number, occupation,
        preferred_language, referred_by, referral_source, medical_alerts,
        allergies_summary, chronic_diseases_summary, is_deceased, deceased_at,
        status, created_by, updated_at, updated_by
      ) VALUES (
        gen_random_uuid(),
        ${hospitalId}::uuid,
        ${input.branchId ?? null}::uuid,
        ${uhid},
        ${input.title ?? null},
        ${input.firstName},
        ${input.middleName ?? null},
        ${input.lastName ?? null},
        ${input.gender ?? null},
        ${input.dateOfBirth ?? null}::date,
        ${input.ageYears ?? null},
        ${input.bloodGroup ?? null},
        ${input.maritalStatus ?? null},
        ${input.nationality ?? null},
        ${input.religion ?? null},
        ${input.primaryMobile},
        ${input.alternateMobile ?? null},
        ${input.email ?? null},
        ${input.aadhaarNumber ?? null},
        ${input.panNumber ?? null},
        ${input.passportNumber ?? null},
        ${input.occupation ?? null},
        ${input.preferredLanguage ?? null},
        ${input.referredBy ?? null},
        ${input.referralSource ?? null},
        ${input.medicalAlerts ?? null},
        ${input.allergiesSummary ?? null},
        ${input.chronicDiseasesSummary ?? null},
        ${input.isDeceased},
        ${input.deceasedAt ?? null},
        ${input.status}::"RecordStatus",
        ${userId}::uuid,
        NOW(),
        ${userId}::uuid
      )
      RETURNING *
    `);

    const patient = rows[0];
    if (!patient) {
      throw new Error("Patient creation failed");
    }

for (const address of input.addresses) {
  await transaction.$executeRaw(Prisma.sql`
    INSERT INTO patient_addresses (
      id,
      hospital_id,
      patient_id,
      address_type,
      address_line1,
      address_line2,
      landmark,
      city,
      district,
      state,
      country,
      postal_code,
      is_primary,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${hospitalId}::uuid,
      ${String(patient.id)}::uuid,
      ${address.addressType},
      ${address.addressLine1},
      ${address.addressLine2 ?? null},
      ${address.landmark ?? null},
      ${address.city ?? null},
      ${address.district ?? null},
      ${address.state ?? null},
      ${address.country},
      ${address.postalCode ?? null},
      ${address.isPrimary},
      NOW(),
      NOW()
    )
  `);
}

for (const contact of input.emergencyContacts) {
  await transaction.$executeRaw(Prisma.sql`
    INSERT INTO patient_emergency_contacts (
      id,
      hospital_id,
      patient_id,
      contact_name,
      relationship,
      mobile,
      alternate_mobile,
      email,
      is_primary,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${hospitalId}::uuid,
      ${String(patient.id)}::uuid,
      ${contact.contactName},
      ${contact.relationship ?? null},
      ${contact.mobile},
      ${contact.alternateMobile ?? null},
      ${contact.email ?? null},
      ${contact.isPrimary},
      NOW(),
      NOW()
    )
  `);
}

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "CREATE",
        module: "patients",
        entityType: "Patient",
        entityId: String(patient.id),
        newValues: toAuditJson(normalizePatientRow(patient)),
      },
    });

    return normalizePatientRow(patient);
  });
}

export async function updatePatient(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdatePatientInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existingRows = await transaction.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM patients
      WHERE id = ${id}::uuid
        AND hospital_id = ${hospitalId}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `);

    const existing = existingRows[0];
    if (!existing) {
      return null;
    }

    const sets: Prisma.Sql[] = [Prisma.sql`updated_by = ${userId}::uuid`, Prisma.sql`updated_at = NOW()`];

    const fieldMap: Record<string, string> = {
      branchId: "branch_id",
      title: "title",
      firstName: "first_name",
      middleName: "middle_name",
      lastName: "last_name",
      gender: "gender",
      dateOfBirth: "date_of_birth",
      ageYears: "age_years",
      bloodGroup: "blood_group",
      maritalStatus: "marital_status",
      nationality: "nationality",
      religion: "religion",
      primaryMobile: "primary_mobile",
      alternateMobile: "alternate_mobile",
      email: "email",
      aadhaarNumber: "aadhaar_number",
      panNumber: "pan_number",
      passportNumber: "passport_number",
      occupation: "occupation",
      preferredLanguage: "preferred_language",
      referredBy: "referred_by",
      referralSource: "referral_source",
      medicalAlerts: "medical_alerts",
      allergiesSummary: "allergies_summary",
      chronicDiseasesSummary: "chronic_diseases_summary",
      isDeceased: "is_deceased",
      deceasedAt: "deceased_at",
      status: "status",
    };

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || key === "emergencyContacts") {
        continue;
      }

      const column = fieldMap[key];
      if (!column) {
        continue;
      }

      if (key === "status") {
        sets.push(
          Prisma.sql`${Prisma.raw(column)} = ${value as never}::"RecordStatus"`,
        );
        continue;
      }

      sets.push(
        Prisma.sql`${Prisma.raw(column)} = ${value as never}`,
      );
    }

    if (input.emergencyContacts !== undefined && input.emergencyContacts.length > 0) {
      const contact = input.emergencyContacts[0]!;

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

    const rows = await transaction.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      UPDATE patients
      SET ${Prisma.join(sets, ", ")}
      WHERE id = ${id}::uuid
        AND hospital_id = ${hospitalId}::uuid
        AND deleted_at IS NULL
      RETURNING *
    `);

    const updated = rows[0];
    if (!updated) {
      return null;
    }

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "UPDATE",
        module: "patients",
        entityType: "Patient",
        entityId: id,
        oldValues: toAuditJson(normalizePatientRow(existing)),
        newValues: toAuditJson(normalizePatientRow(updated)),
      },
    });

    return normalizePatientRow(updated);
  });
}

export async function softDeletePatient(
  hospitalId: string,
  userId: string,
  id: string,
) {
  return prisma.$transaction(async (transaction) => {
    const existingRows = await transaction.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM patients
      WHERE id = ${id}::uuid
        AND hospital_id = ${hospitalId}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `);

    const existing = existingRows[0];
    if (!existing) {
      return null;
    }

    await transaction.$executeRaw(Prisma.sql`
      UPDATE patients
      SET deleted_at = NOW(),
          status = 'ARCHIVED',
          updated_by = ${userId}::uuid,
          updated_at = NOW()
      WHERE id = ${id}::uuid
        AND hospital_id = ${hospitalId}::uuid
    `);

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "DELETE",
        module: "patients",
        entityType: "Patient",
        entityId: id,
        oldValues: toAuditJson(normalizePatientRow(existing)),
      },
    });

    return normalizePatientRow(existing);
  });
}
