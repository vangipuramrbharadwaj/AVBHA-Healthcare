import {
  AppointmentStatus,
  Prisma,
  RecordStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function atTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

async function requireDoctorAndBranch(
  hospitalId: string,
  doctorId: string,
  branchId: string,
): Promise<void> {
  const [doctor, branch] = await Promise.all([
    prisma.doctor.count({
      where: { id: doctorId, hospitalId, deletedAt: null },
    }),
    prisma.hospitalBranch.count({
      where: { id: branchId, hospitalId, deletedAt: null },
    }),
  ]);

  if (!doctor) {
    throw new AppError("Doctor was not found", 404, "DOCTOR_NOT_FOUND");
  }
  if (!branch) {
    throw new AppError("Branch was not found", 404, "BRANCH_NOT_FOUND");
  }
}

export async function createSchedule(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    maxAppointments?: number | null;
    effectiveFrom: Date;
    effectiveTo?: Date | null;
  },
) {
  await requireDoctorAndBranch(hospitalId, input.doctorId, input.branchId);

  const data: Prisma.DoctorScheduleUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId,
    doctorId: input.doctorId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    slotDuration: input.slotDuration,
    effectiveFrom: input.effectiveFrom,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.maxAppointments !== undefined) {
    data.maxAppointments = input.maxAppointments;
  }
  if (input.effectiveTo !== undefined) {
    data.effectiveTo = input.effectiveTo;
  }

  return prisma.doctorSchedule.create({ data });
}

export function listSchedules(
  hospitalId: string,
  input: {
    doctorId?: string;
    branchId?: string;
    dayOfWeek?: number;
  },
) {
  return prisma.doctorSchedule.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      ...(input.doctorId ? { doctorId: input.doctorId } : {}),
      ...(input.branchId ? { branchId: input.branchId } : {}),
      ...(input.dayOfWeek !== undefined
        ? { dayOfWeek: input.dayOfWeek }
        : {}),
    },
    include: {
      breaks: {
        where: { deletedAt: null, status: RecordStatus.ACTIVE },
      },
    },
    orderBy: [
      { doctorId: "asc" },
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });
}

export async function updateSchedule(
  hospitalId: string,
  id: string,
  userId: string,
  input: Record<string, unknown>,
) {
  const existing = await prisma.doctorSchedule.findFirst({
    where: { id, hospitalId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError(
      "Doctor schedule was not found",
      404,
      "DOCTOR_SCHEDULE_NOT_FOUND",
    );
  }

  const data: Prisma.DoctorScheduleUncheckedUpdateInput = {
    updatedBy: userId,
  };

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  }

  return prisma.doctorSchedule.update({
    where: { id },
    data,
  });
}

export async function archiveSchedule(
  hospitalId: string,
  id: string,
  userId: string,
) {
  const existing = await prisma.doctorSchedule.findFirst({
    where: { id, hospitalId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError(
      "Doctor schedule was not found",
      404,
      "DOCTOR_SCHEDULE_NOT_FOUND",
    );
  }

  await prisma.doctorSchedule.update({
    where: { id },
    data: {
      status: RecordStatus.ARCHIVED,
      deletedAt: new Date(),
      updatedBy: userId,
    },
  });
}

export async function addBreak(
  hospitalId: string,
  scheduleId: string,
  userId: string,
  input: {
    breakName: string;
    startTime: string;
    endTime: string;
  },
) {
  const schedule = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, hospitalId, deletedAt: null },
  });

  if (!schedule) {
    throw new AppError(
      "Doctor schedule was not found",
      404,
      "DOCTOR_SCHEDULE_NOT_FOUND",
    );
  }

  if (
    input.startTime < schedule.startTime ||
    input.endTime > schedule.endTime
  ) {
    throw new AppError(
      "Break must be within schedule hours",
      400,
      "INVALID_SCHEDULE_BREAK",
    );
  }

  return prisma.doctorScheduleBreak.create({
    data: {
      hospitalId,
      doctorId: schedule.doctorId,
      scheduleId,
      breakName: input.breakName,
      startTime: input.startTime,
      endTime: input.endTime,
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

export async function createHoliday(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    doctorId: string;
    holidayDate: Date;
    reason?: string | null;
    allDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
  },
) {
  await requireDoctorAndBranch(hospitalId, input.doctorId, input.branchId);

  const data: Prisma.DoctorScheduleHolidayUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId,
    doctorId: input.doctorId,
    holidayDate: startOfDay(input.holidayDate),
    allDay: input.allDay,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.reason !== undefined) data.reason = input.reason;
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;

  return prisma.doctorScheduleHoliday.create({ data });
}

export async function availableSlots(
  hospitalId: string,
  doctorId: string,
  branchId: string,
  date: Date,
) {
  await requireDoctorAndBranch(hospitalId, doctorId, branchId);

  const target = startOfDay(date);
  const dayOfWeek = target.getDay();

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      hospitalId,
      doctorId,
      branchId,
      dayOfWeek,
      deletedAt: null,
      status: RecordStatus.ACTIVE,
      effectiveFrom: { lte: target },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: target } },
      ],
    },
    include: {
      breaks: {
        where: { deletedAt: null, status: RecordStatus.ACTIVE },
      },
    },
  });

  const holiday = await prisma.doctorScheduleHoliday.findFirst({
    where: {
      hospitalId,
      doctorId,
      branchId,
      holidayDate: target,
      deletedAt: null,
      status: RecordStatus.ACTIVE,
    },
  });

  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);

  const [appointments, locks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        hospitalId,
        doctorId,
        branchId,
        deletedAt: null,
        startTime: { gte: target, lte: endOfDay },
        status: {
          notIn: [
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
            AppointmentStatus.RESCHEDULED,
          ],
        },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.appointmentSlotLock.findMany({
      where: {
        hospitalId,
        doctorId,
        branchId,
        releasedAt: null,
        expiresAt: { gt: new Date() },
        slotStart: { gte: target, lte: endOfDay },
      },
      select: { slotStart: true, slotEnd: true },
    }),
  ]);

  const slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    reason: string | null;
  }> = [];

  for (const schedule of schedules) {
    let cursor = atTime(target, schedule.startTime);
    const scheduleEnd = atTime(target, schedule.endTime);

    while (cursor < scheduleEnd) {
      const slotEnd = new Date(
        cursor.getTime() + schedule.slotDuration * 60000,
      );
      if (slotEnd > scheduleEnd) break;

      const inBreak = schedule.breaks.some((item) => {
        const breakStart = atTime(target, item.startTime);
        const breakEnd = atTime(target, item.endTime);
        return cursor < breakEnd && slotEnd > breakStart;
      });

      const holidayBlocked =
        holiday !== null &&
        (
          holiday.allDay ||
          (
            holiday.startTime !== null &&
            holiday.endTime !== null &&
            cursor < atTime(target, holiday.endTime) &&
            slotEnd > atTime(target, holiday.startTime)
          )
        );

      const booked = appointments.some(
        (item) => cursor < item.endTime && slotEnd > item.startTime,
      );

      const locked = locks.some(
        (item) => cursor < item.slotEnd && slotEnd > item.slotStart,
      );

      let reason: string | null = null;
      if (inBreak) reason = "BREAK";
      else if (holidayBlocked) reason = "HOLIDAY";
      else if (booked) reason = "BOOKED";
      else if (locked) reason = "LOCKED";

      slots.push({
        startTime: cursor.toISOString(),
        endTime: slotEnd.toISOString(),
        available: reason === null,
        reason,
      });

      cursor = slotEnd;
    }
  }

  return {
    doctorId,
    branchId,
    date: target.toISOString().slice(0, 10),
    slots,
  };
}

export async function lockSlot(
  hospitalId: string,
  userId: string,
  input: {
    doctorId: string;
    branchId: string;
    patientId?: string | null;
    slotStart: Date;
    slotEnd: Date;
    lockMinutes: number;
  },
) {
  await requireDoctorAndBranch(hospitalId, input.doctorId, input.branchId);

  const existing = await prisma.appointmentSlotLock.findFirst({
    where: {
      hospitalId,
      doctorId: input.doctorId,
      branchId: input.branchId,
      releasedAt: null,
      expiresAt: { gt: new Date() },
      slotStart: { lt: input.slotEnd },
      slotEnd: { gt: input.slotStart },
    },
  });

  if (existing) {
    throw new AppError(
      "The selected slot is already locked",
      409,
      "APPOINTMENT_SLOT_LOCKED",
    );
  }

  const data: Prisma.AppointmentSlotLockUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId,
    doctorId: input.doctorId,
    lockToken: randomUUID(),
    slotStart: input.slotStart,
    slotEnd: input.slotEnd,
    expiresAt: new Date(Date.now() + input.lockMinutes * 60000),
    createdBy: userId,
  };

  if (input.patientId !== undefined) {
    data.patientId = input.patientId;
  }

  return prisma.appointmentSlotLock.create({ data });
}

export async function releaseSlot(
  hospitalId: string,
  lockToken: string,
) {
  const existing = await prisma.appointmentSlotLock.findFirst({
    where: { hospitalId, lockToken, releasedAt: null },
  });

  if (!existing) {
    throw new AppError(
      "Slot lock was not found",
      404,
      "APPOINTMENT_SLOT_LOCK_NOT_FOUND",
    );
  }

  return prisma.appointmentSlotLock.update({
    where: { id: existing.id },
    data: { releasedAt: new Date() },
  });
}
