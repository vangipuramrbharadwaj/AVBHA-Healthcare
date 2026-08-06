import {
  AppointmentStatus,
  QueueEntryStatus,
  QueueStatus,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

async function requireEntry(
  hospitalId: string,
  entryId: string,
) {
  const entry = await prisma.appointmentQueueEntry.findFirst({
    where: {
      id: entryId,
      hospitalId,
    },
    include: {
      queue: true,
      appointment: true,
    },
  });

  if (!entry) {
    throw new AppError(
      "Queue entry was not found",
      404,
      "QUEUE_ENTRY_NOT_FOUND",
    );
  }

  return entry;
}

export async function callEntry(
  hospitalId: string,
  entryId: string,
  userId: string,
) {
  const entry = await requireEntry(hospitalId, entryId);

if (
  entry.status !== QueueEntryStatus.WAITING &&
  entry.status !== QueueEntryStatus.SKIPPED &&
  entry.status !== QueueEntryStatus.HELD
) {
    throw new AppError(
      "This queue entry cannot be called",
      409,
      "INVALID_QUEUE_ENTRY_STATUS",
    );
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.appointmentQueue.update({
      where: { id: entry.queueId },
      data: {
        currentToken: entry.tokenCode,
        updatedBy: userId,
      },
    });

    return transaction.appointmentQueueEntry.update({
      where: { id: entry.id },
      data: {
        status: QueueEntryStatus.CALLED,
        calledAt: new Date(),
        updatedBy: userId,
      },
    });
  });
}

export async function startConsultation(
  hospitalId: string,
  entryId: string,
  userId: string,
) {
  const entry = await requireEntry(hospitalId, entryId);

if (
  entry.status !== QueueEntryStatus.CALLED &&
  entry.status !== QueueEntryStatus.WAITING
) {
  
    throw new AppError(
      "This queue entry cannot start consultation",
      409,
      "INVALID_QUEUE_ENTRY_STATUS",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.appointmentQueueEntry.update({
      where: { id: entry.id },
      data: {
        status: QueueEntryStatus.IN_PROGRESS,
        startedAt: new Date(),
        updatedBy: userId,
      },
    });

    if (entry.appointmentId) {
      await transaction.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: AppointmentStatus.IN_PROGRESS,
          updatedBy: userId,
        },
      });
    }

    return updated;
  });
}

export async function holdEntry(
  hospitalId: string,
  entryId: string,
  userId: string,
  notes?: string | null,
) {
  const entry = await requireEntry(hospitalId, entryId);

  return prisma.appointmentQueueEntry.update({
    where: { id: entry.id },
    data: {
      status: QueueEntryStatus.HELD,
      heldAt: new Date(),
      updatedBy: userId,
      ...(notes !== undefined ? { notes } : {}),
    },
  });
}

export async function skipEntry(
  hospitalId: string,
  entryId: string,
  userId: string,
  notes?: string | null,
) {
  const entry = await requireEntry(hospitalId, entryId);

  return prisma.appointmentQueueEntry.update({
    where: { id: entry.id },
    data: {
      status: QueueEntryStatus.SKIPPED,
      skippedAt: new Date(),
      updatedBy: userId,
      ...(notes !== undefined ? { notes } : {}),
    },
  });
}

export async function completeEntry(
  hospitalId: string,
  entryId: string,
  userId: string,
  notes?: string | null,
) {
  const entry = await requireEntry(hospitalId, entryId);

  if (entry.status !== QueueEntryStatus.IN_PROGRESS) {
    throw new AppError(
      "Only an in-progress queue entry can be completed",
      409,
      "INVALID_QUEUE_ENTRY_STATUS",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const completedAt = new Date();

    const updated = await transaction.appointmentQueueEntry.update({
      where: { id: entry.id },
      data: {
        status: QueueEntryStatus.COMPLETED,
        completedAt,
        updatedBy: userId,
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    if (entry.appointmentId) {
      await transaction.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt,
          updatedBy: userId,
        },
      });
    }

    return updated;
  });
}

export async function cancelEntry(
  hospitalId: string,
  entryId: string,
  userId: string,
  notes?: string | null,
) {
  const entry = await requireEntry(hospitalId, entryId);

  return prisma.appointmentQueueEntry.update({
    where: { id: entry.id },
    data: {
      status: QueueEntryStatus.CANCELLED,
      cancelledAt: new Date(),
      updatedBy: userId,
      ...(notes !== undefined ? { notes } : {}),
    },
  });
}

export async function markNoShow(
  hospitalId: string,
  entryId: string,
  userId: string,
  notes?: string | null,
) {
  const entry = await requireEntry(hospitalId, entryId);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.appointmentQueueEntry.update({
      where: { id: entry.id },
      data: {
        status: QueueEntryStatus.NO_SHOW,
        updatedBy: userId,
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    if (entry.appointmentId) {
      await transaction.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: AppointmentStatus.NO_SHOW,
          updatedBy: userId,
        },
      });
    }

    return updated;
  });
}

export async function nextEntry(
  hospitalId: string,
  queueId: string,
  userId: string,
) {
  const queue = await prisma.appointmentQueue.findFirst({
    where: {
      id: queueId,
      hospitalId,
      status: QueueStatus.OPEN,
    },
  });

  if (!queue) {
    throw new AppError(
      "Open queue was not found",
      404,
      "QUEUE_NOT_FOUND",
    );
  }

  const next = await prisma.appointmentQueueEntry.findFirst({
    where: {
      hospitalId,
      queueId,
      status: QueueEntryStatus.WAITING,
    },
    orderBy: [
      { priority: "desc" },
      { tokenNumber: "asc" },
    ],
  });

  if (!next) {
    throw new AppError(
      "No waiting patient is available",
      404,
      "QUEUE_EMPTY",
    );
  }

  return callEntry(hospitalId, next.id, userId);
}

export async function queueDashboard(
  hospitalId: string,
  query: {
    queueId?: string;
    doctorId?: string;
    branchId?: string;
    date?: Date;
  },
) {
  const date = query.date ?? new Date();

  const where = {
    hospitalId,
    ...(query.queueId ? { queueId: query.queueId } : {}),
    ...(query.doctorId ? { doctorId: query.doctorId } : {}),
    ...(query.branchId ? { branchId: query.branchId } : {}),
    checkInAt: {
      gte: startOfDay(date),
      lte: endOfDay(date),
    },
  };

  const [grouped, waitingEntries, completedEntries] =
    await Promise.all([
      prisma.appointmentQueueEntry.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.appointmentQueueEntry.findMany({
        where: {
          ...where,
          status: QueueEntryStatus.WAITING,
        },
        select: { checkInAt: true },
      }),
      prisma.appointmentQueueEntry.findMany({
        where: {
          ...where,
          status: QueueEntryStatus.COMPLETED,
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

  const counts = Object.fromEntries(
    grouped.map((item) => [
      item.status,
      item._count._all,
    ]),
  );

  const now = Date.now();

  const averageWaitingMinutes =
    waitingEntries.length === 0
      ? 0
      : Math.round(
          waitingEntries.reduce(
            (sum, item) =>
              sum + (now - item.checkInAt.getTime()) / 60000,
            0,
          ) / waitingEntries.length,
        );

  const completedWithTimes = completedEntries.filter(
    (
      item,
    ): item is {
      startedAt: Date;
      completedAt: Date;
    } =>
      item.startedAt !== null &&
      item.completedAt !== null,
  );

  const averageConsultationMinutes =
    completedWithTimes.length === 0
      ? 0
      : Math.round(
          completedWithTimes.reduce(
            (sum, item) =>
              sum +
              (item.completedAt.getTime() -
                item.startedAt.getTime()) /
                60000,
            0,
          ) / completedWithTimes.length,
        );

  return {
    date: startOfDay(date).toISOString().slice(0, 10),
    total: grouped.reduce(
      (sum, item) => sum + item._count._all,
      0,
    ),
    waiting: counts.WAITING ?? 0,
    called: counts.CALLED ?? 0,
    inProgress: counts.IN_PROGRESS ?? 0,
    held: counts.HELD ?? 0,
    skipped: counts.SKIPPED ?? 0,
    completed: counts.COMPLETED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
    noShow: counts.NO_SHOW ?? 0,
    averageWaitingMinutes,
    averageConsultationMinutes,
  };
}
