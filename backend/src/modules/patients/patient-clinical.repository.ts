import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === "bigint") return currentValue.toString();
      if (currentValue instanceof Prisma.Decimal) return currentValue.toString();
      if (currentValue instanceof Date) return currentValue.toISOString();
      return currentValue;
    }),
  ) as Prisma.InputJsonValue;
}

export function patientExists(hospitalId: string, patientId: string) {
  return prisma.patient.count({
    where: { id: patientId, hospitalId, deletedAt: null },
  });
}

async function addTimeline(
  tx: any,
  data: {
    hospitalId: string;
    patientId: string;
    userId: string;
    eventType: string;
    eventTitle: string;
    description?: string;
    sourceEntityId: string;
  },
) {
  await tx.patientTimelineEvent.create({
    data: {
      hospitalId: data.hospitalId,
      patientId: data.patientId,
      eventType: data.eventType,
      eventTitle: data.eventTitle,
      ...(data.description ? { description: data.description } : {}),
      sourceModule: "patients",
      sourceEntityId: data.sourceEntityId,
      createdBy: data.userId,
    },
  });
}

async function createRecord(
  delegateName: string,
  entityType: string,
  eventType: string,
  eventTitle: string,
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
  description?: string,
) {
  return prisma.$transaction(async (tx) => {
    const delegate = (tx as any)[delegateName];
    const record = await delegate.create({
      data: {
        ...input,
        hospitalId,
        patientId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "patients",
        entityType,
        entityId: record.id,
        newValues: toAuditJson(record),
      },
    });

    await addTimeline(tx, {
      hospitalId,
      patientId,
      userId,
      eventType,
      eventTitle,
      ...(description ? { description } : {}),
      sourceEntityId: record.id,
    });

    return record;
  });
}

async function updateRecord(
  delegateName: string,
  entityType: string,
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  data: Record<string, unknown>,
) {
  return prisma.$transaction(async (tx) => {
    const delegate = (tx as any)[delegateName];
    const existing = await delegate.findFirst({
      where: { id: resourceId, hospitalId, patientId, deletedAt: null },
    });
    if (!existing) return null;

    const record = await delegate.update({
      where: { id: resourceId },
      data: { ...data, updatedBy: userId },
    });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "patients",
        entityType,
        entityId: resourceId,
        oldValues: toAuditJson(existing),
        newValues: toAuditJson(record),
      },
    });

    return record;
  });
}

async function archiveRecord(
  delegateName: string,
  entityType: string,
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const delegate = (tx as any)[delegateName];
    const existing = await delegate.findFirst({
      where: { id: resourceId, hospitalId, patientId, deletedAt: null },
    });
    if (!existing) return null;

    await delegate.update({
      where: { id: resourceId },
      data: {
        status: "ARCHIVED",
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.DELETE,
        module: "patients",
        entityType,
        entityId: resourceId,
        oldValues: toAuditJson(existing),
      },
    });

    return existing;
  });
}

export const listInsurances = (hospitalId: string, patientId: string) =>
  prisma.patientInsurance.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

export async function createInsurance(
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary === true) {
      await tx.patientInsurance.updateMany({
        where: { hospitalId, patientId, isPrimary: true, deletedAt: null },
        data: { isPrimary: false, updatedBy: userId },
      });
    }

    const record = await tx.patientInsurance.create({
      data: {
        ...(input as Prisma.PatientInsuranceUncheckedCreateWithoutPatientInput),
        hospitalId,
        patientId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "patients",
        entityType: "PatientInsurance",
        entityId: record.id,
        newValues: toAuditJson(record),
      },
    });

    await addTimeline(tx, {
      hospitalId,
      patientId,
      userId,
      eventType: "INSURANCE_ADDED",
      eventTitle: "Insurance policy added",
      description: record.providerName,
      sourceEntityId: record.id,
    });

    return record;
  });
}

export const updateInsurance = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  updateRecord(
    "patientInsurance",
    "PatientInsurance",
    hospitalId,
    patientId,
    resourceId,
    userId,
    input,
  );

export const archiveInsurance = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) =>
  archiveRecord(
    "patientInsurance",
    "PatientInsurance",
    hospitalId,
    patientId,
    resourceId,
    userId,
  );

export const listAllergies = (hospitalId: string, patientId: string) =>
  prisma.patientAllergy.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

export const createAllergy = (
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  createRecord(
    "patientAllergy",
    "PatientAllergy",
    "ALLERGY_ADDED",
    "Allergy added",
    hospitalId,
    patientId,
    userId,
    input,
    String(input.allergen ?? ""),
  );

export const updateAllergy = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  updateRecord(
    "patientAllergy",
    "PatientAllergy",
    hospitalId,
    patientId,
    resourceId,
    userId,
    input,
  );

export const archiveAllergy = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) =>
  archiveRecord(
    "patientAllergy",
    "PatientAllergy",
    hospitalId,
    patientId,
    resourceId,
    userId,
  );

export const listChronicDiseases = (hospitalId: string, patientId: string) =>
  prisma.patientChronicDisease.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

export const createChronicDisease = (
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  createRecord(
    "patientChronicDisease",
    "PatientChronicDisease",
    "CHRONIC_DISEASE_ADDED",
    "Chronic disease added",
    hospitalId,
    patientId,
    userId,
    input,
    String(input.diseaseName ?? ""),
  );

export const updateChronicDisease = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  updateRecord(
    "patientChronicDisease",
    "PatientChronicDisease",
    hospitalId,
    patientId,
    resourceId,
    userId,
    input,
  );

export const archiveChronicDisease = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) =>
  archiveRecord(
    "patientChronicDisease",
    "PatientChronicDisease",
    hospitalId,
    patientId,
    resourceId,
    userId,
  );

export const listMedicalHistory = (hospitalId: string, patientId: string) =>
  prisma.patientMedicalHistory.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

export const createMedicalHistory = (
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  createRecord(
    "patientMedicalHistory",
    "PatientMedicalHistory",
    "MEDICAL_HISTORY_ADDED",
    "Medical history added",
    hospitalId,
    patientId,
    userId,
    input,
    String(input.title ?? ""),
  );

export const updateMedicalHistory = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  updateRecord(
    "patientMedicalHistory",
    "PatientMedicalHistory",
    hospitalId,
    patientId,
    resourceId,
    userId,
    input,
  );

export const archiveMedicalHistory = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) =>
  archiveRecord(
    "patientMedicalHistory",
    "PatientMedicalHistory",
    hospitalId,
    patientId,
    resourceId,
    userId,
  );

export const listDocuments = (hospitalId: string, patientId: string) =>
  prisma.patientDocument.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

export const createDocument = (
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  createRecord(
    "patientDocument",
    "PatientDocument",
    "DOCUMENT_ADDED",
    "Patient document added",
    hospitalId,
    patientId,
    userId,
    input,
    String(input.documentName ?? ""),
  );

export const updateDocument = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
  input: Record<string, unknown>,
) =>
  updateRecord(
    "patientDocument",
    "PatientDocument",
    hospitalId,
    patientId,
    resourceId,
    userId,
    input,
  );

export const archiveDocument = (
  hospitalId: string,
  patientId: string,
  resourceId: string,
  userId: string,
) =>
  archiveRecord(
    "patientDocument",
    "PatientDocument",
    hospitalId,
    patientId,
    resourceId,
    userId,
  );

export async function listTimeline(
  hospitalId: string,
  patientId: string,
  page: number,
  pageSize: number,
  eventType?: string,
) {
  const where: Prisma.PatientTimelineEventWhereInput = {
    hospitalId,
    patientId,
    ...(eventType ? { eventType } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.patientTimelineEvent.findMany({
      where,
      orderBy: { eventAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patientTimelineEvent.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
