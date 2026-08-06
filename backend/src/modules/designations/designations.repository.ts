import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  CreateDesignationInput,
  DesignationListQuery,
  UpdateDesignationInput,
  UpdateDesignationStatusInput,
} from "./designations.schema";

export async function listDesignations(
  hospitalId: string,
  query: DesignationListQuery,
) {
  const where: Prisma.DesignationWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { designationName: { contains: query.search, mode: "insensitive" } },
            { designationCode: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.designation.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            departmentCode: true,
            departmentName: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
    }),
    prisma.designation.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export function findDesignation(hospitalId: string, id: string) {
  return prisma.designation.findFirst({
    where: { id, hospitalId, deletedAt: null },
    include: {
      department: true,
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });
}

export function departmentExists(
  hospitalId: string,
  departmentId: string,
) {
  return prisma.department.count({
    where: {
      id: departmentId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

function buildDesignationCreateData(
  hospitalId: string,
  userId: string,
  input: CreateDesignationInput,
): Prisma.DesignationUncheckedCreateInput {
  const data: Prisma.DesignationUncheckedCreateInput = {
    hospitalId,
    designationCode: input.designationCode,
    designationName: input.designationName,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.departmentId !== undefined) {
    data.departmentId = input.departmentId;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }

  return data;
}

function buildDesignationUpdateData(
  userId: string,
  input: UpdateDesignationInput,
): Prisma.DesignationUncheckedUpdateInput {
  const data: Prisma.DesignationUncheckedUpdateInput = {
    updatedBy: userId,
  };

  if (input.departmentId !== undefined) {
    data.departmentId = input.departmentId;
  }
  if (input.designationName !== undefined) {
    data.designationName = input.designationName;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }

  return data;
}

export function createDesignation(
  hospitalId: string,
  userId: string,
  input: CreateDesignationInput,
) {
  return prisma.$transaction(async (transaction) => {
    const designation = await transaction.designation.create({
      data: buildDesignationCreateData(hospitalId, userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "designations",
        entityType: "Designation",
        entityId: designation.id,
        newValues: designation,
      },
    });

    return designation;
  });
}

export function updateDesignation(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDesignationInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.designation.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const designation = await transaction.designation.update({
      where: { id },
      data: buildDesignationUpdateData(userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "designations",
        entityType: "Designation",
        entityId: id,
        oldValues: existing,
        newValues: designation,
      },
    });

    return designation;
  });
}

export function updateDesignationStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDesignationStatusInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.designation.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const designation = await transaction.designation.update({
      where: { id },
      data: {
        status: input.status,
        updatedBy: userId,
      },
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "designations",
        entityType: "Designation",
        entityId: id,
        oldValues: existing,
        newValues: designation,
      },
    });

    return designation;
  });
}
