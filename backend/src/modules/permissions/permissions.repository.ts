import { prisma } from "../../database/prisma";

export function listPermissions(
  moduleCode?: string,
  search?: string,
) {
  return prisma.permission.findMany({
    where: {
      ...(moduleCode ? { moduleCode } : {}),
      ...(search
        ? {
            OR: [
              { permissionCode: { contains: search, mode: "insensitive" } },
              { moduleCode: { contains: search, mode: "insensitive" } },
              { actionCode: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      { moduleCode: "asc" },
      { actionCode: "asc" },
    ],
  });
}
