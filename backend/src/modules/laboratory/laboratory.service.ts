import {
  LabOrderPriority,
  LabOrderStatus,
  LabResultStatus,
  LabSampleStatus,
  LabValueType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

async function nextOrderNumber(hospitalId: string, date: Date) {
  const prefix = `LAB-${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const count = await prisma.labOrder.count({
    where: {
      hospitalId,
      orderNumber: { startsWith: prefix },
    },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createTest(
  hospitalId: string,
  userId: string,
  input: {
    testCode: string;
    testName: string;
    sampleType: string;
    category?: string | null;
    containerType?: string | null;
    turnaroundMinutes?: number | null;
    price?: number | null;
    instructions?: string | null;
    parameters: Array<{
      parameterCode: string;
      parameterName: string;
      valueType: LabValueType;
      unit?: string | null;
      referenceRange?: string | null;
      sortOrder: number;
      required: boolean;
    }>;
  },
) {
  return prisma.labTestCatalog.create({
    data: {
      hospitalId,
      testCode: input.testCode,
      testName: input.testName,
      sampleType: input.sampleType,
      createdBy: userId,
      updatedBy: userId,
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.containerType !== undefined ? { containerType: input.containerType } : {}),
      ...(input.turnaroundMinutes !== undefined ? { turnaroundMinutes: input.turnaroundMinutes } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      parameters: {
        create: input.parameters.map((parameter) => ({
          hospitalId,
          parameterCode: parameter.parameterCode,
          parameterName: parameter.parameterName,
          valueType: parameter.valueType,
          sortOrder: parameter.sortOrder,
          required: parameter.required,
          ...(parameter.unit !== undefined ? { unit: parameter.unit } : {}),
          ...(parameter.referenceRange !== undefined ? { referenceRange: parameter.referenceRange } : {}),
        })),
      },
    },
    include: {
      parameters: true,
    },
  });
}

export function listTests(hospitalId: string) {
  return prisma.labTestCatalog.findMany({
    where: {
      hospitalId,
      deletedAt: null,
    },
    include: {
      parameters: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      testName: "asc",
    },
  });
}

export async function createOrder(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    priority: LabOrderPriority;
    testIds: string[];
    departmentId?: string | null;
    doctorId?: string | null;
    clinicalNotes?: string | null;
  },
) {
  const tests = await prisma.labTestCatalog.findMany({
    where: {
      hospitalId,
      id: { in: input.testIds },
      deletedAt: null,
    },
  });

  if (tests.length !== input.testIds.length) {
    throw new AppError(
      "One or more laboratory tests were not found",
      404,
      "LAB_TEST_NOT_FOUND",
    );
  }

  const orderNumber = await nextOrderNumber(hospitalId, new Date());

  return prisma.$transaction(async (transaction) => {
    const order = await transaction.labOrder.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        patientId: input.patientId,
        orderNumber,
        priority: input.priority,
        status: LabOrderStatus.SAMPLE_PENDING,
        orderedBy: userId,
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.doctorId !== undefined ? { doctorId: input.doctorId } : {}),
        ...(input.clinicalNotes !== undefined ? { clinicalNotes: input.clinicalNotes } : {}),
        items: {
          create: tests.map((test) => ({
            hospitalId,
            testId: test.id,
            status: LabOrderStatus.ORDERED,
            ...(test.price !== null ? { price: test.price } : {}),
          })),
        },
      },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    for (const item of order.items) {
      await transaction.labSample.create({
        data: {
          hospitalId,
          orderId: order.id,
          orderItemId: item.id,
          sampleNumber: `${order.orderNumber}-${item.test.testCode}`,
          sampleType: item.test.sampleType,
          status: LabSampleStatus.PENDING,
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
    status?: LabOrderStatus;
  },
) {
  const where: Prisma.LabOrderWhereInput = {
    hospitalId,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.labOrder.findMany({
      where,
      include: {
        patient: true,
        items: {
          include: {
            test: true,
            sample: true,
            result: {
              include: {
                values: {
                  include: {
                    parameter: true,
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
        orderedAt: "desc",
      },
    }),
    prisma.labOrder.count({ where }),
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
  const order = await prisma.labOrder.findFirst({
    where: {
      id,
      hospitalId,
    },
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
          test: {
            include: {
              parameters: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
          sample: true,
          result: {
            include: {
              values: {
                include: {
                  parameter: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(
      "Laboratory order was not found",
      404,
      "LAB_ORDER_NOT_FOUND",
    );
  }

  return order;
}

export async function collectSample(
  hospitalId: string,
  id: string,
  userId: string,
  barcode?: string | null,
) {
  const sample = await prisma.labSample.findFirst({
    where: {
      id,
      hospitalId,
      status: LabSampleStatus.PENDING,
    },
  });

  if (!sample) {
    throw new AppError(
      "Pending sample was not found",
      404,
      "LAB_SAMPLE_NOT_FOUND",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.labSample.update({
      where: { id: sample.id },
      data: {
        status: LabSampleStatus.COLLECTED,
        collectedAt: new Date(),
        collectedBy: userId,
        ...(barcode !== undefined ? { barcode } : {}),
      },
    });

    await transaction.labOrderItem.update({
      where: { id: sample.orderItemId },
      data: {
        status: LabOrderStatus.SAMPLE_COLLECTED,
      },
    });

    await transaction.labOrder.update({
      where: { id: sample.orderId },
      data: {
        status: LabOrderStatus.SAMPLE_COLLECTED,
      },
    });

    return updated;
  });
}

export async function rejectSample(
  hospitalId: string,
  id: string,
  userId: string,
  rejectionReason: string,
) {
  const sample = await prisma.labSample.findFirst({
    where: {
      id,
      hospitalId,
    },
  });

  if (!sample) {
    throw new AppError(
      "Sample was not found",
      404,
      "LAB_SAMPLE_NOT_FOUND",
    );
  }

  return prisma.labSample.update({
    where: { id: sample.id },
    data: {
      status: LabSampleStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason,
    },
  });
}

export async function enterResult(
  hospitalId: string,
  orderItemId: string,
  userId: string,
  input: {
    interpretation?: string | null;
    remarks?: string | null;
    values: Array<{
      parameterId: string;
      numericValue?: number | null;
      textValue?: string | null;
      booleanValue?: boolean | null;
      choiceValue?: string | null;
      unit?: string | null;
      referenceRange?: string | null;
      abnormalFlag?: string | null;
      critical: boolean;
      comments?: string | null;
    }>;
  },
) {
  const item = await prisma.labOrderItem.findFirst({
    where: {
      id: orderItemId,
      hospitalId,
    },
  });

  if (!item) {
    throw new AppError(
      "Laboratory order item was not found",
      404,
      "LAB_ORDER_ITEM_NOT_FOUND",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const result = await transaction.labResult.upsert({
      where: {
        orderItemId,
      },
      create: {
        hospitalId,
        orderId: item.orderId,
        orderItemId,
        status: LabResultStatus.ENTERED,
        enteredAt: new Date(),
        enteredBy: userId,
        ...(input.interpretation !== undefined ? { interpretation: input.interpretation } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
      update: {
        status: LabResultStatus.ENTERED,
        enteredAt: new Date(),
        enteredBy: userId,
        ...(input.interpretation !== undefined ? { interpretation: input.interpretation } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
    });

    await transaction.labResultValue.deleteMany({
      where: {
        resultId: result.id,
      },
    });

    await transaction.labResultValue.createMany({
      data: input.values.map((value) =>
        clean({
          hospitalId,
          resultId: result.id,
          parameterId: value.parameterId,
          numericValue: value.numericValue,
          textValue: value.textValue,
          booleanValue: value.booleanValue,
          choiceValue: value.choiceValue,
          unit: value.unit,
          referenceRange: value.referenceRange,
          abnormalFlag: value.abnormalFlag,
          critical: value.critical,
          comments: value.comments,
        }) as Prisma.LabResultValueCreateManyInput,
      ),
    });

    await transaction.labOrderItem.update({
      where: { id: item.id },
      data: {
        status: LabOrderStatus.RESULT_ENTERED,
      },
    });

    await transaction.labOrder.update({
      where: { id: item.orderId },
      data: {
        status: LabOrderStatus.RESULT_ENTERED,
      },
    });

    return transaction.labResult.findUnique({
      where: { id: result.id },
      include: {
        values: {
          include: {
            parameter: true,
          },
        },
      },
    });
  });
}

export async function updateResultStatus(
  hospitalId: string,
  id: string,
  userId: string,
  status: LabResultStatus,
  amendmentReason?: string | null,
) {
  const result = await prisma.labResult.findFirst({
    where: {
      id,
      hospitalId,
    },
  });

  if (!result) {
    throw new AppError(
      "Laboratory result was not found",
      404,
      "LAB_RESULT_NOT_FOUND",
    );
  }

  const now = new Date();

  const orderStatus =
    status === LabResultStatus.VERIFIED
      ? LabOrderStatus.VERIFIED
      : status === LabResultStatus.RELEASED
        ? LabOrderStatus.REPORTED
        : LabOrderStatus.RESULT_ENTERED;

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.labResult.update({
      where: { id: result.id },
      data: {
        status,
        ...(status === LabResultStatus.VERIFIED
          ? { verifiedAt: now, verifiedBy: userId }
          : {}),
        ...(status === LabResultStatus.RELEASED
          ? { releasedAt: now, releasedBy: userId }
          : {}),
        ...(status === LabResultStatus.AMENDED &&
        amendmentReason !== undefined
          ? { amendmentReason }
          : {}),
      },
    });

    await transaction.labOrderItem.update({
      where: { id: result.orderItemId },
      data: {
        status: orderStatus,
      },
    });

    await transaction.labOrder.update({
      where: { id: result.orderId },
      data: {
        status: orderStatus,
      },
    });

    return updated;
  });
}
