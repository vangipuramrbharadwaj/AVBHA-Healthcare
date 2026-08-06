import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  CreateDepartmentInput,
  DepartmentListQuery,
  UpdateDepartmentInput,
  UpdateDepartmentStatusInput,
} from "./departments.schema";

export async function listDepartments(
  hospitalId: string,
  query: DepartmentListQuery,
) {
  const where: Prisma.DepartmentWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { departmentName: { contains: query.search, mode: "insensitive" } },
            { departmentCode: { contains: query.search, mode: "insensitive" } },
            { departmentType: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            branchCode: true,
            branchName: true,
          },
        },
        _count: {
          select: {
            employees: true,
            doctors: true,
            designations: true,
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
    }),
    prisma.department.count({ where }),
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

export function findDepartment(hospitalId: string, id: string) {
  return prisma.department.findFirst({
    where: { id, hospitalId, deletedAt: null },
    include: {
      branch: true,
      designations: {
        where: { deletedAt: null },
        orderBy: { designationName: "asc" },
      },
      _count: {
        select: {
          employees: true,
          doctors: true,
          designations: true,
        },
      },
    },
  });
}

export function branchExists(hospitalId: string, branchId: string) {
  return prisma.hospitalBranch.count({
    where: {
      id: branchId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

function buildDepartmentCreateData(
  hospitalId: string,
  userId: string,
  input: CreateDepartmentInput,
): Prisma.DepartmentUncheckedCreateInput {
  const data: Prisma.DepartmentUncheckedCreateInput = {
    hospitalId,
    departmentCode: input.departmentCode,
    departmentName: input.departmentName,
    departmentType: input.departmentType,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.branchId !== undefined) {
    data.branchId = input.branchId;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }

  return data;
}

function buildDepartmentUpdateData(
  userId: string,
  input: UpdateDepartmentInput,
): Prisma.DepartmentUncheckedUpdateInput {
  const data: Prisma.DepartmentUncheckedUpdateInput = {
    updatedBy: userId,
  };

  if (input.branchId !== undefined) {
    data.branchId = input.branchId;
  }
  if (input.departmentName !== undefined) {
    data.departmentName = input.departmentName;
  }
  if (input.departmentType !== undefined) {
    data.departmentType = input.departmentType;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }

  return data;
}

export function createDepartment(
  hospitalId: string,
  userId: string,
  input: CreateDepartmentInput,
) {
  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.create({
      data: buildDepartmentCreateData(hospitalId, userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "departments",
        entityType: "Department",
        entityId: department.id,
        newValues: department,
      },
    });

    return department;
  });
}

export function updateDepartment(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDepartmentInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.department.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const department = await transaction.department.update({
      where: { id },
      data: buildDepartmentUpdateData(userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "departments",
        entityType: "Department",
        entityId: id,
        oldValues: existing,
        newValues: department,
      },
    });

    return department;
  });
}

export function updateDepartmentStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDepartmentStatusInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.department.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const department = await transaction.department.update({
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
        module: "departments",
        entityType: "Department",
        entityId: id,
        oldValues: existing,
        newValues: department,
      },
    });

    return department;
  });
}
