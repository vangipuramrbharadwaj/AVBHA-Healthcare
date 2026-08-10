import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

const include = {
  rolePermissions: {
    include: {
      permission: true,
    },
  },
  _count: {
    select: { userRoles: true },
  },
} satisfies Prisma.RoleInclude;

export function listRoles(hospitalId: string, search?: string, status?: any) {
  return prisma.role.findMany({
    where: {
      deletedAt: null,
      OR: [{ hospitalId }, { hospitalId: null }],
      ...(status ? { status } : {}),
      ...(search
        ? {
            AND: [{
              OR: [
                { roleCode: { contains: search, mode: "insensitive" } },
                { roleName: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }],
          }
        : {}),
    },
    include,
    orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
  });
}

export function findRole(hospitalId: string, id: string) {
  return prisma.role.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [{ hospitalId }, { hospitalId: null }],
    },
    include,
  });
}

export function countPermissions(ids: string[]) {
  return prisma.permission.count({ where: { id: { in: ids } } });
}

export async function createRole(
  hospitalId: string,
  actorId: string,
  input: any,
) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        hospitalId,
        roleCode: input.roleCode,
        roleName: input.roleName,
        description: input.description ?? null,
        dataScope: input.dataScope,
        status: input.status,
        isSystemRole: false,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });

    if (input.permissionIds.length) {
      await tx.rolePermission.createMany({
        data: input.permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
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
        module: "roles",
        entityType: "Role",
        entityId: role.id,
        newValues: {
          roleCode: role.roleCode,
          roleName: role.roleName,
          permissionIds: input.permissionIds,
        },
      },
    });

    return tx.role.findUniqueOrThrow({ where: { id: role.id }, include });
  });
}

export async function updateRole(
  hospitalId: string,
  actorId: string,
  id: string,
  input: any,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.role.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });
    if (!current) return null;

    const role = await tx.role.update({
      where: { id },
      data: { ...input, updatedBy: actorId },
    });

    await tx.auditLog.create({
      data: {
        hospitalId,
        userId: actorId,
        action: AuditAction.UPDATE,
        module: "roles",
        entityType: "Role",
        entityId: id,
        oldValues: {
          roleName: current.roleName,
          dataScope: current.dataScope,
          status: current.status,
        },
        newValues: {
          roleName: role.roleName,
          dataScope: role.dataScope,
          status: role.status,
        },
      },
    });

    return tx.role.findUniqueOrThrow({ where: { id }, include });
  });
}

export async function setPermissions(
  hospitalId: string,
  actorId: string,
  roleId: string,
  permissionIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findFirst({
      where: { id: roleId, hospitalId, deletedAt: null, isSystemRole: false },
    });
    if (!role) return null;

    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
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
        module: "roles",
        entityType: "RolePermission",
        entityId: roleId,
        newValues: { permissionIds },
      },
    });

    return tx.role.findUniqueOrThrow({ where: { id: roleId }, include });
  });
}
