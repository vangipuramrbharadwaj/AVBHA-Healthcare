import { nextBillingAdvanceNumber, nextBillingInvoiceNumber, nextBillingReceiptNumber, nextBillingRefundNumber } from "../../shared/sequences/document-number.presets";
import {
  BillingChargeStatus,
  BillingInvoiceStatus,
  BillingLedgerEntryType,
  BillingPaymentMode,
  BillingPaymentStatus,
  BillingRefundStatus,
  Prisma,
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

async function nextNumber(
  hospitalId: string,
  prefix: string,
  type: "invoice" | "payment" | "refund" | "advance",
): Promise<string> {
  // PHASE 11.2B: billing document allocator
  switch (type) {
    case "invoice":
      return nextBillingInvoiceNumber(hospitalId);
    case "payment":
      return nextBillingReceiptNumber(hospitalId);
    case "refund":
      return nextBillingRefundNumber(hospitalId);
    case "advance":
      return nextBillingAdvanceNumber(hospitalId);
  }
}

async function currentPatientBalance(
  transaction: Prisma.TransactionClient,
  hospitalId: string,
  patientId: string,
): Promise<number> {
  const latest = await transaction.billingPatientLedger.findFirst({
    where: { hospitalId, patientId },
    orderBy: { entryAt: "desc" },
  });

  return Number(latest?.balanceAfter ?? 0);
}

async function addLedgerEntry(
  transaction: Prisma.TransactionClient,
  input: {
    hospitalId: string;
    branchId: string;
    patientId: string;
    entryType: BillingLedgerEntryType;
    referenceType: string;
    referenceId: string;
    description: string;
    debitAmount?: number;
    creditAmount?: number;
    createdBy: string;
  },
) {
  const currentBalance = await currentPatientBalance(
    transaction,
    input.hospitalId,
    input.patientId,
  );

  const debitAmount = input.debitAmount ?? 0;
  const creditAmount = input.creditAmount ?? 0;
  const balanceAfter = currentBalance + debitAmount - creditAmount;

  return transaction.billingPatientLedger.create({
    data: {
      hospitalId: input.hospitalId,
      branchId: input.branchId,
      patientId: input.patientId,
      entryType: input.entryType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
      debitAmount,
      creditAmount,
      balanceAfter,
      createdBy: input.createdBy,
    },
  });
}

export async function createService(
  hospitalId: string,
  userId: string,
  input: {
    serviceCode: string;
    serviceName: string;
    moduleCode: string;
    basePrice: number;
    discountAllowed: boolean;
    departmentId?: string | null;
    description?: string | null;
    gstPercent?: number | null;
  },
) {
  return prisma.billingServiceCatalog.create({
    data: {
      hospitalId,
      serviceCode: input.serviceCode,
      serviceName: input.serviceName,
      moduleCode: input.moduleCode,
      basePrice: input.basePrice,
      discountAllowed: input.discountAllowed,
      createdBy: userId,
      updatedBy: userId,
      ...(input.departmentId !== undefined
        ? { departmentId: input.departmentId }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.gstPercent !== undefined
        ? { gstPercent: input.gstPercent }
        : {}),
    },
  });
}

export function listServices(hospitalId: string) {
  return prisma.billingServiceCatalog.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: [
      { moduleCode: "asc" },
      { serviceName: "asc" },
    ],
  });
}

export async function createInvoice(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    discountAmount: number;
    roundOffAmount: number;
    opdVisitId?: string | null;
    ipdAdmissionId?: string | null;
    dueDate?: Date | null;
    notes?: string | null;
    items: Array<{
      serviceId?: string | null;
      sourceModule?: string | null;
      sourceEntityId?: string | null;
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number | null;
      taxPercent?: number | null;
    }>;
  },
) {
  const invoiceNumber = await nextNumber(
    hospitalId,
    "INV",
    "invoice",
  );

  let subtotal = 0;
  let taxAmount = 0;

  const calculatedItems = input.items.map((item) => {
    const base = item.quantity * item.unitPrice;
    const itemDiscount =
      item.discountPercent !== undefined &&
      item.discountPercent !== null
        ? (base * item.discountPercent) / 100
        : 0;
    const taxable = base - itemDiscount;
    const itemTax =
      item.taxPercent !== undefined &&
      item.taxPercent !== null
        ? (taxable * item.taxPercent) / 100
        : 0;

    subtotal += taxable;
    taxAmount += itemTax;

    return {
      hospitalId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: itemDiscount,
      taxAmount: itemTax,
      lineTotal: taxable + itemTax,
      ...(item.serviceId !== undefined
        ? { serviceId: item.serviceId }
        : {}),
      ...(item.sourceModule !== undefined
        ? { sourceModule: item.sourceModule }
        : {}),
      ...(item.sourceEntityId !== undefined
        ? { sourceEntityId: item.sourceEntityId }
        : {}),
      ...(item.discountPercent !== undefined
        ? { discountPercent: item.discountPercent }
        : {}),
      ...(item.taxPercent !== undefined
        ? { taxPercent: item.taxPercent }
        : {}),
    };
  });

  const totalAmount =
    subtotal +
    taxAmount -
    input.discountAmount +
    input.roundOffAmount;

  return prisma.$transaction(async (transaction) => {
    const invoice = await transaction.billingInvoice.create({
      data: {
        hospitalId,
        branchId: input.branchId,
        patientId: input.patientId,
        invoiceNumber,
        status: BillingInvoiceStatus.ISSUED,
        subtotal,
        taxAmount,
        discountAmount: input.discountAmount,
        roundOffAmount: input.roundOffAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        createdBy: userId,
        updatedBy: userId,
        ...(input.opdVisitId !== undefined
          ? { opdVisitId: input.opdVisitId }
          : {}),
        ...(input.ipdAdmissionId !== undefined
          ? { ipdAdmissionId: input.ipdAdmissionId }
          : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: true,
      },
    });

    await addLedgerEntry(transaction, {
      hospitalId,
      branchId: input.branchId,
      patientId: input.patientId,
      entryType: BillingLedgerEntryType.INVOICE,
      referenceType: "BILLING_INVOICE",
      referenceId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber}`,
      debitAmount: totalAmount,
      createdBy: userId,
    });

    return invoice;
  });
}

export async function listInvoices(
  hospitalId: string,
  query: {
    page: number;
    pageSize: number;
    patientId?: string;
    status?: BillingInvoiceStatus;
  },
) {
  const where: Prisma.BillingInvoiceWhereInput = {
    hospitalId,
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.billingInvoice.findMany({
      where,
      include: {
        patient: true,
        items: true,
        payments: true,
        refunds: true,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.billingInvoice.count({ where }),
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

export async function getInvoice(
  hospitalId: string,
  invoiceId: string,
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id: invoiceId,
      hospitalId,
    },
    include: {
      patient: true,
      branch: true,
      items: {
        include: {
          service: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
      refunds: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError(
      "Invoice was not found",
      404,
      "BILLING_INVOICE_NOT_FOUND",
    );
  }

  return invoice;
}

export async function recordPayment(
  hospitalId: string,
  invoiceId: string,
  userId: string,
  input: {
    paymentMode: BillingPaymentMode;
    amount: number;
    transactionReference?: string | null;
    remarks?: string | null;
  },
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id: invoiceId,
      hospitalId,
      status: {
        in: [
          BillingInvoiceStatus.ISSUED,
          BillingInvoiceStatus.PARTIALLY_PAID,
        ],
      },
    },
  });

  if (!invoice) {
    throw new AppError(
      "Payable invoice was not found",
      404,
      "BILLING_INVOICE_NOT_PAYABLE",
    );
  }

  const balance = Number(invoice.balanceAmount);

  if (input.amount > balance) {
    throw new AppError(
      "Payment exceeds invoice balance",
      400,
      "BILLING_PAYMENT_EXCEEDS_BALANCE",
    );
  }

  const receiptNumber = await nextNumber(
    hospitalId,
    "RCT",
    "payment",
  );

  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.billingPayment.create({
      data: {
        hospitalId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        receiptNumber,
        paymentMode: input.paymentMode,
        status: BillingPaymentStatus.COMPLETED,
        amount: input.amount,
        receivedBy: userId,
        ...(input.transactionReference !== undefined
          ? {
              transactionReference:
                input.transactionReference,
            }
          : {}),
        ...(input.remarks !== undefined
          ? { remarks: input.remarks }
          : {}),
      },
    });

    const paidAmount =
      Number(invoice.paidAmount) + input.amount;
    const balanceAmount =
      Number(invoice.totalAmount) - paidAmount;
    const status =
      balanceAmount <= 0
        ? BillingInvoiceStatus.PAID
        : BillingInvoiceStatus.PARTIALLY_PAID;

    await transaction.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        balanceAmount,
        status,
        updatedBy: userId,
      },
    });

    await addLedgerEntry(transaction, {
      hospitalId,
      branchId: invoice.branchId,
      patientId: invoice.patientId,
      entryType: BillingLedgerEntryType.PAYMENT,
      referenceType: "BILLING_PAYMENT",
      referenceId: payment.id,
      description: `Payment ${payment.receiptNumber}`,
      creditAmount: input.amount,
      createdBy: userId,
    });

    return payment;
  });
}

export async function createAdvance(
  hospitalId: string,
  userId: string,
  input: {
    branchId: string;
    patientId: string;
    paymentMode: BillingPaymentMode;
    amount: number;
    transactionReference?: string | null;
    remarks?: string | null;
  },
) {
  const advanceNumber = await nextNumber(
    hospitalId,
    "ADV",
    "advance",
  );

  return prisma.$transaction(async (transaction) => {
    const advance =
      await transaction.billingAdvancePayment.create({
        data: {
          hospitalId,
          branchId: input.branchId,
          patientId: input.patientId,
          advanceNumber,
          paymentMode: input.paymentMode,
          amount: input.amount,
          balanceAmount: input.amount,
          receivedBy: userId,
          ...(input.transactionReference !== undefined
            ? {
                transactionReference:
                  input.transactionReference,
              }
            : {}),
          ...(input.remarks !== undefined
            ? { remarks: input.remarks }
            : {}),
        },
      });

    await addLedgerEntry(transaction, {
      hospitalId,
      branchId: input.branchId,
      patientId: input.patientId,
      entryType: BillingLedgerEntryType.ADVANCE,
      referenceType: "BILLING_ADVANCE",
      referenceId: advance.id,
      description: `Advance ${advance.advanceNumber}`,
      creditAmount: input.amount,
      createdBy: userId,
    });

    return advance;
  });
}

export async function requestRefund(
  hospitalId: string,
  invoiceId: string,
  userId: string,
  input: {
    amount: number;
    reason: string;
    paymentId?: string | null;
    paymentMode?: BillingPaymentMode | null;
  },
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id: invoiceId,
      hospitalId,
    },
  });

  if (!invoice) {
    throw new AppError(
      "Invoice was not found",
      404,
      "BILLING_INVOICE_NOT_FOUND",
    );
  }

  if (input.amount > Number(invoice.paidAmount)) {
    throw new AppError(
      "Refund exceeds paid amount",
      400,
      "BILLING_REFUND_EXCEEDS_PAID",
    );
  }

  const refundNumber = await nextNumber(
    hospitalId,
    "RFN",
    "refund",
  );

  return prisma.billingRefund.create({
    data: {
      hospitalId,
      branchId: invoice.branchId,
      invoiceId: invoice.id,
      refundNumber,
      amount: input.amount,
      reason: input.reason,
      status: BillingRefundStatus.PENDING,
      createdBy: userId,
      ...(input.paymentId !== undefined
        ? { paymentId: input.paymentId }
        : {}),
      ...(input.paymentMode !== undefined
        ? { paymentMode: input.paymentMode }
        : {}),
    },
  });
}

export async function updateRefundStatus(
  hospitalId: string,
  refundId: string,
  userId: string,
  status: BillingRefundStatus,
) {
  const refund = await prisma.billingRefund.findFirst({
    where: {
      id: refundId,
      hospitalId,
    },
  });

  if (!refund) {
    throw new AppError(
      "Refund was not found",
      404,
      "BILLING_REFUND_NOT_FOUND",
    );
  }

  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.billingRefund.update({
      where: { id: refund.id },
      data: {
        status,
        ...(status === BillingRefundStatus.APPROVED
          ? {
              approvedAt: now,
              approvedBy: userId,
            }
          : {}),
        ...(status === BillingRefundStatus.COMPLETED
          ? {
              completedAt: now,
              completedBy: userId,
            }
          : {}),
      },
    });

    if (status === BillingRefundStatus.COMPLETED) {
      const invoice = await transaction.billingInvoice.findUnique({
        where: { id: refund.invoiceId },
      });

      if (!invoice) {
        throw new AppError(
          "Invoice was not found",
          404,
          "BILLING_INVOICE_NOT_FOUND",
        );
      }

      const paidAmount =
        Number(invoice.paidAmount) - Number(refund.amount);
      const balanceAmount =
        Number(invoice.totalAmount) - paidAmount;

      await transaction.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount,
          balanceAmount,
          status:
            paidAmount <= 0
              ? BillingInvoiceStatus.REFUNDED
              : BillingInvoiceStatus.PARTIALLY_PAID,
          updatedBy: userId,
        },
      });

      await addLedgerEntry(transaction, {
        hospitalId,
        branchId: invoice.branchId,
        patientId: invoice.patientId,
        entryType: BillingLedgerEntryType.REFUND,
        referenceType: "BILLING_REFUND",
        referenceId: refund.id,
        description: `Refund ${refund.refundNumber}`,
        debitAmount: Number(refund.amount),
        createdBy: userId,
      });
    }

    return updated;
  });
}

export async function cancelInvoice(
  hospitalId: string,
  invoiceId: string,
  userId: string,
  reason: string,
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id: invoiceId,
      hospitalId,
    },
  });

  if (!invoice) {
    throw new AppError(
      "Invoice was not found",
      404,
      "BILLING_INVOICE_NOT_FOUND",
    );
  }

  if (Number(invoice.paidAmount) > 0) {
    throw new AppError(
      "Paid invoice cannot be cancelled directly",
      409,
      "BILLING_PAID_INVOICE_CANNOT_CANCEL",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        status: BillingInvoiceStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
        balanceAmount: 0,
        updatedBy: userId,
      },
    });

    await addLedgerEntry(transaction, {
      hospitalId,
      branchId: invoice.branchId,
      patientId: invoice.patientId,
      entryType: BillingLedgerEntryType.ADJUSTMENT,
      referenceType: "BILLING_INVOICE_CANCELLATION",
      referenceId: invoice.id,
      description: `Cancelled invoice ${invoice.invoiceNumber}`,
      creditAmount: Number(invoice.balanceAmount),
      createdBy: userId,
    });

    return updated;
  });
}

export async function patientLedger(
  hospitalId: string,
  patientId: string,
  page: number,
  pageSize: number,
) {
  const where = {
    hospitalId,
    patientId,
  };

  const [items, total] = await Promise.all([
    prisma.billingPatientLedger.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { entryAt: "desc" },
    }),
    prisma.billingPatientLedger.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function dashboard(
  hospitalId: string,
  date: Date,
) {
  const [invoiceStats, paymentStats, refunds, outstanding] =
    await Promise.all([
      prisma.billingInvoice.aggregate({
        where: {
          hospitalId,
          invoiceDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        _count: { _all: true },
        _sum: {
          totalAmount: true,
          balanceAmount: true,
        },
      }),
      prisma.billingPayment.aggregate({
        where: {
          hospitalId,
          status: BillingPaymentStatus.COMPLETED,
          paymentDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.billingRefund.aggregate({
        where: {
          hospitalId,
          status: BillingRefundStatus.COMPLETED,
          completedAt: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.billingInvoice.aggregate({
        where: {
          hospitalId,
          status: {
            in: [
              BillingInvoiceStatus.ISSUED,
              BillingInvoiceStatus.PARTIALLY_PAID,
            ],
          },
        },
        _sum: { balanceAmount: true },
      }),
    ]);

  return {
    date: startOfDay(date).toISOString().slice(0, 10),
    invoicesCreated: invoiceStats._count._all,
    grossBilled: Number(invoiceStats._sum.totalAmount ?? 0),
    todayCollections: Number(paymentStats._sum.amount ?? 0),
    paymentCount: paymentStats._count._all,
    todayRefunds: Number(refunds._sum.amount ?? 0),
    refundCount: refunds._count._all,
    totalOutstanding: Number(
      outstanding._sum.balanceAmount ?? 0,
    ),
  };
}


function doctorName(doctor: {
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  doctorCode?: string | null;
}) {
  return [
    doctor.title,
    doctor.firstName,
    doctor.middleName,
    doctor.lastName,
  ].filter(Boolean).join(" ") || doctor.doctorCode || "Doctor";
}

async function upsertPendingCharge(input: {
  hospitalId: string;
  branchId: string;
  patientId: string;
  opdVisitId?: string | null;
  ipdAdmissionId?: string | null;
  serviceId?: string | null;
  sourceModule: string;
  sourceEntityId?: string | null;
  sourceKey: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number | null;
  discountPercent?: number | null;
  chargeDate: Date;
  userId?: string | undefined;
}) {
  if (input.quantity <= 0 || input.unitPrice <= 0) {
    return null;
  }

  const base = input.quantity * input.unitPrice;
  const discountAmount =
    input.discountPercent != null
      ? (base * input.discountPercent) / 100
      : 0;
  const taxable = base - discountAmount;
  const taxAmount =
    input.taxPercent != null
      ? (taxable * input.taxPercent) / 100
      : 0;
  const lineTotal = taxable + taxAmount;

  const existing = await prisma.billingCharge.findUnique({
    where: {
      hospitalId_sourceKey: {
        hospitalId: input.hospitalId,
        sourceKey: input.sourceKey,
      },
    },
  });

  if (existing?.status === BillingChargeStatus.INVOICED) {
    return existing;
  }

  const data = {
    branchId: input.branchId,
    patientId: input.patientId,
    sourceModule: input.sourceModule,
    sourceKey: input.sourceKey,
    description: input.description,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    discountAmount,
    taxAmount,
    lineTotal,
    chargeDate: input.chargeDate,
    status: BillingChargeStatus.PENDING,
    ...(input.userId ? { updatedBy: input.userId } : {}),
    ...(input.opdVisitId !== undefined
      ? { opdVisitId: input.opdVisitId }
      : {}),
    ...(input.ipdAdmissionId !== undefined
      ? { ipdAdmissionId: input.ipdAdmissionId }
      : {}),
    ...(input.serviceId !== undefined
      ? { serviceId: input.serviceId }
      : {}),
    ...(input.sourceEntityId !== undefined
      ? { sourceEntityId: input.sourceEntityId }
      : {}),
    ...(input.taxPercent !== undefined
      ? { taxPercent: input.taxPercent }
      : {}),
    ...(input.discountPercent !== undefined
      ? { discountPercent: input.discountPercent }
      : {}),
  };

  if (existing) {
    return prisma.billingCharge.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.billingCharge.create({
    data: {
      hospitalId: input.hospitalId,
      ...(input.userId ? { createdBy: input.userId } : {}),
      ...data,
    },
  });
}

export async function syncCharges(
  hospitalId: string,
  userId?: string,
) {
  const [
    opdVisits,
    labItems,
    radiologyItems,
    pharmacyItems,
    bedAllocations,
    otBookings,
  ] = await Promise.all([
    prisma.opdVisit.findMany({
      where: {
        hospitalId,
        deletedAt: null,
        status: { not: "CANCELLED" },
      },
      include: {
        doctor: true,
      },
    }),
    prisma.labOrderItem.findMany({
      where: {
        hospitalId,
        status: { not: "CANCELLED" },
        order: { hospitalId },
      },
      include: {
        test: true,
        order: true,
      },
    }),
    prisma.radiologyOrderItem.findMany({
      where: {
        hospitalId,
        status: { not: "CANCELLED" },
        order: { hospitalId },
      },
      include: {
        procedure: true,
        order: true,
      },
    }),
    prisma.pharmacyDispenseItem.findMany({
      where: {
        hospitalId,
        dispense: {
          hospitalId,
          status: "COMPLETED",
        },
      },
      include: {
        medicine: true,
        dispense: true,
      },
    }),
    prisma.ipdBedAllocation.findMany({
      where: {
        hospitalId,
        status: { not: "CANCELLED" },
        admission: {
          hospitalId,
          deletedAt: null,
        },
      },
      include: {
        admission: true,
        bed: {
          include: {
            room: true,
          },
        },
      },
    }),
    prisma.otBooking.findMany({
      where: {
        hospitalId,
        status: "COMPLETED",
      },
      include: {
        procedure: true,
      },
    }),
  ]);

  let createdOrUpdated = 0;

  for (const visit of opdVisits) {
    const fee =
      visit.visitType === "EMERGENCY"
        ? Number(visit.doctor.emergencyFee ?? visit.doctor.consultationFee)
        : ["FOLLOW_UP", "REVIEW"].includes(visit.visitType)
          ? Number(visit.doctor.followupFee ?? visit.doctor.consultationFee)
          : Number(visit.doctor.consultationFee);

    if (fee > 0) {
      await upsertPendingCharge({
        hospitalId,
        branchId: visit.branchId,
        patientId: visit.patientId,
        opdVisitId: visit.id,
        sourceModule: "OPD",
        sourceEntityId: visit.id,
        sourceKey: `OPD:${visit.id}:CONSULTATION`,
        description: `${doctorName(visit.doctor)} consultation`,
        quantity: 1,
        unitPrice: fee,
        chargeDate: visit.visitDate,
        userId,
      });
      createdOrUpdated += 1;
    }
  }

  for (const item of labItems) {
    const price = Number(item.price ?? item.test.price ?? 0);
    if (price <= 0) continue;

    await upsertPendingCharge({
      hospitalId,
      branchId: item.order.branchId,
      patientId: item.order.patientId,
      ipdAdmissionId: item.order.ipdAdmissionId,
      sourceModule: "LABORATORY",
      sourceEntityId: item.id,
      sourceKey: `LAB:${item.id}`,
      description: `Laboratory - ${item.test.testName}`,
      quantity: 1,
      unitPrice: price,
      chargeDate: item.order.orderedAt,
      userId,
    });
    createdOrUpdated += 1;
  }

  for (const item of radiologyItems) {
    const price = Number(item.price ?? item.procedure.price ?? 0);
    if (price <= 0) continue;

    await upsertPendingCharge({
      hospitalId,
      branchId: item.order.branchId,
      patientId: item.order.patientId,
      opdVisitId: item.order.opdVisitId,
      ipdAdmissionId: item.order.ipdAdmissionId,
      sourceModule: "RADIOLOGY",
      sourceEntityId: item.id,
      sourceKey: `RAD:${item.id}`,
      description: `Radiology - ${item.procedure.procedureName}`,
      quantity: 1,
      unitPrice: price,
      chargeDate: item.order.requestedAt,
      userId,
    });
    createdOrUpdated += 1;
  }

  for (const item of pharmacyItems) {
    const price = Number(item.unitPrice);
    const quantity = Number(item.dispensedQuantity);
    if (price <= 0 || quantity <= 0) continue;

    await upsertPendingCharge({
      hospitalId,
      branchId: item.dispense.branchId,
      patientId: item.dispense.patientId,
      opdVisitId: item.dispense.opdVisitId,
      ipdAdmissionId: item.dispense.ipdAdmissionId,
      sourceModule: "PHARMACY",
      sourceEntityId: item.id,
      sourceKey: `PHARMACY:${item.id}`,
      description: `Pharmacy - ${item.medicine.brandName || item.medicine.genericName}`,
      quantity,
      unitPrice: price,
      chargeDate: item.dispense.dispensedAt ?? item.createdAt,
      userId,
    });
    createdOrUpdated += 1;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  for (const allocation of bedAllocations) {
    const dailyCharge = Number(
      allocation.bed.dailyCharge ??
      allocation.bed.room.dailyCharge ??
      0,
    );
    if (dailyCharge <= 0) continue;

    const end =
      allocation.releasedAt ??
      allocation.admission.dischargedAt ??
      new Date();
    const elapsed = Math.max(
      millisecondsPerDay,
      end.getTime() - allocation.allocatedAt.getTime(),
    );
    const days = Math.max(1, Math.ceil(elapsed / millisecondsPerDay));

    await upsertPendingCharge({
      hospitalId,
      branchId: allocation.admission.branchId,
      patientId: allocation.admission.patientId,
      ipdAdmissionId: allocation.admissionId,
      sourceModule: "IPD_BED",
      sourceEntityId: allocation.id,
      sourceKey: `IPD_BED:${allocation.id}`,
      description: `Bed / Room - ${allocation.bed.room.roomName} / ${allocation.bed.bedName}`,
      quantity: days,
      unitPrice: dailyCharge,
      chargeDate: allocation.allocatedAt,
      userId,
    });
    createdOrUpdated += 1;
  }

  for (const booking of otBookings) {
    const charge = Number(booking.procedure.baseCharge ?? 0);
    if (charge <= 0) continue;

    await upsertPendingCharge({
      hospitalId,
      branchId: booking.branchId,
      patientId: booking.patientId,
      opdVisitId: booking.opdVisitId,
      ipdAdmissionId: booking.ipdAdmissionId,
      sourceModule: "OPERATION_THEATRE",
      sourceEntityId: booking.id,
      sourceKey: `OT:${booking.id}`,
      description: `OT - ${booking.procedure.procedureName}`,
      quantity: 1,
      unitPrice: charge,
      chargeDate: booking.actualEnd ?? booking.scheduledStart,
      userId,
    });
    createdOrUpdated += 1;
  }

  return {
    synchronized: createdOrUpdated,
    sourceCounts: {
      opd: opdVisits.length,
      laboratory: labItems.length,
      radiology: radiologyItems.length,
      pharmacy: pharmacyItems.length,
      bedAllocations: bedAllocations.length,
      operationTheatre: otBookings.length,
    },
  };
}

export async function listCharges(
  hospitalId: string,
  query: {
    status: BillingChargeStatus;
    patientId?: string;
    ipdAdmissionId?: string;
    opdVisitId?: string;
  },
) {
  return prisma.billingCharge.findMany({
    where: {
      hospitalId,
      status: query.status,
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.ipdAdmissionId
        ? { ipdAdmissionId: query.ipdAdmissionId }
        : {}),
      ...(query.opdVisitId ? { opdVisitId: query.opdVisitId } : {}),
    },
    include: {
      patient: true,
      branch: true,
      service: true,
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      },
    },
    orderBy: [
      { patientId: "asc" },
      { chargeDate: "asc" },
    ],
  });
}

export async function createInvoiceFromCharges(
  hospitalId: string,
  userId: string,
  input: {
    chargeIds: string[];
    discountAmount: number;
    roundOffAmount: number;
    notes?: string | null;
  },
) {
  const charges = await prisma.billingCharge.findMany({
    where: {
      hospitalId,
      id: { in: input.chargeIds },
      status: BillingChargeStatus.PENDING,
    },
  });

  if (charges.length !== new Set(input.chargeIds).size) {
    throw new AppError(
      "One or more selected charges are unavailable or already invoiced",
      400,
      "BILLING_CHARGE_NOT_AVAILABLE",
    );
  }

  const patientIds = new Set(charges.map((charge) => charge.patientId));
  const branchIds = new Set(charges.map((charge) => charge.branchId));

  if (patientIds.size !== 1 || branchIds.size !== 1) {
    throw new AppError(
      "Selected charges must belong to the same patient and branch",
      400,
      "BILLING_CHARGE_MIXED_CONTEXT",
    );
  }

  const patientId = charges[0]!.patientId;
  const branchId = charges[0]!.branchId;
  const invoiceNumber = await nextNumber(hospitalId, "INV", "invoice");

  const subtotal = charges.reduce(
    (total, charge) =>
      total + Number(charge.quantity) * Number(charge.unitPrice) -
      Number(charge.discountAmount),
    0,
  );
  const taxAmount = charges.reduce(
    (total, charge) => total + Number(charge.taxAmount),
    0,
  );
  const totalAmount =
    subtotal +
    taxAmount -
    input.discountAmount +
    input.roundOffAmount;

  if (totalAmount < 0) {
    throw new AppError(
      "Invoice total cannot be negative",
      400,
      "BILLING_INVALID_TOTAL",
    );
  }

  const ipdIds = Array.from(
    new Set(
      charges
        .map((charge) => charge.ipdAdmissionId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const opdIds = Array.from(
    new Set(
      charges
        .map((charge) => charge.opdVisitId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  return prisma.$transaction(async (transaction) => {
    const invoice = await transaction.billingInvoice.create({
      data: {
        hospitalId,
        branchId,
        patientId,
        invoiceNumber,
        status: BillingInvoiceStatus.ISSUED,
        subtotal,
        taxAmount,
        discountAmount: input.discountAmount,
        roundOffAmount: input.roundOffAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        createdBy: userId,
        updatedBy: userId,
        ...(ipdIds.length === 1
          ? { ipdAdmissionId: ipdIds[0] }
          : {}),
        ...(opdIds.length === 1 && ipdIds.length === 0
          ? { opdVisitId: opdIds[0] }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
        items: {
          create: charges.map((charge) => ({
            hospitalId,
            serviceId: charge.serviceId,
            sourceModule: charge.sourceModule,
            sourceEntityId: charge.sourceEntityId,
            description: charge.description,
            quantity: charge.quantity,
            unitPrice: charge.unitPrice,
            discountPercent: charge.discountPercent,
            discountAmount: charge.discountAmount,
            taxPercent: charge.taxPercent,
            taxAmount: charge.taxAmount,
            lineTotal: charge.lineTotal,
          })),
        },
      },
      include: {
        items: true,
        patient: true,
      },
    });

    await transaction.billingCharge.updateMany({
      where: {
        hospitalId,
        id: { in: input.chargeIds },
        status: BillingChargeStatus.PENDING,
      },
      data: {
        status: BillingChargeStatus.INVOICED,
        invoiceId: invoice.id,
        updatedBy: userId,
      },
    });

    await addLedgerEntry(transaction, {
      hospitalId,
      branchId,
      patientId,
      entryType: BillingLedgerEntryType.INVOICE,
      referenceType: "BILLING_INVOICE",
      referenceId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber}`,
      debitAmount: totalAmount,
      createdBy: userId,
    });

    return invoice;
  });
}

export async function listAdvances(
  hospitalId: string,
  patientId?: string,
  availableOnly = false,
) {
  const advances = await prisma.billingAdvancePayment.findMany({
    where: {
      hospitalId,
      ...(patientId ? { patientId } : {}),
      ...(availableOnly
        ? { balanceAmount: { gt: 0 } }
        : {}),
    },
    orderBy: { receivedAt: "desc" },
  });

  if (advances.length === 0) {
    return [];
  }

  const patientIds = Array.from(
    new Set(advances.map((advance) => advance.patientId)),
  );
  const branchIds = Array.from(
    new Set(advances.map((advance) => advance.branchId)),
  );

  const [patients, branches] = await Promise.all([
    prisma.patient.findMany({
      where: {
        hospitalId,
        id: { in: patientIds },
        deletedAt: null,
      },
    }),
    prisma.hospitalBranch.findMany({
      where: {
        hospitalId,
        id: { in: branchIds },
        deletedAt: null,
      },
    }),
  ]);

  const patientMap = new Map(
    patients.map((patient) => [patient.id, patient]),
  );
  const branchMap = new Map(
    branches.map((branch) => [branch.id, branch]),
  );

  return advances.map((advance) => ({
    ...advance,
    patient: patientMap.get(advance.patientId) ?? null,
    branch: branchMap.get(advance.branchId) ?? null,
  }));
}

export async function applyAdvanceToInvoice(
  hospitalId: string,
  invoiceId: string,
  userId: string,
  requestedAmount?: number,
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id: invoiceId,
      hospitalId,
      status: {
        in: [
          BillingInvoiceStatus.ISSUED,
          BillingInvoiceStatus.PARTIALLY_PAID,
        ],
      },
    },
  });

  if (!invoice) {
    throw new AppError(
      "Payable invoice was not found",
      404,
      "BILLING_INVOICE_NOT_PAYABLE",
    );
  }

  const advances = await prisma.billingAdvancePayment.findMany({
    where: {
      hospitalId,
      patientId: invoice.patientId,
      balanceAmount: { gt: 0 },
    },
    orderBy: { receivedAt: "asc" },
  });

  const available = advances.reduce(
    (sum, advance) => sum + Number(advance.balanceAmount),
    0,
  );
  const invoiceBalance = Number(invoice.balanceAmount);
  const amount = Math.min(
    requestedAmount ?? invoiceBalance,
    invoiceBalance,
    available,
  );

  if (amount <= 0) {
    throw new AppError(
      "No available advance balance for this patient",
      400,
      "BILLING_NO_ADVANCE_BALANCE",
    );
  }

  const receiptNumber = await nextNumber(
    hospitalId,
    "RCT",
    "payment",
  );

  return prisma.$transaction(async (transaction) => {
    let remaining = amount;

    for (const advance of advances) {
      if (remaining <= 0) break;

      const balance = Number(advance.balanceAmount);
      const useAmount = Math.min(balance, remaining);

      await transaction.billingAdvancePayment.update({
        where: { id: advance.id },
        data: {
          utilizedAmount:
            Number(advance.utilizedAmount) + useAmount,
          balanceAmount: balance - useAmount,
        },
      });

      remaining -= useAmount;
    }

    const payment = await transaction.billingPayment.create({
      data: {
        hospitalId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        receiptNumber,
        paymentMode: BillingPaymentMode.ADVANCE,
        status: BillingPaymentStatus.COMPLETED,
        amount,
        receivedBy: userId,
        remarks: "Applied from patient advance balance",
      },
    });

    const paidAmount = Number(invoice.paidAmount) + amount;
    const balanceAmount = Math.max(
      0,
      Number(invoice.totalAmount) - paidAmount,
    );

    await transaction.billingInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        balanceAmount,
        status:
          balanceAmount <= 0
            ? BillingInvoiceStatus.PAID
            : BillingInvoiceStatus.PARTIALLY_PAID,
        updatedBy: userId,
      },
    });

    return {
      payment,
      appliedAmount: amount,
      remainingInvoiceBalance: balanceAmount,
    };
  });
}

export async function listRefunds(
  hospitalId: string,
  status?: BillingRefundStatus,
) {
  return prisma.billingRefund.findMany({
    where: {
      hospitalId,
      ...(status ? { status } : {}),
    },
    include: {
      invoice: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
