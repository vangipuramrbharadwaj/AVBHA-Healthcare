import {
  IpdAdmissionStatus,
  IpdAdmissionType,
  IpdAllocationStatus,
  IpdBedStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

async function requireAdmission(hospitalId: string, id: string) {
  const admission = await prisma.ipdAdmission.findFirst({
    where: { id, hospitalId, deletedAt: null },
  });

  if (!admission) {
    throw new AppError(
      "IPD admission was not found",
      404,
      "IPD_ADMISSION_NOT_FOUND",
    );
  }

  return admission;
}

async function nextAdmissionNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  const prefix = `IPD-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.ipdAdmission.count({
    where: {
      hospitalId,
      admissionNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createWard(
  hospitalId: string,
  input: Record<string, unknown>,
) {
  return prisma.ipdWard.create({
    data: clean({
      hospitalId,
      ...input,
    }) as unknown as Prisma.IpdWardUncheckedCreateInput,
  });
}

export async function createRoom(
  hospitalId: string,
  input: Record<string, unknown>,
) {
  return prisma.ipdRoom.create({
    data: clean({
      hospitalId,
      ...input,
    }) as unknown as Prisma.IpdRoomUncheckedCreateInput,
  });
}

export async function createBed(
  hospitalId: string,
  input: Record<string, unknown>,
) {
  return prisma.ipdBed.create({
    data: clean({
      hospitalId,
      bedStatus: IpdBedStatus.AVAILABLE,
      ...input,
    }) as unknown as Prisma.IpdBedUncheckedCreateInput,
  });
}

export function listBeds(hospitalId: string) {
  return prisma.ipdBed.findMany({
    where: { hospitalId },
    include: {
      room: {
        include: {
          ward: true,
        },
      },
    },
    orderBy: [
      { bedStatus: "asc" },
      { bedCode: "asc" },
    ],
  });
}

export async function createAdmission(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    departmentId: string;
    doctorId: string;
    patientId: string;
    bedId?: string | null;
    admissionDate: Date;
    admissionType: IpdAdmissionType;
    admissionReason?: string | null;
    provisionalDiagnosis?: string | null;
    expectedDischargeDate?: Date | null;
    attendantName?: string | null;
    attendantPhone?: string | null;
    notes?: string | null;
  },
) {
  const admissionNumber = await nextAdmissionNumber(
    hospitalId,
    input.admissionDate,
  );

  return prisma.$transaction(async (transaction) => {
    const data: Prisma.IpdAdmissionUncheckedCreateInput = {
      hospitalId,
      branchId: input.branchId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      patientId: input.patientId,
      admissionNumber,
      admissionDate: input.admissionDate,
      admissionType: input.admissionType,
      status: IpdAdmissionStatus.ACTIVE,
      createdBy: userId,
      updatedBy: userId,
    };

    if (input.admissionReason !== undefined) {
      data.admissionReason = input.admissionReason;
    }

    if (input.provisionalDiagnosis !== undefined) {
      data.provisionalDiagnosis = input.provisionalDiagnosis;
    }

    if (input.expectedDischargeDate !== undefined) {
      data.expectedDischargeDate = input.expectedDischargeDate;
    }

    if (input.attendantName !== undefined) {
      data.attendantName = input.attendantName;
    }

    if (input.attendantPhone !== undefined) {
      data.attendantPhone = input.attendantPhone;
    }

    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    const admission = await transaction.ipdAdmission.create({
      data,
    });

    if (input.bedId) {
      const bed = await transaction.ipdBed.findFirst({
        where: {
          id: input.bedId,
          hospitalId,
          bedStatus: IpdBedStatus.AVAILABLE,
        },
      });

      if (!bed) {
        throw new AppError(
          "Selected bed is not available",
          409,
          "IPD_BED_NOT_AVAILABLE",
        );
      }

      await transaction.ipdBedAllocation.create({
        data: {
          hospitalId,
          admissionId: admission.id,
          bedId: bed.id,
          status: IpdAllocationStatus.ACTIVE,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await transaction.ipdBed.update({
        where: { id: bed.id },
        data: {
          bedStatus: IpdBedStatus.OCCUPIED,
        },
      });
    }

    return admission;
  });
}

export async function listAdmissions(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    doctorId?: string;
    status?: IpdAdmissionStatus;
  },
) {
  const where: Prisma.IpdAdmissionWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.doctorId ? { doctorId: query.doctorId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ipdAdmission.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: {
            employee: true,
          },
        },
        department: true,
        bedAllocations: {
          where: {
            status: IpdAllocationStatus.ACTIVE,
          },
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    ward: true,
                  },
                },
              },
            },
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        admissionDate: "desc",
      },
    }),
    prisma.ipdAdmission.count({ where }),
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

export async function getAdmission(
  hospitalId: string,
  id: string,
) {
  const admission = await prisma.ipdAdmission.findFirst({
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
      bedAllocations: {
        include: {
          bed: {
            include: {
              room: {
                include: {
                  ward: true,
                },
              },
            },
          },
        },
      },
      nursingNotes: {
        orderBy: {
          recordedAt: "desc",
        },
      },
      vitals: {
        orderBy: {
          recordedAt: "desc",
        },
      },
      doctorRounds: {
        orderBy: {
          roundDate: "desc",
        },
      },
      medicationOrders: {
        include: {
          administrations: true,
        },
      },
      intakeOutputs: {
        orderBy: {
          recordedAt: "desc",
        },
      },
      dischargeSummary: true,
    },
  });

  if (!admission) {
    throw new AppError(
      "IPD admission was not found",
      404,
      "IPD_ADMISSION_NOT_FOUND",
    );
  }

  return admission;
}

export async function transferBed(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: {
    bedId: string;
    transferReason?: string | null;
  },
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.$transaction(async (transaction) => {
    const bed = await transaction.ipdBed.findFirst({
      where: {
        id: input.bedId,
        hospitalId,
        bedStatus: IpdBedStatus.AVAILABLE,
      },
    });

    if (!bed) {
      throw new AppError(
        "Selected bed is not available",
        409,
        "IPD_BED_NOT_AVAILABLE",
      );
    }

    const current = await transaction.ipdBedAllocation.findFirst({
      where: {
        hospitalId,
        admissionId,
        status: IpdAllocationStatus.ACTIVE,
      },
    });

    if (current) {
      await transaction.ipdBedAllocation.update({
        where: { id: current.id },
        data: {
          status: IpdAllocationStatus.TRANSFERRED,
          releasedAt: new Date(),
          ...(input.transferReason !== undefined
            ? { transferReason: input.transferReason }
            : {}),
        },
      });

      await transaction.ipdBed.update({
        where: { id: current.bedId },
        data: {
          bedStatus: IpdBedStatus.AVAILABLE,
        },
      });
    }

    const allocation = await transaction.ipdBedAllocation.create({
      data: {
        hospitalId,
        admissionId,
        bedId: bed.id,
        status: IpdAllocationStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await transaction.ipdBed.update({
      where: { id: bed.id },
      data: {
        bedStatus: IpdBedStatus.OCCUPIED,
      },
    });

    return allocation;
  });
}

export async function addNursingNote(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.ipdNursingNote.create({
    data: clean({
      hospitalId,
      admissionId,
      recordedBy: userId,
      ...input,
    }) as unknown as Prisma.IpdNursingNoteUncheckedCreateInput,
  });
}

export async function addVitals(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.ipdVitalSign.create({
    data: clean({
      hospitalId,
      admissionId,
      recordedBy: userId,
      ...input,
    }) as unknown as Prisma.IpdVitalSignUncheckedCreateInput,
  });
}

export async function addDoctorRound(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.ipdDoctorRound.create({
    data: clean({
      hospitalId,
      admissionId,
      createdBy: userId,
      ...input,
    }) as unknown as Prisma.IpdDoctorRoundUncheckedCreateInput,
  });
}

export async function addMedicationOrder(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.ipdMedicationOrder.create({
    data: clean({
      hospitalId,
      admissionId,
      orderedBy: userId,
      ...input,
    }) as unknown as Prisma.IpdMedicationOrderUncheckedCreateInput,
  });
}

export async function addMedicationAdministration(
  hospitalId: string,
  medicationOrderId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  const order = await prisma.ipdMedicationOrder.findFirst({
    where: {
      id: medicationOrderId,
      hospitalId,
    },
  });

  if (!order) {
    throw new AppError(
      "Medication order was not found",
      404,
      "IPD_MEDICATION_ORDER_NOT_FOUND",
    );
  }

  return prisma.ipdMedicationAdministration.create({
    data: clean({
      hospitalId,
      medicationOrderId,
      administeredBy: userId,
      ...input,
    }) as unknown as Prisma.IpdMedicationAdministrationUncheckedCreateInput,
  });
}

export async function addIntakeOutput(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);

  return prisma.ipdIntakeOutput.create({
    data: clean({
      hospitalId,
      admissionId,
      recordedBy: userId,
      ...input,
    }) as unknown as Prisma.IpdIntakeOutputUncheckedCreateInput,
  });
}

export async function dischargePatient(
  hospitalId: string,
  admissionId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requireAdmission(hospitalId, admissionId);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const summary = await transaction.ipdDischargeSummary.upsert({
      where: {
        admissionId,
      },
      create: clean({
        hospitalId,
        admissionId,
        preparedBy: userId,
        ...input,
      }) as unknown as Prisma.IpdDischargeSummaryUncheckedCreateInput,
      update: clean({
        ...input,
        preparedBy: userId,
        preparedAt: now,
      }) as Prisma.IpdDischargeSummaryUncheckedUpdateInput,
    });

    const current = await transaction.ipdBedAllocation.findFirst({
      where: {
        hospitalId,
        admissionId,
        status: IpdAllocationStatus.ACTIVE,
      },
    });

    if (current) {
      await transaction.ipdBedAllocation.update({
        where: { id: current.id },
        data: {
          status: IpdAllocationStatus.RELEASED,
          releasedAt: now,
        },
      });

      await transaction.ipdBed.update({
        where: { id: current.bedId },
        data: {
          bedStatus: IpdBedStatus.AVAILABLE,
        },
      });
    }

    await transaction.ipdAdmission.update({
      where: {
        id: admissionId,
      },
      data: {
        status: IpdAdmissionStatus.DISCHARGED,
        dischargedAt: now,
        updatedBy: userId,
      },
    });

    return summary;
  });
}
