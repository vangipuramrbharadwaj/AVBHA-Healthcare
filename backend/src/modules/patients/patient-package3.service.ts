import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function requirePatient(hospitalId: string, patientId: string) {
  const count = await prisma.patient.count({
    where: { id: patientId, hospitalId, deletedAt: null },
  });
  if (count === 0) {
    throw new AppError("Patient was not found", 404, "PATIENT_NOT_FOUND");
  }
}

export async function duplicateSearch(hospitalId: string, q: string, limit: number) {
  return prisma.patient.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      OR: [
        { uhid: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { middleName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { primaryMobile: { contains: q, mode: "insensitive" } },
        { alternateMobile: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { aadhaarNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function advancedSearch(
  hospitalId: string, q: string, page: number, pageSize: number,
) {
  const where: Prisma.PatientWhereInput = {
    hospitalId,
    deletedAt: null,
    OR: [
      { uhid: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { middleName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { primaryMobile: { contains: q, mode: "insensitive" } },
      { alternateMobile: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { aadhaarNumber: { contains: q, mode: "insensitive" } },
      {
        identifiers: {
          some: {
            active: true,
            identifierValue: { contains: q, mode: "insensitive" },
          },
        },
      },
    ],
  };
  const [items, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        identifiers: { where: { active: true } },
        alerts: { where: { active: true, deletedAt: null } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.patient.count({ where }),
  ]);
  return {
    items,
    pagination: {
      page, pageSize, total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function listFamily(hospitalId: string, patientId: string) {
  await requirePatient(hospitalId, patientId);
  return prisma.patientFamilyRelationship.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    include: {
      relatedPatient: {
        select: {
          id: true, uhid: true, firstName: true, middleName: true,
          lastName: true, primaryMobile: true, dateOfBirth: true, status: true,
        },
      },
    },
    orderBy: [{ isPrimaryContact: "desc" }, { createdAt: "desc" }],
  });
}

export async function createFamily(
  hospitalId: string,
  patientId: string,
  userId: string,
  input: {
    relatedPatientId?: string | null;
    relatedPersonName?: string | null;
    relatedPersonMobile?: string | null;
    relationshipType: string;
    isEmergencyContact: boolean;
    isPrimaryContact: boolean;
    notes?: string | null;
  },
) {
  await requirePatient(hospitalId, patientId);

  if (!input.relatedPatientId && !input.relatedPersonName?.trim()) {
    throw new AppError(
      "Select an existing patient or enter the family member name",
      400,
      "INVALID_FAMILY_RELATIONSHIP",
    );
  }

  if (input.relatedPatientId) {
    if (input.relatedPatientId === patientId) {
      throw new AppError(
        "A patient cannot be related to themselves",
        400,
        "INVALID_FAMILY_RELATIONSHIP",
      );
    }
    await requirePatient(hospitalId, input.relatedPatientId);
  }

  const data: Prisma.PatientFamilyRelationshipUncheckedCreateInput = {
    hospitalId,
    patientId,
    relationshipType: input.relationshipType,
    isEmergencyContact: input.isEmergencyContact,
    isPrimaryContact: input.isPrimaryContact,
    createdBy: userId,
    updatedBy: userId,
  };
  if (input.relatedPatientId) data.relatedPatientId = input.relatedPatientId;
  if (input.relatedPersonName !== undefined) data.relatedPersonName = input.relatedPersonName;
  if (input.relatedPersonMobile !== undefined) data.relatedPersonMobile = input.relatedPersonMobile;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.$transaction(async (tx) => {
    const record = await tx.patientFamilyRelationship.create({ data });
    await tx.auditLog.create({
      data: {
        hospitalId, userId, action: AuditAction.CREATE,
        module: "patients", entityType: "PatientFamilyRelationship",
        entityId: record.id, newValues: json(record),
      },
    });
    return record;
  });
}

export async function updateFamily(
  hospitalId: string, patientId: string, resourceId: string,
  userId: string, input: Record<string, unknown>,
) {
  await requirePatient(hospitalId, patientId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.patientFamilyRelationship.findFirst({
      where: { id: resourceId, hospitalId, patientId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError(
        "Family relationship was not found", 404, "PATIENT_RESOURCE_NOT_FOUND",
      );
    }
    const data: Prisma.PatientFamilyRelationshipUncheckedUpdateInput = {
      updatedBy: userId,
    };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        (data as Record<string, unknown>)[key] = value;
      }
    }
    const record = await tx.patientFamilyRelationship.update({
      where: { id: resourceId }, data,
    });
    await tx.auditLog.create({
      data: {
        hospitalId, userId, action: AuditAction.UPDATE,
        module: "patients", entityType: "PatientFamilyRelationship",
        entityId: resourceId, oldValues: json(existing), newValues: json(record),
      },
    });
    return record;
  });
}

export async function archiveFamily(
  hospitalId: string, patientId: string, resourceId: string, userId: string,
) {
  await requirePatient(hospitalId, patientId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.patientFamilyRelationship.findFirst({
      where: { id: resourceId, hospitalId, patientId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError(
        "Family relationship was not found", 404, "PATIENT_RESOURCE_NOT_FOUND",
      );
    }
    await tx.patientFamilyRelationship.update({
      where: { id: resourceId },
      data: { status: "ARCHIVED", deletedAt: new Date(), updatedBy: userId },
    });
    await tx.auditLog.create({
      data: {
        hospitalId, userId, action: AuditAction.DELETE,
        module: "patients", entityType: "PatientFamilyRelationship",
        entityId: resourceId, oldValues: json(existing),
      },
    });
  });
}

export async function listAlerts(hospitalId: string, patientId: string) {
  await requirePatient(hospitalId, patientId);
  return prisma.patientAlert.findMany({
    where: { hospitalId, patientId, deletedAt: null },
    orderBy: [{ active: "desc" }, { severity: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAlert(
  hospitalId: string,
  patientId: string,
  userId: string,
  input: {
    alertType: string;
    title: string;
    description?: string | null;
    severity: "INFO" | "WARNING" | "CRITICAL";
    startsAt?: Date | null;
    expiresAt?: Date | null;
    active: boolean;
    notes?: string | null;
  },
) {
  await requirePatient(hospitalId, patientId);
  const data: Prisma.PatientAlertUncheckedCreateInput = {
    hospitalId, patientId, alertType: input.alertType, title: input.title,
    severity: input.severity, active: input.active,
    createdBy: userId, updatedBy: userId,
  };
  if (input.description !== undefined) data.description = input.description;
  if (input.startsAt !== undefined) data.startsAt = input.startsAt;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.$transaction(async (tx) => {
    const record = await tx.patientAlert.create({ data });
    await tx.patientTimelineEvent.create({
      data: {
        hospitalId, patientId, eventType: "PATIENT_ALERT_CREATED",
        eventTitle: record.title,
        ...(record.description !== null ? { description: record.description } : {}),
        sourceModule: "patients", sourceEntityId: record.id, createdBy: userId,
      },
    });
    await tx.auditLog.create({
      data: {
        hospitalId, userId, action: AuditAction.CREATE,
        module: "patients", entityType: "PatientAlert",
        entityId: record.id, newValues: json(record),
      },
    });
    return record;
  });
}

export async function updateAlert(
  hospitalId: string, patientId: string, resourceId: string,
  userId: string, input: Record<string, unknown>,
) {
  await requirePatient(hospitalId, patientId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.patientAlert.findFirst({
      where: { id: resourceId, hospitalId, patientId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError(
        "Patient alert was not found", 404, "PATIENT_RESOURCE_NOT_FOUND",
      );
    }
    const data: Prisma.PatientAlertUncheckedUpdateInput = { updatedBy: userId };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        (data as Record<string, unknown>)[key] = value;
      }
    }
    const record = await tx.patientAlert.update({
      where: { id: resourceId }, data,
    });
    await tx.auditLog.create({
      data: {
        hospitalId, userId, action: AuditAction.UPDATE,
        module: "patients", entityType: "PatientAlert",
        entityId: resourceId, oldValues: json(existing), newValues: json(record),
      },
    });
    return record;
  });
}

export async function acknowledgeAlert(
  hospitalId: string, patientId: string, resourceId: string, userId: string,
) {
  await requirePatient(hospitalId, patientId);
  const existing = await prisma.patientAlert.findFirst({
    where: { id: resourceId, hospitalId, patientId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError(
      "Patient alert was not found", 404, "PATIENT_RESOURCE_NOT_FOUND",
    );
  }
  return prisma.patientAlert.update({
    where: { id: resourceId },
    data: {
      acknowledged: true, acknowledgedBy: userId,
      acknowledgedAt: new Date(), updatedBy: userId,
    },
  });
}

export async function archiveAlert(
  hospitalId: string, patientId: string, resourceId: string, userId: string,
) {
  await requirePatient(hospitalId, patientId);
  const existing = await prisma.patientAlert.findFirst({
    where: { id: resourceId, hospitalId, patientId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError(
      "Patient alert was not found", 404, "PATIENT_RESOURCE_NOT_FOUND",
    );
  }
  await prisma.patientAlert.update({
    where: { id: resourceId },
    data: {
      active: false, status: "ARCHIVED",
      deletedAt: new Date(), updatedBy: userId,
    },
  });
}

export function listMergeRequests(hospitalId: string) {
  return prisma.patientMergeRequest.findMany({
    where: { hospitalId },
    include: {
      sourcePatient: {
        select: { id: true, uhid: true, firstName: true, lastName: true },
      },
      targetPatient: {
        select: { id: true, uhid: true, firstName: true, lastName: true },
      },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function createMergeRequest(
  hospitalId: string, userId: string,
  input: { sourcePatientId: string; targetPatientId: string; reason: string },
) {
  if (input.sourcePatientId === input.targetPatientId) {
    throw new AppError(
      "Source and target patients must be different",
      400,
      "INVALID_MERGE_REQUEST",
    );
  }
  await requirePatient(hospitalId, input.sourcePatientId);
  await requirePatient(hospitalId, input.targetPatientId);
  return prisma.patientMergeRequest.create({
    data: {
      hospitalId, sourcePatientId: input.sourcePatientId,
      targetPatientId: input.targetPatientId,
      reason: input.reason, requestedBy: userId,
    },
  });
}

export async function reviewMergeRequest(
  hospitalId: string, requestId: string, userId: string,
  decision: "APPROVED" | "REJECTED", reviewNotes?: string | null,
) {
  const existing = await prisma.patientMergeRequest.findFirst({
    where: { id: requestId, hospitalId, status: "PENDING" },
  });
  if (!existing) {
    throw new AppError(
      "Pending merge request was not found", 404, "MERGE_REQUEST_NOT_FOUND",
    );
  }
  const data: Prisma.PatientMergeRequestUncheckedUpdateInput = {
    status: decision, reviewedBy: userId, reviewedAt: new Date(),
  };
  if (reviewNotes !== undefined) data.reviewNotes = reviewNotes;
  return prisma.patientMergeRequest.update({
    where: { id: requestId }, data,
  });
}

export async function listIdentifiers(hospitalId: string, patientId: string) {
  await requirePatient(hospitalId, patientId);
  return prisma.patientIdentifier.findMany({
    where: { hospitalId, patientId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createIdentifier(
  hospitalId: string, patientId: string, userId: string,
  input: {
    identifierType: "QR" | "BARCODE" | "EXTERNAL";
    identifierValue: string;
    displayValue?: string | null;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
  },
) {
  await requirePatient(hospitalId, patientId);
  const data: Prisma.PatientIdentifierUncheckedCreateInput = {
    hospitalId, patientId, identifierType: input.identifierType,
    identifierValue: input.identifierValue,
    createdBy: userId, updatedBy: userId,
  };
  if (input.displayValue !== undefined) data.displayValue = input.displayValue;
  if (input.issuedAt !== undefined) data.issuedAt = input.issuedAt;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
  return prisma.patientIdentifier.create({ data });
}

export async function deactivateIdentifier(
  hospitalId: string, patientId: string, resourceId: string, userId: string,
) {
  await requirePatient(hospitalId, patientId);
  const existing = await prisma.patientIdentifier.findFirst({
    where: { id: resourceId, hospitalId, patientId, active: true },
  });
  if (!existing) {
    throw new AppError(
      "Patient identifier was not found", 404, "PATIENT_IDENTIFIER_NOT_FOUND",
    );
  }
  await prisma.patientIdentifier.update({
    where: { id: resourceId },
    data: { active: false, updatedBy: userId },
  });
}
