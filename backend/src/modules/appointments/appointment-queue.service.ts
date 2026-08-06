import {
  AppointmentStatus,
  QueueEntryStatus,
  QueuePriority,
  QueueSource,
  QueueStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function day(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function createQueue(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    departmentId: string;
    doctorId: string;
    queueDate: Date;
    queueCode: string;
    tokenPrefix: string;
  },
) {
  const [branch, department, doctor] = await Promise.all([
    prisma.hospitalBranch.count({ where: { id: input.branchId, hospitalId, deletedAt: null } }),
    prisma.department.count({ where: { id: input.departmentId, hospitalId, deletedAt: null } }),
    prisma.doctor.count({ where: { id: input.doctorId, hospitalId, deletedAt: null } }),
  ]);

  if (!branch) throw new AppError("Branch was not found", 404, "BRANCH_NOT_FOUND");
  if (!department) throw new AppError("Department was not found", 404, "DEPARTMENT_NOT_FOUND");
  if (!doctor) throw new AppError("Doctor was not found", 404, "DOCTOR_NOT_FOUND");

  return prisma.appointmentQueue.create({
    data: {
      hospitalId,
      branchId: input.branchId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      queueDate: day(input.queueDate),
      queueCode: input.queueCode,
      tokenPrefix: input.tokenPrefix,
      status: QueueStatus.OPEN,
      openedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

export function listQueues(
  hospitalId: string,
  query: {
    doctorId?: string;
    date?: Date;
    status?: QueueStatus;
  },
) {
  return prisma.appointmentQueue.findMany({
    where: {
      hospitalId,
      ...(query.doctorId ? { doctorId: query.doctorId } : {}),
      ...(query.date ? { queueDate: day(query.date) } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: [{ queueDate: "desc" }, { queueCode: "asc" }],
  });
}

export async function getQueue(hospitalId: string, id: string) {
  const queue = await prisma.appointmentQueue.findFirst({
    where: { id, hospitalId },
    include: {
      entries: {
        include: {
          patient: {
            select: {
              id: true,
              uhid: true,
              firstName: true,
              middleName: true,
              lastName: true,
              primaryMobile: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { tokenNumber: "asc" }],
      },
    },
  });

  if (!queue) throw new AppError("Queue was not found", 404, "QUEUE_NOT_FOUND");
  return queue;
}

export async function createQueueEntry(
  hospitalId: string,
  userId: string,
  input: {
    queueId: string;
    patientId: string;
    appointmentId?: string | null;
    priority: QueuePriority;
    source: QueueSource;
    notes?: string | null;
  },
) {
  const queue = await prisma.appointmentQueue.findFirst({
    where: { id: input.queueId, hospitalId, status: QueueStatus.OPEN },
  });

  if (!queue) throw new AppError("Open queue was not found", 404, "QUEUE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const freshQueue = await tx.appointmentQueue.update({
      where: { id: queue.id },
      data: { nextTokenNumber: { increment: 1 }, updatedBy: userId },
    });

    const tokenNumber = freshQueue.nextTokenNumber - 1;
    const data: Prisma.AppointmentQueueEntryUncheckedCreateInput = {
      hospitalId,
      branchId: freshQueue.branchId,
      departmentId: freshQueue.departmentId,
      doctorId: freshQueue.doctorId,
      patientId: input.patientId,
      queueId: freshQueue.id,
      tokenNumber,
      tokenCode: `${freshQueue.tokenPrefix}${String(tokenNumber).padStart(4, "0")}`,
      priority: input.priority,
      source: input.source,
      status: QueueEntryStatus.WAITING,
      createdBy: userId,
      updatedBy: userId,
    };

    if (input.appointmentId !== undefined) data.appointmentId = input.appointmentId;
    if (input.notes !== undefined) data.notes = input.notes;

    const entry = await tx.appointmentQueueEntry.create({ data });

    if (input.appointmentId) {
      await tx.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: new Date(),
          updatedBy: userId,
        },
      });
    }

    return entry;
  });
}

export function listQueueEntries(
  hospitalId: string,
  query: {
    queueId?: string;
    status?: QueueEntryStatus;
    priority?: QueuePriority;
  },
) {
  return prisma.appointmentQueueEntry.findMany({
    where: {
      hospitalId,
      ...(query.queueId ? { queueId: query.queueId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    },
    include: {
      patient: {
        select: {
          id: true,
          uhid: true,
          firstName: true,
          lastName: true,
          primaryMobile: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { checkInAt: "asc" }],
  });
}
