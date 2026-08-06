import { prisma } from "../../database/prisma";

function startOfToday(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function findHospital(hospitalId: string) {
  return prisma.hospital.findFirst({
    where: {
      id: hospitalId,
      active: true,
      deletedAt: null,
    },
    select: {
      id: true,
      hospitalCode: true,
      displayName: true,
    },
  });
}

export function findBranch(
  hospitalId: string,
  branchId?: string,
) {
  return prisma.hospitalBranch.findFirst({
    where: {
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
      ...(branchId ? { id: branchId } : { isMainBranch: true }),
    },
    select: {
      id: true,
      branchCode: true,
      branchName: true,
    },
  });
}

export function findUser(userId: string, hospitalId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

export async function workforceSummary(
  hospitalId: string,
  branchId?: string,
) {
  const branchFilter = branchId ? { branchId } : {};

  const [
    departments,
    employees,
    doctors,
    activeUsers,
  ] = await Promise.all([
    prisma.department.count({
      where: {
        hospitalId,
        deletedAt: null,
        status: "ACTIVE",
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
    }),
    prisma.employee.count({
      where: {
        hospitalId,
        deletedAt: null,
        status: "ACTIVE",
        ...branchFilter,
      },
    }),
    prisma.doctor.count({
      where: {
        hospitalId,
        deletedAt: null,
        status: "ACTIVE",
        ...(branchId
          ? {
              employee: {
                branchId,
                deletedAt: null,
                status: "ACTIVE",
              },
            }
          : {}),
      },
    }),
    prisma.user.count({
      where: {
        hospitalId,
        deletedAt: null,
        status: "ACTIVE",
        ...branchFilter,
      },
    }),
  ]);

  return {
    departments,
    employees,
    doctors,
    activeUsers,
  };
}

export async function securitySummary(hospitalId: string) {
  const today = startOfToday();

  const [
    activeSessions,
    failedLoginsToday,
    criticalEventsToday,
  ] = await Promise.all([
    prisma.userSession.count({
      where: {
        hospitalId,
        status: "ACTIVE",
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.loginAttempt.count({
      where: {
        hospitalId,
        attemptedAt: { gte: today },
        result: {
          not: "SUCCESS",
        },
      },
    }),
    prisma.securityEvent.count({
      where: {
        hospitalId,
        eventAt: { gte: today },
        severity: "CRITICAL",
      },
    }),
  ]);

  return {
    activeSessions,
    failedLoginsToday,
    criticalEventsToday,
  };
}
