import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

const userInclude = {
  branch: {
    select: { id: true, branchCode: true, branchName: true },
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      middleName: true,
      lastName: true,
      departmentId: true,
      designationId: true,
    },
  },
  userRoles: {
    include: {
      role: {
        select: {
          id: true,
          roleCode: true,
          roleName: true,
          dataScope: true,
          isSystemRole: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export async function listUsers(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    search?: string | undefined;
    branchId?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "SUSPENDED" | undefined;
  },
) {
  const where: Prisma.UserWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { username: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { fullName: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
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

export function findUser(hospitalId: string, id: string) {
  return prisma.user.findFirst({
    where: { id, hospitalId, deletedAt: null },
    include: userInclude,
  });
}

export function findEmployee(hospitalId: string, employeeId: string) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    include: { user: { select: { id: true } } },
  });
}

export function findBranch(hospitalId: string, branchId: string) {
  return prisma.hospitalBranch.findFirst({
    where: {
      id: branchId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function listAssignableRoles(hospitalId: string) {
  return prisma.role.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ hospitalId }, { hospitalId: null }],
    },
    orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
  });
}

export function rolesByIds(hospitalId: string, roleIds: string[]) {
  return prisma.role.findMany({
    where: {
      id: { in: roleIds },
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ hospitalId }, { hospitalId: null }],
    },
    select: { id: true },
  });
}

export async function createUser(
  hospitalId: string,
  actorId: string,
  data: Prisma.UserUncheckedCreateInput,
  roleIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data });

    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          createdBy: actorId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId: actorId,
        action: AuditAction.CREATE,
        module: "users",
        entityType: "User",
        entityId: user.id,
        newValues: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          status: user.status,
          roleIds,
        },
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: userInclude,
    });
  });
}

export async function updateUser(
  hospitalId: string,
  actorId: string,
  id: string,
  data: Prisma.UserUncheckedUpdateInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });
    if (!existing) return null;

    const user = await tx.user.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        hospitalId,
        userId: actorId,
        action: AuditAction.UPDATE,
        module: "users",
        entityType: "User",
        entityId: id,
        oldValues: {
          fullName: existing.fullName,
          username: existing.username,
          status: existing.status,
        },
        newValues: {
          fullName: user.fullName,
          username: user.username,
          status: user.status,
        },
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id },
      include: userInclude,
    });
  });
}

export async function setRoles(
  hospitalId: string,
  actorId: string,
  userId: string,
  roleIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId, hospitalId, deletedAt: null },
    });
    if (!user) return null;

    await tx.userRole.deleteMany({ where: { userId } });
    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          createdBy: actorId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId: actorId,
        action: AuditAction.UPDATE,
        module: "users",
        entityType: "UserRole",
        entityId: userId,
        newValues: { roleIds },
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: userInclude,
    });
  });
}
