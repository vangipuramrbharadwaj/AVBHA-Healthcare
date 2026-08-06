import {
  AppointmentPriority,
  AppointmentStatus,
  AppointmentType,
  AppointmentVisitType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function requireReferences(
  hospitalId: string,
  input: {
    branchId: string;
    departmentId: string;
    patientId: string;
    doctorId: string;
  },
): Promise<void> {
  const [branch, department, patient, doctor] = await Promise.all([
    prisma.hospitalBranch.count({
      where: {
        id: input.branchId,
        hospitalId,
        deletedAt: null,
      },
    }),
    prisma.department.count({
      where: {
        id: input.departmentId,
        hospitalId,
        deletedAt: null,
      },
    }),
    prisma.patient.count({
      where: {
        id: input.patientId,
        hospitalId,
        deletedAt: null,
      },
    }),
    prisma.doctor.count({
      where: {
        id: input.doctorId,
        hospitalId,
        deletedAt: null,
      },
    }),
  ]);

  if (!branch) {
    throw new AppError(
      "Branch was not found",
      404,
      "BRANCH_NOT_FOUND",
    );
  }

  if (!department) {
    throw new AppError(
      "Department was not found",
      404,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  if (!patient) {
    throw new AppError(
      "Patient was not found",
      404,
      "PATIENT_NOT_FOUND",
    );
  }

  if (!doctor) {
    throw new AppError(
      "Doctor was not found",
      404,
      "DOCTOR_NOT_FOUND",
    );
  }
}

async function ensureNoConflict(
  hospitalId: string,
  doctorId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string,
): Promise<void> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      hospitalId,
      doctorId,
      deletedAt: null,
      status: {
        notIn: [
          AppointmentStatus.CANCELLED,
          AppointmentStatus.NO_SHOW,
          AppointmentStatus.RESCHEDULED,
        ],
      },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeId
        ? { id: { not: excludeId } }
        : {}),
    },
  });

  if (conflict) {
    throw new AppError(
      `Doctor already has appointment ${conflict.appointmentNumber} during this time`,
      409,
      "DOCTOR_APPOINTMENT_CONFLICT",
    );
  }
}

async function nextNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const prefix = `APT-${year}${month}${day}`;

  const count = await prisma.appointment.count({
    where: {
      hospitalId,
      appointmentNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

const appointmentInclude = {
  patient: {
    select: {
      id: true,
      uhid: true,
      firstName: true,
      middleName: true,
      lastName: true,
      primaryMobile: true,
      gender: true,
      dateOfBirth: true,
    },
  },
  doctor: {
    select: {
      id: true,
      doctorCode: true,
      specialization: true,
      employee: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
    },
  },
  department: {
    select: {
      id: true,
      departmentCode: true,
      departmentName: true,
    },
  },
  branch: {
    select: {
      id: true,
      branchCode: true,
      branchName: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

export async function createAppointment(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    departmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    appointmentType: AppointmentType;
    visitType: AppointmentVisitType;
    priority: AppointmentPriority;
    status: AppointmentStatus;
    chiefComplaint?: string | null;
    reason?: string | null;
    notes?: string | null;
    internalNotes?: string | null;
    source?: string | null;
    referredBy?: string | null;
    confirmationMode?: string | null;
  },
) {
  await requireReferences(hospitalId, input);

  await ensureNoConflict(
    hospitalId,
    input.doctorId,
    input.startTime,
    input.endTime,
  );

  const appointmentNumber = await nextNumber(
    hospitalId,
    input.appointmentDate,
  );

  const data: Prisma.AppointmentUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId,
    departmentId: input.departmentId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    appointmentNumber,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    endTime: input.endTime,
    durationMinutes: input.durationMinutes,
    appointmentType: input.appointmentType,
    visitType: input.visitType,
    priority: input.priority,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.chiefComplaint !== undefined) {
    data.chiefComplaint = input.chiefComplaint;
  }
  if (input.reason !== undefined) {
    data.reason = input.reason;
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
  }
  if (input.internalNotes !== undefined) {
    data.internalNotes = input.internalNotes;
  }
  if (input.source !== undefined) {
    data.source = input.source;
  }
  if (input.referredBy !== undefined) {
    data.referredBy = input.referredBy;
  }
  if (input.confirmationMode !== undefined) {
    data.confirmationMode = input.confirmationMode;
  }

  return prisma.$transaction(async (transaction) => {
    const record = await transaction.appointment.create({
      data,
      include: appointmentInclude,
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "CREATE",
        module: "appointments",
        entityType: "Appointment",
        entityId: record.id,
        newValues: toJson(record),
      },
    });

    await transaction.patientTimelineEvent.create({
      data: {
        hospitalId,
        patientId: record.patientId,
        eventType: "APPOINTMENT_BOOKED",
        eventTitle: `Appointment ${record.appointmentNumber} booked`,
        sourceModule: "appointments",
        sourceEntityId: record.id,
        eventAt: record.startTime,
        createdBy: userId,
      },
    });

    return record;
  });
}

export async function listAppointments(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    search?: string;
    patientId?: string;
    doctorId?: string;
    branchId?: string;
    departmentId?: string;
    status?: AppointmentStatus;
    appointmentType?: AppointmentType;
    dateFrom?: Date;
    dateTo?: Date;
    sortOrder: "asc" | "desc";
  },
) {
  const where: Prisma.AppointmentWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.patientId
      ? { patientId: query.patientId }
      : {}),
    ...(query.doctorId
      ? { doctorId: query.doctorId }
      : {}),
    ...(query.branchId
      ? { branchId: query.branchId }
      : {}),
    ...(query.departmentId
      ? { departmentId: query.departmentId }
      : {}),
    ...(query.status
      ? { status: query.status }
      : {}),
    ...(query.appointmentType
      ? { appointmentType: query.appointmentType }
      : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          appointmentDate: {
            ...(query.dateFrom
              ? { gte: query.dateFrom }
              : {}),
            ...(query.dateTo
              ? { lte: query.dateTo }
              : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            {
              appointmentNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              patient: {
                firstName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
            {
              patient: {
                lastName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
            {
              patient: {
                primaryMobile: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [
        { appointmentDate: query.sortOrder },
        { startTime: query.sortOrder },
      ],
    }),
    prisma.appointment.count({ where }),
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

export async function getAppointment(
  hospitalId: string,
  id: string,
) {
  const record = await prisma.appointment.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
    include: appointmentInclude,
  });

  if (!record) {
    throw new AppError(
      "Appointment was not found",
      404,
      "APPOINTMENT_NOT_FOUND",
    );
  }

  return record;
}

export async function updateAppointment(
  hospitalId: string,
  id: string,
  userId: string,
  input: Record<string, unknown>,
) {
  const existing = await getAppointment(hospitalId, id);

  const doctorId =
    typeof input.doctorId === "string"
      ? input.doctorId
      : existing.doctorId;

  const startTime =
    input.startTime instanceof Date
      ? input.startTime
      : existing.startTime;

  const endTime =
    input.endTime instanceof Date
      ? input.endTime
      : existing.endTime;

  await ensureNoConflict(
    hospitalId,
    doctorId,
    startTime,
    endTime,
    id,
  );

  const data: Prisma.AppointmentUncheckedUpdateInput = {
    updatedBy: userId,
  };

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  }

  return prisma.appointment.update({
    where: { id },
    data,
    include: appointmentInclude,
  });
}

export async function cancelAppointment(
  hospitalId: string,
  id: string,
  userId: string,
  cancellationReason: string,
) {
  const existing = await getAppointment(hospitalId, id);

  if (
    existing.status === AppointmentStatus.CANCELLED ||
    existing.status === AppointmentStatus.COMPLETED
  ) {
    throw new AppError(
      "This appointment cannot be cancelled",
      409,
      "INVALID_APPOINTMENT_STATUS",
    );
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancellationReason,
      cancelledAt: new Date(),
      cancelledBy: userId,
      updatedBy: userId,
    },
    include: appointmentInclude,
  });
}

export async function rescheduleAppointment(
  hospitalId: string,
  id: string,
  userId: string,
  input: {
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    reason?: string | null;
  },
) {
  const existing = await getAppointment(hospitalId, id);

  if (
    existing.status === AppointmentStatus.CANCELLED ||
    existing.status === AppointmentStatus.COMPLETED
  ) {
    throw new AppError(
      "This appointment cannot be rescheduled",
      409,
      "INVALID_APPOINTMENT_STATUS",
    );
  }

  await ensureNoConflict(
    hospitalId,
    existing.doctorId,
    input.startTime,
    input.endTime,
    id,
  );

  const appointmentNumber = await nextNumber(
    hospitalId,
    input.appointmentDate,
  );

  return prisma.$transaction(async (transaction) => {
    await transaction.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.RESCHEDULED,
        updatedBy: userId,
      },
    });

    const data: Prisma.AppointmentUncheckedCreateInput = {
      hospitalId,
      branchId: existing.branchId,
      departmentId: existing.departmentId,
      patientId: existing.patientId,
      doctorId: existing.doctorId,
      appointmentNumber,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: Math.round(
        (input.endTime.getTime() - input.startTime.getTime()) /
          60000,
      ),
      appointmentType: existing.appointmentType,
      visitType: existing.visitType,
      priority: existing.priority,
      status: AppointmentStatus.BOOKED,
      rescheduledFromId: existing.id,
      createdBy: userId,
      updatedBy: userId,
    };

    if (existing.chiefComplaint !== null) {
      data.chiefComplaint = existing.chiefComplaint;
    }

    if (input.reason !== undefined) {
      data.reason = input.reason;
    } else if (existing.reason !== null) {
      data.reason = existing.reason;
    }

    if (existing.notes !== null) {
      data.notes = existing.notes;
    }

    if (existing.internalNotes !== null) {
      data.internalNotes = existing.internalNotes;
    }

    if (existing.source !== null) {
      data.source = existing.source;
    }

    if (existing.referredBy !== null) {
      data.referredBy = existing.referredBy;
    }

    if (existing.confirmationMode !== null) {
      data.confirmationMode = existing.confirmationMode;
    }

    return transaction.appointment.create({
      data,
      include: appointmentInclude,
    });
  });
}

export async function dashboard(
  hospitalId: string,
  date: Date,
) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const grouped = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      hospitalId,
      deletedAt: null,
      appointmentDate: {
        gte: start,
        lte: end,
      },
    },
    _count: {
      _all: true,
    },
  });

  const counts: Partial<Record<AppointmentStatus, number>> =
    Object.fromEntries(
      grouped.map((item) => [
        item.status,
        item._count._all,
      ]),
    );

  return {
    date: start.toISOString().slice(0, 10),
    total: grouped.reduce(
      (sum, item) => sum + item._count._all,
      0,
    ),
    booked: counts.BOOKED ?? 0,
    confirmed: counts.CONFIRMED ?? 0,
    checkedIn: counts.CHECKED_IN ?? 0,
    inProgress: counts.IN_PROGRESS ?? 0,
    completed: counts.COMPLETED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
    noShow: counts.NO_SHOW ?? 0,
    rescheduled: counts.RESCHEDULED ?? 0,
  };
}
