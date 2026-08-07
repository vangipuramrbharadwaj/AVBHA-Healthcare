import {
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
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const startsWith = `${prefix}-${datePart}`;

  let count = 0;

  if (type === "invoice") {
    count = await prisma.billingInvoice.count({
      where: { hospitalId, invoiceNumber: { startsWith } },
    });
  } else if (type === "payment") {
    count = await prisma.billingPayment.count({
      where: { hospitalId, receiptNumber: { startsWith } },
    });
  } else if (type === "refund") {
    count = await prisma.billingRefund.count({
      where: { hospitalId, refundNumber: { startsWith } },
    });
  } else {
    count = await prisma.billingAdvancePayment.count({
      where: { hospitalId, advanceNumber: { startsWith } },
    });
  }

  return `${startsWith}-${String(count + 1).padStart(4, "0")}`;
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
