import {
  AppointmentStatus,
  ConsultationStatus,
  OpdVisitStatus,
  OpdVisitType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

async function requireVisit(hospitalId: string, id: string) {
  const visit = await prisma.opdVisit.findFirst({
    where: { id, hospitalId, deletedAt: null },
  });

  if (!visit) {
    throw new AppError(
      "OPD visit was not found",
      404,
      "OPD_VISIT_NOT_FOUND",
    );
  }

  return visit;
}

async function nextVisitNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  const prefix = `OPD-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.opdVisit.count({
    where: {
      hospitalId,
      visitNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createVisit(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    departmentId: string;
    doctorId: string;
    patientId: string;
    appointmentId?: string | null;
    visitDate: Date;
    visitType: OpdVisitType;
    chiefComplaint?: string | null;
    notes?: string | null;
  },
) {
  const visitNumber = await nextVisitNumber(
    hospitalId,
    input.visitDate,
  );

  const data: Prisma.OpdVisitUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId,
    departmentId: input.departmentId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    visitNumber,
    visitDate: input.visitDate,
    visitType: input.visitType,
    status: OpdVisitStatus.REGISTERED,
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.appointmentId !== undefined) {
    data.appointmentId = input.appointmentId;
  }

  if (input.chiefComplaint !== undefined) {
    data.chiefComplaint = input.chiefComplaint;
  }

  if (input.notes !== undefined) {
    data.notes = input.notes;
  }

  return prisma.opdVisit.create({ data });
}

export async function listVisits(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    doctorId?: string;
    status?: OpdVisitStatus;
  },
) {
  const where: Prisma.OpdVisitWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.patientId
      ? { patientId: query.patientId }
      : {}),
    ...(query.doctorId
      ? { doctorId: query.doctorId }
      : {}),
    ...(query.status
      ? { status: query.status }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.opdVisit.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: {
            employee: true,
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        visitDate: "desc",
      },
    }),
    prisma.opdVisit.count({ where }),
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

export async function getVisit(
  hospitalId: string,
  id: string,
) {
  const visit = await prisma.opdVisit.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          employee: true,
        },
      },
      department: true,
      branch: true,
      appointment: true,
      vitals: {
        orderBy: {
          recordedAt: "desc",
        },
      },
      consultation: true,
      diagnoses: true,
      prescription: {
        include: {
          items: true,
        },
      },
      orders: true,
      followUps: true,
    },
  });

  if (!visit) {
    throw new AppError(
      "OPD visit was not found",
      404,
      "OPD_VISIT_NOT_FOUND",
    );
  }

  return visit;
}

export async function addVitals(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireVisit(hospitalId, visitId);

  const height =
    typeof input.heightCm === "number"
      ? input.heightCm
      : null;

  const weight =
    typeof input.weightKg === "number"
      ? input.weightKg
      : null;

  return prisma.opdVitalSign.create({
    data: clean({
      hospitalId,
      visitId,
      recordedBy: userId,
      ...input,
      ...(height && weight
        ? {
            bmi: Number(
              (
                weight /
                ((height / 100) ** 2)
              ).toFixed(2),
            ),
          }
        : {}),
    }) as unknown as Prisma.OpdVitalSignUncheckedCreateInput,
  });
}

export async function saveConsultation(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireVisit(hospitalId, visitId);

  const status =
    input.status as ConsultationStatus | undefined;

  const now = new Date();

  const consultation =
    await prisma.opdConsultation.upsert({
      where: {
        visitId,
      },
      create: clean({
        hospitalId,
        visitId,
        ...input,
        startedAt:
          status === ConsultationStatus.IN_PROGRESS
            ? now
            : undefined,
        completedAt:
          status === ConsultationStatus.COMPLETED
            ? now
            : undefined,
        createdBy: userId,
        updatedBy: userId,
      }) as unknown as Prisma.OpdConsultationUncheckedCreateInput,
      update: clean({
        ...input,
        completedAt:
          status === ConsultationStatus.COMPLETED
            ? now
            : undefined,
        updatedBy: userId,
      }) as Prisma.OpdConsultationUncheckedUpdateInput,
    });

  await prisma.opdVisit.update({
    where: {
      id: visitId,
    },
    data: {
      status:
        status === ConsultationStatus.COMPLETED
          ? OpdVisitStatus.COMPLETED
          : OpdVisitStatus.IN_CONSULTATION,
      ...(status === ConsultationStatus.COMPLETED
        ? { completedAt: now }
        : {}),
      updatedBy: userId,
    },
  });

  return consultation;
}

export async function addDiagnosis(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireVisit(hospitalId, visitId);

  return prisma.opdDiagnosis.create({
    data: clean({
      hospitalId,
      visitId,
      createdBy: userId,
      ...input,
    }) as unknown as Prisma.OpdDiagnosisUncheckedCreateInput,
  });
}

export async function createPrescription(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: {
    notes?: string | null;
    items: Array<{
      medicineName: string;
      dosage?: string | null;
      frequency?: string | null;
      durationDays?: number | null;
      instructions?: string | null;
    }>;
  },
) {
  await requireVisit(hospitalId, visitId);

  const itemData: Prisma.OpdPrescriptionItemCreateWithoutPrescriptionInput[] =
    input.items.map((item) => {
      const data: Prisma.OpdPrescriptionItemCreateWithoutPrescriptionInput = {
        hospitalId,
        medicineName: item.medicineName,
        createdBy: userId,
      };

      if (item.dosage !== undefined) {
        data.dosage = item.dosage;
      }

      if (item.frequency !== undefined) {
        data.frequency = item.frequency;
      }

      if (item.durationDays !== undefined) {
        data.durationDays = item.durationDays;
      }

      if (item.instructions !== undefined) {
        data.instructions = item.instructions;
      }

      return data;
    });

  return prisma.opdPrescription.create({
    data: {
      hospitalId,
      visitId,
      createdBy: userId,
      updatedBy: userId,
      ...(input.notes !== undefined
        ? { notes: input.notes }
        : {}),
      items: {
        create: itemData,
      },
    },
    include: {
      items: true,
    },
  });
}

export async function addOrder(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireVisit(hospitalId, visitId);

  return prisma.opdClinicalOrder.create({
    data: clean({
      hospitalId,
      visitId,
      orderedBy: userId,
      ...input,
    }) as unknown as Prisma.OpdClinicalOrderUncheckedCreateInput,
  });
}

export async function addFollowUp(
  hospitalId: string,
  visitId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireVisit(hospitalId, visitId);

  return prisma.opdFollowUp.create({
    data: clean({
      hospitalId,
      visitId,
      createdBy: userId,
      ...input,
    }) as unknown as Prisma.OpdFollowUpUncheckedCreateInput,
  });
}

export async function completeVisit(
  hospitalId: string,
  visitId: string,
  userId: string,
) {
  const visit = await requireVisit(
    hospitalId,
    visitId,
  );

  const completedAt = new Date();

  return prisma.$transaction(async (transaction) => {
    const result = await transaction.opdVisit.update({
      where: {
        id: visitId,
      },
      data: {
        status: OpdVisitStatus.COMPLETED,
        completedAt,
        updatedBy: userId,
      },
    });

    if (visit.appointmentId) {
      await transaction.appointment.update({
        where: {
          id: visit.appointmentId,
        },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt,
          updatedBy: userId,
        },
      });
    }

    return result;
  });
}