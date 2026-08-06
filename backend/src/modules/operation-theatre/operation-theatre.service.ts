import {
  OtBookingPriority,
  OtBookingStatus,
  OtChecklistStatus,
  OtRecoveryStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

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

async function nextBookingNumber(hospitalId: string, date: Date) {
  const prefix = `OT-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.otBooking.count({
    where: {
      hospitalId,
      bookingNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function nextSpecimenNumber(hospitalId: string, date: Date) {
  const prefix = `OTS-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.otSpecimen.count({
    where: {
      hospitalId,
      specimenNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function requireBooking(hospitalId: string, id: string) {
  const booking = await prisma.otBooking.findFirst({
    where: {
      id,
      hospitalId,
    },
  });

  if (!booking) {
    throw new AppError(
      "OT booking was not found",
      404,
      "OT_BOOKING_NOT_FOUND",
    );
  }

  return booking;
}

async function checkScheduleConflict(
  hospitalId: string,
  roomId: string,
  surgeonId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
) {
  const conflict = await prisma.otBooking.findFirst({
    where: {
      hospitalId,
      ...(excludeBookingId
        ? { id: { not: excludeBookingId } }
        : {}),
      status: {
        notIn: [
          OtBookingStatus.CANCELLED,
          OtBookingStatus.COMPLETED,
          OtBookingStatus.RESCHEDULED,
        ],
      },
      scheduledStart: { lt: end },
      scheduledEnd: { gt: start },
      OR: [
        { otRoomId: roomId },
        { primarySurgeonId: surgeonId },
      ],
    },
  });

  if (conflict) {
    throw new AppError(
      "OT room or primary surgeon has a schedule conflict",
      409,
      "OT_SCHEDULE_CONFLICT",
    );
  }
}

export async function createRoom(
  hospitalId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  return prisma.otRoom.create({
    data: clean({
      hospitalId,
      createdBy: userId,
      updatedBy: userId,
      ...input,
    }) as unknown as Prisma.OtRoomUncheckedCreateInput,
  });
}

export async function createProcedure(
  hospitalId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  return prisma.otProcedureCatalog.create({
    data: clean({
      hospitalId,
      createdBy: userId,
      updatedBy: userId,
      ...input,
    }) as unknown as Prisma.OtProcedureCatalogUncheckedCreateInput,
  });
}

export function listRooms(hospitalId: string, branchId?: string) {
  return prisma.otRoom.findMany({
    where: {
      hospitalId,
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { roomName: "asc" },
  });
}

export function listProcedures(hospitalId: string) {
  return prisma.otProcedureCatalog.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: { procedureName: "asc" },
  });
}

export async function createBooking(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    otRoomId: string;
    procedureId: string;
    priority: OtBookingPriority;
    scheduledStart: Date;
    scheduledEnd: Date;
    primarySurgeonId: string;
    ipdAdmissionId?: string | null;
    opdVisitId?: string | null;
    anaesthetistId?: string | null;
    preOperativeDiagnosis?: string | null;
    indication?: string | null;
    specialInstructions?: string | null;
  },
) {
  await checkScheduleConflict(
    hospitalId,
    input.otRoomId,
    input.primarySurgeonId,
    input.scheduledStart,
    input.scheduledEnd,
  );

  const bookingNumber = await nextBookingNumber(
    hospitalId,
    input.scheduledStart,
  );

  return prisma.otBooking.create({
    data: {
      hospitalId,
      branchId: input.branchId,
      patientId: input.patientId,
      otRoomId: input.otRoomId,
      procedureId: input.procedureId,
      bookingNumber,
      priority: input.priority ?? OtBookingPriority.ELECTIVE,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      primarySurgeonId: input.primarySurgeonId,
      status: OtBookingStatus.SCHEDULED,
      createdBy: userId,
      updatedBy: userId,
      ...(input.ipdAdmissionId !== undefined
        ? { ipdAdmissionId: input.ipdAdmissionId }
        : {}),
      ...(input.opdVisitId !== undefined
        ? { opdVisitId: input.opdVisitId }
        : {}),
      ...(input.anaesthetistId !== undefined
        ? { anaesthetistId: input.anaesthetistId }
        : {}),
      ...(input.preOperativeDiagnosis !== undefined
        ? { preOperativeDiagnosis: input.preOperativeDiagnosis }
        : {}),
      ...(input.indication !== undefined
        ? { indication: input.indication }
        : {}),
      ...(input.specialInstructions !== undefined
        ? { specialInstructions: input.specialInstructions }
        : {}),
    },
  });
}

export async function listBookings(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    roomId?: string;
    status?: OtBookingStatus;
    date?: Date;
  },
) {
  const where: Prisma.OtBookingWhereInput = {
    hospitalId,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.roomId ? { otRoomId: query.roomId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.date
      ? {
          scheduledStart: {
            gte: startOfDay(query.date),
            lte: endOfDay(query.date),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.otBooking.findMany({
      where,
      include: {
        patient: true,
        room: true,
        procedure: true,
        team: true,
        checklist: true,
        consents: true,
        anaesthesiaAssessment: true,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.otBooking.count({ where }),
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

export async function getBooking(hospitalId: string, id: string) {
  const booking = await prisma.otBooking.findFirst({
    where: {
      id,
      hospitalId,
    },
    include: {
      patient: true,
      room: true,
      procedure: true,
      team: true,
      checklist: true,
      consents: true,
      anaesthesiaAssessment: true,
      intraoperativeNotes: {
        orderBy: { recordedAt: "asc" },
      },
      consumables: true,
      implants: true,
      specimens: true,
      recoveryRecords: {
        orderBy: { recordedAt: "asc" },
      },
      complications: {
        orderBy: { occurredAt: "asc" },
      },
    },
  });

  if (!booking) {
    throw new AppError(
      "OT booking was not found",
      404,
      "OT_BOOKING_NOT_FOUND",
    );
  }

  return booking;
}

export async function updateBookingStatus(
  hospitalId: string,
  bookingId: string,
  userId: string,
  status: OtBookingStatus,
  input: {
    postOperativeDiagnosis?: string | null;
    estimatedBloodLossMl?: number | null;
  },
) {
  const booking = await requireBooking(hospitalId, bookingId);
  const now = new Date();

  return prisma.otBooking.update({
    where: { id: booking.id },
    data: {
      status,
      updatedBy: userId,
      ...(status === OtBookingStatus.IN_PROGRESS
        ? { actualStart: now }
        : {}),
      ...(status === OtBookingStatus.COMPLETED
        ? { actualEnd: now }
        : {}),
      ...(input.postOperativeDiagnosis !== undefined
        ? {
            postOperativeDiagnosis:
              input.postOperativeDiagnosis,
          }
        : {}),
      ...(input.estimatedBloodLossMl !== undefined
        ? {
            estimatedBloodLossMl:
              input.estimatedBloodLossMl,
          }
        : {}),
    },
  });
}

export async function rescheduleBooking(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: {
    scheduledStart: Date;
    scheduledEnd: Date;
    otRoomId?: string;
  },
) {
  const booking = await requireBooking(hospitalId, bookingId);
  const roomId = input.otRoomId ?? booking.otRoomId;

  await checkScheduleConflict(
    hospitalId,
    roomId,
    booking.primarySurgeonId,
    input.scheduledStart,
    input.scheduledEnd,
    booking.id,
  );

  return prisma.otBooking.update({
    where: { id: booking.id },
    data: {
      otRoomId: roomId,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      status: OtBookingStatus.SCHEDULED,
      updatedBy: userId,
    },
  });
}

export async function cancelBooking(
  hospitalId: string,
  bookingId: string,
  userId: string,
  reason: string,
) {
  const booking = await requireBooking(hospitalId, bookingId);

  return prisma.otBooking.update({
    where: { id: booking.id },
    data: {
      status: OtBookingStatus.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: userId,
      updatedBy: userId,
    },
  });
}

export async function addTeamMember(
  hospitalId: string,
  bookingId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  return prisma.otBookingTeam.create({
    data: clean({
      hospitalId,
      bookingId,
      ...input,
    }) as unknown as Prisma.OtBookingTeamUncheckedCreateInput,
  });
}

export async function addChecklistItem(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  const status = input.status as OtChecklistStatus | undefined;

  return prisma.otChecklistItem.create({
    data: clean({
      hospitalId,
      bookingId,
      ...input,
      ...(status === OtChecklistStatus.COMPLETED
        ? {
            completedAt: new Date(),
            completedBy: userId,
          }
        : {}),
    }) as unknown as Prisma.OtChecklistItemUncheckedCreateInput,
  });
}

export async function addConsent(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  const consented = input.consented === true;

  return prisma.otConsent.create({
    data: clean({
      hospitalId,
      bookingId,
      createdBy: userId,
      ...input,
      ...(consented ? { consentedAt: new Date() } : {}),
    }) as unknown as Prisma.OtConsentUncheckedCreateInput,
  });
}

export async function saveAnaesthesiaAssessment(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  const data = clean({
    hospitalId,
    bookingId,
    assessedBy: userId,
    ...input,
  }) as unknown as Prisma.OtAnaesthesiaAssessmentUncheckedCreateInput;

  return prisma.otAnaesthesiaAssessment.upsert({
    where: { bookingId },
    create: data,
    update: clean({
      ...input,
      assessedBy: userId,
      assessedAt: new Date(),
    }) as Prisma.OtAnaesthesiaAssessmentUncheckedUpdateInput,
  });
}

export async function addIntraoperativeNote(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  return prisma.otIntraoperativeNote.create({
    data: clean({
      hospitalId,
      bookingId,
      recordedBy: userId,
      ...input,
    }) as unknown as Prisma.OtIntraoperativeNoteUncheckedCreateInput,
  });
}

export async function addConsumable(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  return prisma.otConsumable.create({
    data: clean({
      hospitalId,
      bookingId,
      createdBy: userId,
      ...input,
    }) as unknown as Prisma.OtConsumableUncheckedCreateInput,
  });
}

export async function addImplant(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  return prisma.otImplant.create({
    data: clean({
      hospitalId,
      bookingId,
      createdBy: userId,
      ...input,
    }) as unknown as Prisma.OtImplantUncheckedCreateInput,
  });
}

export async function addSpecimen(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);
  const specimenNumber = await nextSpecimenNumber(
    hospitalId,
    new Date(),
  );

  return prisma.otSpecimen.create({
    data: clean({
      hospitalId,
      bookingId,
      specimenNumber,
      collectedBy: userId,
      ...input,
    }) as unknown as Prisma.OtSpecimenUncheckedCreateInput,
  });
}

export async function addRecoveryRecord(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  const booking = await requireBooking(hospitalId, bookingId);

  return prisma.$transaction(async (transaction) => {
    const record = await transaction.otRecoveryRecord.create({
      data: clean({
        hospitalId,
        bookingId,
        recordedBy: userId,
        ...input,
      }) as unknown as Prisma.OtRecoveryRecordUncheckedCreateInput,
    });

    const recoveryStatus =
      input.status as OtRecoveryStatus | undefined;

    if (
      recoveryStatus === OtRecoveryStatus.STABLE ||
      recoveryStatus === OtRecoveryStatus.TRANSFERRED
    ) {
      await transaction.otBooking.update({
        where: { id: booking.id },
        data: {
          status:
            recoveryStatus === OtRecoveryStatus.TRANSFERRED
              ? OtBookingStatus.COMPLETED
              : OtBookingStatus.RECOVERY,
          updatedBy: userId,
        },
      });
    }

    return record;
  });
}

export async function addComplication(
  hospitalId: string,
  bookingId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireBooking(hospitalId, bookingId);

  return prisma.otComplication.create({
    data: clean({
      hospitalId,
      bookingId,
      reportedBy: userId,
      ...input,
    }) as unknown as Prisma.OtComplicationUncheckedCreateInput,
  });
}

export async function dashboard(
  hospitalId: string,
  date: Date,
) {
  const grouped = await prisma.otBooking.groupBy({
    by: ["status"],
    where: {
      hospitalId,
      scheduledStart: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    _count: {
      _all: true,
    },
  });

  const counts = Object.fromEntries(
    grouped.map((item) => [
      item.status,
      item._count._all,
    ]),
  );

  return {
    date: startOfDay(date).toISOString().slice(0, 10),
    totalBookings: grouped.reduce(
      (sum, item) => sum + item._count._all,
      0,
    ),
    requested: counts.REQUESTED ?? 0,
    scheduled: counts.SCHEDULED ?? 0,
    preOpReady: counts.PRE_OP_READY ?? 0,
    inProgress: counts.IN_PROGRESS ?? 0,
    recovery: counts.RECOVERY ?? 0,
    completed: counts.COMPLETED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
  };
}
