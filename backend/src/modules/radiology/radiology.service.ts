import {
  RadiologyModality,
  RadiologyOrderPriority,
  RadiologyOrderStatus,
  RadiologyReportStatus,
  RadiologyStudyStatus,
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

async function nextOrderNumber(hospitalId: string, date: Date) {
  const prefix = `RAD-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.radiologyOrder.count({
    where: {
      hospitalId,
      orderNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function requireOrder(hospitalId: string, id: string) {
  const order = await prisma.radiologyOrder.findFirst({
    where: {
      id,
      hospitalId,
    },
  });

  if (!order) {
    throw new AppError(
      "Radiology order was not found",
      404,
      "RADIOLOGY_ORDER_NOT_FOUND",
    );
  }

  return order;
}

async function requireStudy(hospitalId: string, id: string) {
  const study = await prisma.radiologyStudy.findFirst({
    where: {
      id,
      hospitalId,
    },
  });

  if (!study) {
    throw new AppError(
      "Radiology study was not found",
      404,
      "RADIOLOGY_STUDY_NOT_FOUND",
    );
  }

  return study;
}

export async function createProcedure(
  hospitalId: string,
  userId: string,
  input: {
    procedureCode: string;
    procedureName: string;
    modality: RadiologyModality;
    bodyPart?: string | null;
    laterality?: string | null;
    requiresContrast: boolean;
    requiresPreparation: boolean;
    preparationInstructions?: string | null;
    estimatedMinutes?: number | null;
    price?: number | null;
    reportTemplate?: string | null;
  },
) {
  return prisma.radiologyProcedureCatalog.create({
    data: {
      hospitalId,
      procedureCode: input.procedureCode,
      procedureName: input.procedureName,
      modality: input.modality,
      requiresContrast: input.requiresContrast,
      requiresPreparation: input.requiresPreparation,
      createdBy: userId,
      updatedBy: userId,
      ...(input.bodyPart !== undefined ? { bodyPart: input.bodyPart } : {}),
      ...(input.laterality !== undefined ? { laterality: input.laterality } : {}),
      ...(input.preparationInstructions !== undefined
        ? { preparationInstructions: input.preparationInstructions }
        : {}),
      ...(input.estimatedMinutes !== undefined
        ? { estimatedMinutes: input.estimatedMinutes }
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.reportTemplate !== undefined
        ? { reportTemplate: input.reportTemplate }
        : {}),
    },
  });
}

export function listProcedures(hospitalId: string) {
  return prisma.radiologyProcedureCatalog.findMany({
    where: {
      hospitalId,
      deletedAt: null,
    },
    orderBy: [
      { modality: "asc" },
      { procedureName: "asc" },
    ],
  });
}

export async function createOrder(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    priority: RadiologyOrderPriority;
    requestedProcedureIds: string[];
    departmentId?: string | null;
    doctorId?: string | null;
    opdVisitId?: string | null;
    ipdAdmissionId?: string | null;
    clinicalNotes?: string | null;
    provisionalDiagnosis?: string | null;
  },
) {
  const procedures = await prisma.radiologyProcedureCatalog.findMany({
    where: {
      hospitalId,
      id: { in: input.requestedProcedureIds },
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  if (procedures.length !== input.requestedProcedureIds.length) {
    throw new AppError(
      "One or more radiology procedures were not found",
      404,
      "RADIOLOGY_PROCEDURE_NOT_FOUND",
    );
  }

  const orderNumber = await nextOrderNumber(hospitalId, new Date());

  return prisma.$transaction(async (transaction) => {
    const order = await transaction.radiologyOrder.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        patientId: input.patientId,
        orderNumber,
        priority: input.priority,
        status: RadiologyOrderStatus.ORDERED,
        requestedBy: userId,
        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),
        ...(input.doctorId !== undefined
          ? { doctorId: input.doctorId }
          : {}),
        ...(input.opdVisitId !== undefined
          ? { opdVisitId: input.opdVisitId }
          : {}),
        ...(input.ipdAdmissionId !== undefined
          ? { ipdAdmissionId: input.ipdAdmissionId }
          : {}),
        ...(input.clinicalNotes !== undefined
          ? { clinicalNotes: input.clinicalNotes }
          : {}),
        ...(input.provisionalDiagnosis !== undefined
          ? { provisionalDiagnosis: input.provisionalDiagnosis }
          : {}),
        items: {
          create: procedures.map((procedure) => ({
            hospitalId,
            procedureId: procedure.id,
            status: RadiologyOrderStatus.ORDERED,
            ...(procedure.price !== null
              ? { price: procedure.price }
              : {}),
          })),
        },
      },
      include: {
        items: {
          include: {
            procedure: true,
          },
        },
      },
    });

    for (const item of order.items) {
      await transaction.radiologyStudy.create({
        data: {
          hospitalId,
          orderId: order.id,
          orderItemId: item.id,
          accessionNumber: `${order.orderNumber}-${item.procedure.procedureCode}`,
          modality: item.procedure.modality,
          status: RadiologyStudyStatus.PENDING,
          ...(item.procedure.preparationInstructions !== null
            ? {
                patientPreparation:
                  item.procedure.preparationInstructions,
              }
            : {}),
        },
      });
    }

    return order;
  });
}

export async function listOrders(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    doctorId?: string;
    status?: RadiologyOrderStatus;
    priority?: RadiologyOrderPriority;
  },
) {
  const where: Prisma.RadiologyOrderWhereInput = {
    hospitalId,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.doctorId ? { doctorId: query.doctorId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.radiologyOrder.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: {
            employee: true,
          },
        },
        items: {
          include: {
            procedure: true,
            study: {
              include: {
                contrasts: true,
                report: true,
                attachments: true,
              },
            },
            report: true,
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        requestedAt: "desc",
      },
    }),
    prisma.radiologyOrder.count({ where }),
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

export async function getOrder(hospitalId: string, id: string) {
  await requireOrder(hospitalId, id);

  return prisma.radiologyOrder.findUnique({
    where: { id },
    include: {
      patient: true,
      branch: true,
      department: true,
      doctor: {
        include: {
          employee: true,
        },
      },
      items: {
        include: {
          procedure: true,
          study: {
            include: {
              contrasts: true,
              report: true,
              attachments: true,
            },
          },
          report: true,
        },
      },
    },
  });
}

export async function scheduleStudy(
  hospitalId: string,
  studyId: string,
  userId: string,
  input: {
    scheduledAt: Date;
    technicianId?: string | null;
    radiologistId?: string | null;
    patientPreparation?: string | null;
    pregnancyStatus?: string | null;
    creatinineValue?: number | null;
    workstationName?: string | null;
  },
) {
  const study = await requireStudy(hospitalId, studyId);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.radiologyStudy.update({
      where: { id: study.id },
      data: {
        status: RadiologyStudyStatus.SCHEDULED,
        scheduledAt: input.scheduledAt,
        ...(input.technicianId !== undefined
          ? { technicianId: input.technicianId }
          : {}),
        ...(input.radiologistId !== undefined
          ? { radiologistId: input.radiologistId }
          : {}),
        ...(input.patientPreparation !== undefined
          ? { patientPreparation: input.patientPreparation }
          : {}),
        ...(input.pregnancyStatus !== undefined
          ? { pregnancyStatus: input.pregnancyStatus }
          : {}),
        ...(input.creatinineValue !== undefined
          ? { creatinineValue: input.creatinineValue }
          : {}),
        ...(input.workstationName !== undefined
          ? { workstationName: input.workstationName }
          : {}),
      },
    });

    await transaction.radiologyOrderItem.update({
      where: { id: study.orderItemId },
      data: {
        status: RadiologyOrderStatus.SCHEDULED,
        scheduledAt: input.scheduledAt,
      },
    });

    await transaction.radiologyOrder.update({
      where: { id: study.orderId },
      data: {
        status: RadiologyOrderStatus.SCHEDULED,
        scheduledAt: input.scheduledAt,
      },
    });

    return updated;
  });
}

export async function updateStudyStatus(
  hospitalId: string,
  studyId: string,
  status: RadiologyStudyStatus,
  input: {
    notes?: string | null;
    pacsStudyUid?: string | null;
    dicomStudyUid?: string | null;
  },
) {
  const study = await requireStudy(hospitalId, studyId);
  const now = new Date();

  const orderStatus =
    status === RadiologyStudyStatus.IN_PROGRESS
      ? RadiologyOrderStatus.IN_PROGRESS
      : status === RadiologyStudyStatus.COMPLETED
        ? RadiologyOrderStatus.COMPLETED
        : status === RadiologyStudyStatus.CANCELLED
          ? RadiologyOrderStatus.CANCELLED
          : RadiologyOrderStatus.SCHEDULED;

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.radiologyStudy.update({
      where: { id: study.id },
      data: {
        status,
        ...(status === RadiologyStudyStatus.PATIENT_READY
          ? { checkInAt: now }
          : {}),
        ...(status === RadiologyStudyStatus.IN_PROGRESS
          ? { startedAt: now }
          : {}),
        ...(status === RadiologyStudyStatus.COMPLETED
          ? { completedAt: now }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.pacsStudyUid !== undefined
          ? { pacsStudyUid: input.pacsStudyUid }
          : {}),
        ...(input.dicomStudyUid !== undefined
          ? { dicomStudyUid: input.dicomStudyUid }
          : {}),
      },
    });

    await transaction.radiologyOrderItem.update({
      where: { id: study.orderItemId },
      data: {
        status: orderStatus,
      },
    });

    await transaction.radiologyOrder.update({
      where: { id: study.orderId },
      data: {
        status: orderStatus,
      },
    });

    return updated;
  });
}

export async function addContrast(
  hospitalId: string,
  studyId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireStudy(hospitalId, studyId);

  return prisma.radiologyContrastAdministration.create({
    data: clean({
      hospitalId,
      studyId,
      administeredBy: userId,
      ...input,
    }) as unknown as Prisma.RadiologyContrastAdministrationUncheckedCreateInput,
  });
}

export async function saveReport(
  hospitalId: string,
  studyId: string,
  userId: string,
  input: {
    status: RadiologyReportStatus;
    clinicalHistory?: string | null;
    technique?: string | null;
    findings?: string | null;
    impression?: string | null;
    recommendations?: string | null;
    comparisonStudy?: string | null;
    amendmentReason?: string | null;
  },
) {
  const study = await requireStudy(hospitalId, studyId);
  const now = new Date();

  const createData: Prisma.RadiologyReportUncheckedCreateInput = {
    hospitalId,
    orderId: study.orderId,
    orderItemId: study.orderItemId,
    studyId: study.id,
    status: input.status,
    reportedAt: now,
    reportedBy: userId,
  };

  if (input.clinicalHistory !== undefined) {
    createData.clinicalHistory = input.clinicalHistory;
  }
  if (input.technique !== undefined) {
    createData.technique = input.technique;
  }
  if (input.findings !== undefined) {
    createData.findings = input.findings;
  }
  if (input.impression !== undefined) {
    createData.impression = input.impression;
  }
  if (input.recommendations !== undefined) {
    createData.recommendations = input.recommendations;
  }
  if (input.comparisonStudy !== undefined) {
    createData.comparisonStudy = input.comparisonStudy;
  }
  if (input.amendmentReason !== undefined) {
    createData.amendmentReason = input.amendmentReason;
  }

  return prisma.radiologyReport.upsert({
    where: {
      studyId: study.id,
    },
    create: createData,
    update: {
      status: input.status,
      reportedAt: now,
      reportedBy: userId,
      ...(input.clinicalHistory !== undefined
        ? { clinicalHistory: input.clinicalHistory }
        : {}),
      ...(input.technique !== undefined
        ? { technique: input.technique }
        : {}),
      ...(input.findings !== undefined
        ? { findings: input.findings }
        : {}),
      ...(input.impression !== undefined
        ? { impression: input.impression }
        : {}),
      ...(input.recommendations !== undefined
        ? { recommendations: input.recommendations }
        : {}),
      ...(input.comparisonStudy !== undefined
        ? { comparisonStudy: input.comparisonStudy }
        : {}),
      ...(input.amendmentReason !== undefined
        ? { amendmentReason: input.amendmentReason }
        : {}),
    },
  });
}

export async function updateReportStatus(
  hospitalId: string,
  reportId: string,
  userId: string,
  status: RadiologyReportStatus,
  amendmentReason?: string | null,
) {
  const report = await prisma.radiologyReport.findFirst({
    where: {
      id: reportId,
      hospitalId,
    },
  });

  if (!report) {
    throw new AppError(
      "Radiology report was not found",
      404,
      "RADIOLOGY_REPORT_NOT_FOUND",
    );
  }

  const now = new Date();

  const orderStatus =
    status === RadiologyReportStatus.RELEASED
      ? RadiologyOrderStatus.REPORTED
      : RadiologyOrderStatus.COMPLETED;

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.radiologyReport.update({
      where: { id: report.id },
      data: {
        status,
        ...(status === RadiologyReportStatus.VERIFIED
          ? { verifiedAt: now, verifiedBy: userId }
          : {}),
        ...(status === RadiologyReportStatus.RELEASED
          ? { releasedAt: now, releasedBy: userId }
          : {}),
        ...(status === RadiologyReportStatus.AMENDED &&
        amendmentReason !== undefined
          ? { amendmentReason }
          : {}),
      },
    });

    await transaction.radiologyOrderItem.update({
      where: { id: report.orderItemId },
      data: {
        status: orderStatus,
      },
    });

    await transaction.radiologyOrder.update({
      where: { id: report.orderId },
      data: {
        status: orderStatus,
      },
    });

    return updated;
  });
}

export async function dashboard(
  hospitalId: string,
  date: Date,
) {
  const where = {
    hospitalId,
    requestedAt: {
      gte: startOfDay(date),
      lte: endOfDay(date),
    },
  };

  const grouped = await prisma.radiologyOrder.groupBy({
    by: ["status"],
    where,
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
    totalOrders: grouped.reduce(
      (sum, item) => sum + item._count._all,
      0,
    ),
    ordered: counts.ORDERED ?? 0,
    scheduled: counts.SCHEDULED ?? 0,
    checkedIn: counts.CHECKED_IN ?? 0,
    inProgress: counts.IN_PROGRESS ?? 0,
    completed: counts.COMPLETED ?? 0,
    reported: counts.REPORTED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
  };
}
