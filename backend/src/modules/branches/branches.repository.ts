import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  BranchListQuery,
  CreateBranchInput,
  UpdateBranchInput,
  UpdateBranchStatusInput,
} from "./branches.schema";

export async function listBranches(
  hospitalId: string,
  query: BranchListQuery,
) {
  const where: Prisma.HospitalBranchWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { branchName: { contains: query.search, mode: "insensitive" } },
            { branchCode: { contains: query.search, mode: "insensitive" } },
            { city: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.hospitalBranch.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
    }),
    prisma.hospitalBranch.count({ where }),
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

export function findBranch(hospitalId: string, id: string) {
  return prisma.hospitalBranch.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          departments: true,
          employees: true,
          users: true,
        },
      },
    },
  });
}

function buildBranchCreateData(
  hospitalId: string,
  userId: string,
  input: CreateBranchInput,
): Prisma.HospitalBranchUncheckedCreateInput {
  const data: Prisma.HospitalBranchUncheckedCreateInput = {
    hospitalId,
    branchCode: input.branchCode,
    branchName: input.branchName,
    branchType: input.branchType,
    phone: input.phone,
    address: input.address,
    isMainBranch: input.isMainBranch,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.email !== undefined) {
    data.email = input.email;
  }
  if (input.city !== undefined) {
    data.city = input.city;
  }
  if (input.state !== undefined) {
    data.state = input.state;
  }
  if (input.postalCode !== undefined) {
    data.postalCode = input.postalCode;
  }

  return data;
}

function buildBranchUpdateData(
  userId: string,
  input: UpdateBranchInput,
): Prisma.HospitalBranchUncheckedUpdateInput {
  const data: Prisma.HospitalBranchUncheckedUpdateInput = {
    updatedBy: userId,
  };

  if (input.branchName !== undefined) {
    data.branchName = input.branchName;
  }
  if (input.branchType !== undefined) {
    data.branchType = input.branchType;
  }
  if (input.email !== undefined) {
    data.email = input.email;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone;
  }
  if (input.address !== undefined) {
    data.address = input.address;
  }
  if (input.city !== undefined) {
    data.city = input.city;
  }
  if (input.state !== undefined) {
    data.state = input.state;
  }
  if (input.postalCode !== undefined) {
    data.postalCode = input.postalCode;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }

  return data;
}

export function createBranch(
  hospitalId: string,
  userId: string,
  input: CreateBranchInput,
) {
  return prisma.$transaction(async (transaction) => {
    if (input.isMainBranch) {
      await transaction.hospitalBranch.updateMany({
        where: {
          hospitalId,
          isMainBranch: true,
          deletedAt: null,
        },
        data: {
          isMainBranch: false,
          updatedBy: userId,
        },
      });
    }

    const branch = await transaction.hospitalBranch.create({
      data: buildBranchCreateData(hospitalId, userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "branches",
        entityType: "HospitalBranch",
        entityId: branch.id,
        newValues: branch,
      },
    });

    return branch;
  });
}

export function updateBranch(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateBranchInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.hospitalBranch.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const branch = await transaction.hospitalBranch.update({
      where: { id },
      data: buildBranchUpdateData(userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "branches",
        entityType: "HospitalBranch",
        entityId: id,
        oldValues: existing,
        newValues: branch,
      },
    });

    return branch;
  });
}

export function updateBranchStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateBranchStatusInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.hospitalBranch.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    const branch = await transaction.hospitalBranch.update({
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
        module: "branches",
        entityType: "HospitalBranch",
        entityId: id,
        oldValues: existing,
        newValues: branch,
      },
    });

    return branch;
  });
}
