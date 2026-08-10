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

function endOfToday(): Date {
  const value = startOfToday();
  value.setDate(value.getDate() + 1);
  return value;
}

function expiryAlertDate(): Date {
  const value = startOfToday();
  value.setDate(value.getDate() + 90);
  return value;
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
              OR: [
                {
                  employee: {
                    branchId,
                    deletedAt: null,
                    status: "ACTIVE",
                  },
                },
                {
                  employeeId: null,
                },
              ],
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

export async function patientTotal(
  hospitalId: string,
  branchId?: string,
) {
  return prisma.patient.count({
    where: {
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
      ...(branchId ? { branchId } : {}),
    },
  });
}

export async function todaySummary(
  hospitalId: string,
  branchId?: string,
) {
  const start = startOfToday();
  const end = endOfToday();
  const branchFilter = branchId ? { branchId } : {};

  const [
    patientsRegistered,
    appointments,
    opdVisits,
    ipdAdmissions,
    discharges,
    otCases,
    paymentSummary,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        hospitalId,
        deletedAt: null,
        createdAt: { gte: start, lt: end },
        ...branchFilter,
      },
    }),
    prisma.appointment.count({
      where: {
        hospitalId,
        appointmentDate: { gte: start, lt: end },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.opdVisit.count({
      where: {
        hospitalId,
        visitDate: { gte: start, lt: end },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.ipdAdmission.count({
      where: {
        hospitalId,
        admissionDate: { gte: start, lt: end },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.ipdAdmission.count({
      where: {
        hospitalId,
        dischargedAt: { gte: start, lt: end },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.otBooking.count({
      where: {
        hospitalId,
        scheduledStart: { gte: start, lt: end },
        ...branchFilter,
      },
    }),
    prisma.billingPayment.aggregate({
      where: {
        hospitalId,
        paymentDate: { gte: start, lt: end },
        status: "COMPLETED",
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    patientsRegistered,
    appointments,
    opdVisits,
    ipdAdmissions,
    discharges,
    otCases,
    payments: paymentSummary._count.id,
    revenue: Number(paymentSummary._sum.amount ?? 0),
  };
}

export async function clinicalQueues(
  hospitalId: string,
  branchId?: string,
) {
  const start = startOfToday();
  const end = endOfToday();
  const branchFilter = branchId ? { branchId } : {};

  const [
    appointmentsWaiting,
    opdInProgress,
    laboratoryPending,
    radiologyPending,
    pharmacyPending,
    otPending,
    dischargePlanned,
    outstanding,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        hospitalId,
        appointmentDate: { gte: start, lt: end },
        status: {
          in: ["BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"],
        },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.opdVisit.count({
      where: {
        hospitalId,
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.labOrder.count({
      where: {
        hospitalId,
        status: {
          notIn: ["REPORTED", "CANCELLED"],
        },
        ...branchFilter,
      },
    }),
    prisma.radiologyOrder.count({
      where: {
        hospitalId,
        status: {
          notIn: ["REPORTED", "CANCELLED"],
        },
        ...branchFilter,
      },
    }),
    prisma.pharmacyDispense.count({
      where: {
        hospitalId,
        status: {
          in: ["PENDING", "PARTIAL"],
        },
        ...branchFilter,
      },
    }),
    prisma.otBooking.count({
      where: {
        hospitalId,
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
        ...branchFilter,
      },
    }),
    prisma.ipdAdmission.count({
      where: {
        hospitalId,
        status: "DISCHARGE_PLANNED",
        deletedAt: null,
        ...branchFilter,
      },
    }),
    prisma.billingInvoice.aggregate({
      where: {
        hospitalId,
        status: {
          in: ["ISSUED", "PARTIALLY_PAID"],
        },
        balanceAmount: { gt: 0 },
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { balanceAmount: true },
    }),
  ]);

  return {
    appointmentsWaiting,
    opdInProgress,
    laboratoryPending,
    radiologyPending,
    pharmacyPending,
    otPending,
    dischargePlanned,
    billingOutstandingCount: outstanding._count.id,
    billingOutstandingAmount: Number(
      outstanding._sum.balanceAmount ?? 0,
    ),
  };
}

export async function bedSummary(
  hospitalId: string,
  branchId?: string,
) {
  const where = {
    hospitalId,
    status: "ACTIVE" as const,
    ...(branchId ? { branchId } : {}),
  };

  const [
    total,
    available,
    occupied,
    reserved,
    maintenance,
    blocked,
  ] = await Promise.all([
    prisma.ipdBed.count({ where }),
    prisma.ipdBed.count({
      where: { ...where, bedStatus: "AVAILABLE" },
    }),
    prisma.ipdBed.count({
      where: { ...where, bedStatus: "OCCUPIED" },
    }),
    prisma.ipdBed.count({
      where: { ...where, bedStatus: "RESERVED" },
    }),
    prisma.ipdBed.count({
      where: { ...where, bedStatus: "MAINTENANCE" },
    }),
    prisma.ipdBed.count({
      where: { ...where, bedStatus: "BLOCKED" },
    }),
  ]);

  return {
    total,
    available,
    occupied,
    reserved,
    maintenance,
    blocked,
    occupancyPercent:
      total > 0 ? Math.round((occupied / total) * 100) : 0,
  };
}

export async function pharmacySummary(
  hospitalId: string,
  branchId?: string,
) {
  const today = startOfToday();
  const alertUntil = expiryAlertDate();
  const where = {
    hospitalId,
    status: "ACTIVE" as const,
    ...(branchId ? { branchId } : {}),
  };

  const [
    expiryAlerts,
    expiredBatches,
    outOfStockBatches,
  ] = await Promise.all([
    prisma.pharmacyMedicineBatch.count({
      where: {
        ...where,
        expiryDate: {
          gte: today,
          lte: alertUntil,
        },
        availableQuantity: { gt: 0 },
      },
    }),
    prisma.pharmacyMedicineBatch.count({
      where: {
        ...where,
        expiryDate: { lt: today },
        availableQuantity: { gt: 0 },
      },
    }),
    prisma.pharmacyMedicineBatch.count({
      where: {
        ...where,
        availableQuantity: { lte: 0 },
      },
    }),
  ]);

  return {
    expiryAlerts,
    expiredBatches,
    outOfStockBatches,
  };
}

export async function activeIpdCount(
  hospitalId: string,
  branchId?: string,
) {
  return prisma.ipdAdmission.count({
    where: {
      hospitalId,
      status: {
        in: ["ACTIVE", "DISCHARGE_PLANNED"],
      },
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    },
  });
}
