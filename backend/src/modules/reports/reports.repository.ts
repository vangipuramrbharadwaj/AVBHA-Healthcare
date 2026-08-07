import {
  AppointmentStatus,
  BillingInvoiceStatus,
  BillingPaymentStatus,
  IpdAdmissionStatus,
  InventoryPurchaseStatus,
  InventoryRequestStatus,
  LabOrderStatus,
  PharmacySaleStatus,
  RadiologyOrderStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";

export function branchExists(hospitalId: string, branchId: string) {
  return prisma.hospitalBranch.count({
    where: {
      id: branchId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function departmentExists(hospitalId: string, departmentId: string) {
  return prisma.department.count({
    where: {
      id: departmentId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function doctorExists(hospitalId: string, doctorId: string) {
  return prisma.doctor.count({
    where: {
      id: doctorId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export async function overview(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const branchFilter = branchId ? { branchId } : {};

  const [
    newPatients,
    appointments,
    opdVisits,
    ipdAdmissions,
    labOrders,
    radiologyOrders,
    pharmacySales,
    invoices,
    payments,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        hospitalId,
        deletedAt: null,
        createdAt: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.appointment.count({
      where: {
        hospitalId,
        deletedAt: null,
        appointmentDate: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.opdVisit.count({
      where: {
        hospitalId,
        deletedAt: null,
        visitDate: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.ipdAdmission.count({
      where: {
        hospitalId,
        deletedAt: null,
        admissionDate: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.labOrder.count({
      where: {
        hospitalId,
        orderedAt: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.radiologyOrder.count({
      where: {
        hospitalId,
        requestedAt: { gte: from, lte: to },
        ...branchFilter,
      },
    }),
    prisma.pharmacySale.aggregate({
      where: {
        hospitalId,
        saleDate: { gte: from, lte: to },
        status: { not: PharmacySaleStatus.CANCELLED },
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { totalAmount: true, amountPaid: true },
    }),
    prisma.billingInvoice.aggregate({
      where: {
        hospitalId,
        invoiceDate: { gte: from, lte: to },
        status: { not: BillingInvoiceStatus.CANCELLED },
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
    }),
    prisma.billingPayment.aggregate({
      where: {
        hospitalId,
        paymentDate: { gte: from, lte: to },
        status: BillingPaymentStatus.COMPLETED,
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    newPatients,
    appointments,
    opdVisits,
    ipdAdmissions,
    labOrders,
    radiologyOrders,
    pharmacy: {
      sales: pharmacySales._count.id,
      grossSales: Number(pharmacySales._sum.totalAmount ?? 0),
      collected: Number(pharmacySales._sum.amountPaid ?? 0),
    },
    billing: {
      invoices: invoices._count.id,
      billed: Number(invoices._sum.totalAmount ?? 0),
      paidAgainstInvoices: Number(invoices._sum.paidAmount ?? 0),
      outstanding: Number(invoices._sum.balanceAmount ?? 0),
      receipts: payments._count.id,
      collections: Number(payments._sum.amount ?? 0),
    },
  };
}

export async function patientRegistration(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const where: Prisma.PatientWhereInput = {
    hospitalId,
    deletedAt: null,
    createdAt: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [total, byGender, byBranch] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.groupBy({
      by: ["gender"],
      where,
      _count: { _all: true },
    }),
    prisma.patient.groupBy({
      by: ["branchId"],
      where,
      _count: { _all: true },
    }),
  ]);

  return { total, byGender, byBranch };
}

export async function appointmentReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
  departmentId?: string,
  doctorId?: string,
) {
  const where: Prisma.AppointmentWhereInput = {
    hospitalId,
    deletedAt: null,
    appointmentDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(doctorId ? { doctorId } : {}),
  };

  const [total, byStatus, byVisitType, byDoctor] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["visitType"],
      where,
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where,
      _count: { _all: true },
    }),
  ]);

  const completed = byStatus.find(
    (item) => item.status === AppointmentStatus.COMPLETED,
  )?._count._all ?? 0;
  const cancelled = byStatus.find(
    (item) => item.status === AppointmentStatus.CANCELLED,
  )?._count._all ?? 0;

  return {
    total,
    completed,
    cancelled,
    completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0,
    cancellationRate: total > 0 ? Number(((cancelled / total) * 100).toFixed(2)) : 0,
    byStatus,
    byVisitType,
    byDoctor,
  };
}

export async function opdReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
  departmentId?: string,
  doctorId?: string,
) {
  const where: Prisma.OpdVisitWhereInput = {
    hospitalId,
    deletedAt: null,
    visitDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(doctorId ? { doctorId } : {}),
  };

  const [total, byStatus, byVisitType, byDoctor] = await Promise.all([
    prisma.opdVisit.count({ where }),
    prisma.opdVisit.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.opdVisit.groupBy({ by: ["visitType"], where, _count: { _all: true } }),
    prisma.opdVisit.groupBy({
      by: ["doctorId"],
      where,
      _count: { _all: true },
    }),
  ]);

  return { total, byStatus, byVisitType, byDoctor };
}

export async function ipdReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
  departmentId?: string,
  doctorId?: string,
) {
  const where: Prisma.IpdAdmissionWhereInput = {
    hospitalId,
    deletedAt: null,
    admissionDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(doctorId ? { doctorId } : {}),
  };

  const [totalAdmissions, byStatus, activeNow, discharged] = await Promise.all([
    prisma.ipdAdmission.count({ where }),
    prisma.ipdAdmission.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.ipdAdmission.count({
      where: {
        hospitalId,
        deletedAt: null,
        status: IpdAdmissionStatus.ACTIVE,
        ...(branchId ? { branchId } : {}),
      },
    }),
    prisma.ipdAdmission.findMany({
      where: {
        ...where,
        dischargedAt: { not: null },
      },
      select: { admissionDate: true, dischargedAt: true },
    }),
  ]);

  const totalStayHours = discharged.reduce((sum, item) => {
    if (!item.dischargedAt) return sum;
    return sum + (item.dischargedAt.getTime() - item.admissionDate.getTime()) / 3_600_000;
  }, 0);

  return {
    totalAdmissions,
    activeNow,
    dischargedCount: discharged.length,
    averageLengthOfStayDays:
      discharged.length > 0
        ? Number((totalStayHours / 24 / discharged.length).toFixed(2))
        : 0,
    byStatus,
  };
}

export async function revenueReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const branchFilter = branchId ? { branchId } : {};

  const [invoices, payments, pharmacy, paymentModes] = await Promise.all([
    prisma.billingInvoice.aggregate({
      where: {
        hospitalId,
        invoiceDate: { gte: from, lte: to },
        status: { not: BillingInvoiceStatus.CANCELLED },
        ...branchFilter,
      },
      _count: { id: true },
      _sum: {
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        balanceAmount: true,
      },
    }),
    prisma.billingPayment.aggregate({
      where: {
        hospitalId,
        paymentDate: { gte: from, lte: to },
        status: BillingPaymentStatus.COMPLETED,
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.pharmacySale.aggregate({
      where: {
        hospitalId,
        saleDate: { gte: from, lte: to },
        status: { not: PharmacySaleStatus.CANCELLED },
        ...branchFilter,
      },
      _count: { id: true },
      _sum: { totalAmount: true, amountPaid: true },
    }),
    prisma.billingPayment.groupBy({
      by: ["paymentMode"],
      where: {
        hospitalId,
        paymentDate: { gte: from, lte: to },
        status: BillingPaymentStatus.COMPLETED,
        ...branchFilter,
      },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    invoiceCount: invoices._count.id,
    subtotal: Number(invoices._sum.subtotal ?? 0),
    tax: Number(invoices._sum.taxAmount ?? 0),
    discount: Number(invoices._sum.discountAmount ?? 0),
    billed: Number(invoices._sum.totalAmount ?? 0),
    paidAgainstInvoices: Number(invoices._sum.paidAmount ?? 0),
    outstanding: Number(invoices._sum.balanceAmount ?? 0),
    receiptCount: payments._count.id,
    collections: Number(payments._sum.amount ?? 0),
    pharmacySales: pharmacy._count.id,
    pharmacyGross: Number(pharmacy._sum.totalAmount ?? 0),
    pharmacyCollected: Number(pharmacy._sum.amountPaid ?? 0),
    paymentModes: paymentModes.map((item) => ({
      paymentMode: item.paymentMode,
      count: item._count._all,
      amount: Number(item._sum.amount ?? 0),
    })),
  };
}

export async function laboratoryReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const where: Prisma.LabOrderWhereInput = {
    hospitalId,
    orderedAt: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [orders, byStatus, urgent, completed] = await Promise.all([
    prisma.labOrder.count({ where }),
    prisma.labOrder.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.labOrder.count({ where: { ...where, priority: "URGENT" } }),
    prisma.labOrder.count({ where: { ...where, status: LabOrderStatus.REPORTED } }),
  ]);

  return {
    orders,
    urgent,
    completed,
    completionRate: orders > 0 ? Number(((completed / orders) * 100).toFixed(2)) : 0,
    byStatus,
  };
}

export async function radiologyReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const where: Prisma.RadiologyOrderWhereInput = {
    hospitalId,
    requestedAt: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [orders, byStatus, completed] = await Promise.all([
    prisma.radiologyOrder.count({ where }),
    prisma.radiologyOrder.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.radiologyOrder.count({ where: { ...where, status: RadiologyOrderStatus.COMPLETED } }),
  ]);

  return {
    orders,
    completed,
    completionRate: orders > 0 ? Number(((completed / orders) * 100).toFixed(2)) : 0,
    byStatus,
  };
}

export async function pharmacyReport(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const where: Prisma.PharmacySaleWhereInput = {
    hospitalId,
    saleDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [sales, byStatus, byPaymentMode] = await Promise.all([
    prisma.pharmacySale.aggregate({
      where,
      _count: { id: true },
      _sum: { subtotal: true, taxAmount: true, discountAmount: true, totalAmount: true, amountPaid: true },
    }),
    prisma.pharmacySale.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.pharmacySale.groupBy({
      by: ["paymentMode"],
      where: { ...where, status: { not: PharmacySaleStatus.CANCELLED } },
      _count: { _all: true },
      _sum: { totalAmount: true, amountPaid: true },
    }),
  ]);

  return {
    sales: sales._count.id,
    subtotal: Number(sales._sum.subtotal ?? 0),
    tax: Number(sales._sum.taxAmount ?? 0),
    discount: Number(sales._sum.discountAmount ?? 0),
    gross: Number(sales._sum.totalAmount ?? 0),
    collected: Number(sales._sum.amountPaid ?? 0),
    byStatus,
    byPaymentMode: byPaymentMode.map((item) => ({
      paymentMode: item.paymentMode,
      count: item._count._all,
      gross: Number(item._sum.totalAmount ?? 0),
      collected: Number(item._sum.amountPaid ?? 0),
    })),
  };
}

export async function inventoryReport(hospitalId: string, branchId?: string) {
  const expiryCutoff = new Date();
  expiryCutoff.setDate(expiryCutoff.getDate() + 30);

  const allowedStores = await prisma.inventoryStore.findMany({
    where: {
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
      ...(branchId ? { branchId } : {}),
    },
    select: { id: true },
  });
  const storeIds = allowedStores.map((store) => store.id);

  const [items, stockRows, expiringBatches, pendingOrders, pendingRequests] =
    await Promise.all([
      prisma.inventoryItem.count({ where: { hospitalId, deletedAt: null } }),
      prisma.inventoryStock.findMany({
        where: { hospitalId, storeId: { in: storeIds } },
        select: { quantity: true, unitCost: true },
      }),
      prisma.inventoryStock.count({
        where: {
          hospitalId,
          storeId: { in: storeIds },
          quantity: { gt: 0 },
          expiryDate: { lte: expiryCutoff },
        },
      }),
      prisma.inventoryPurchaseOrder.count({
        where: {
          hospitalId,
          ...(branchId ? { branchId } : {}),
          status: {
            in: [
              InventoryPurchaseStatus.DRAFT,
              InventoryPurchaseStatus.SUBMITTED,
              InventoryPurchaseStatus.APPROVED,
              InventoryPurchaseStatus.PARTIALLY_RECEIVED,
            ],
          },
        },
      }),
      prisma.inventoryMaterialRequest.count({
        where: {
          hospitalId,
          ...(branchId ? { branchId } : {}),
          status: {
            in: [
              InventoryRequestStatus.DRAFT,
              InventoryRequestStatus.SUBMITTED,
              InventoryRequestStatus.APPROVED,
              InventoryRequestStatus.PARTIALLY_ISSUED,
            ],
          },
        },
      }),
    ]);

  const stockValue = stockRows.reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.unitCost ?? 0),
    0,
  );

  return {
    items,
    stores: allowedStores.length,
    stockBatches: stockRows.length,
    estimatedStockValue: Number(stockValue.toFixed(2)),
    expiringWithin30Days: expiringBatches,
    pendingPurchaseOrders: pendingOrders,
    pendingMaterialRequests: pendingRequests,
  };
}

export async function doctorPerformance(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const appointmentWhere: Prisma.AppointmentWhereInput = {
    hospitalId,
    deletedAt: null,
    appointmentDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const opdWhere: Prisma.OpdVisitWhereInput = {
    hospitalId,
    deletedAt: null,
    visitDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [appointments, opd] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where: appointmentWhere,
      _count: { _all: true },
    }),
    prisma.opdVisit.groupBy({
      by: ["doctorId"],
      where: opdWhere,
      _count: { _all: true },
    }),
  ]);

  const doctorIds = [...new Set([...appointments.map((x) => x.doctorId), ...opd.map((x) => x.doctorId)])];
  const doctors = await prisma.doctor.findMany({
    where: { hospitalId, id: { in: doctorIds }, deletedAt: null },
    select: {
      id: true,
      doctorCode: true,
      specialization: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  return doctors.map((doctor) => ({
    doctorId: doctor.id,
    doctorCode: doctor.doctorCode,
    doctorName: [doctor.employee.firstName, doctor.employee.lastName].filter(Boolean).join(" "),
    specialization: doctor.specialization,
    appointments: appointments.find((x) => x.doctorId === doctor.id)?._count._all ?? 0,
    opdVisits: opd.find((x) => x.doctorId === doctor.id)?._count._all ?? 0,
  }));
}


export async function departmentPerformance(
  hospitalId: string,
  from: Date,
  to: Date,
  branchId?: string,
) {
  const appointmentWhere: Prisma.AppointmentWhereInput = {
    hospitalId,
    deletedAt: null,
    appointmentDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };
  const opdWhere: Prisma.OpdVisitWhereInput = {
    hospitalId,
    deletedAt: null,
    visitDate: { gte: from, lte: to },
    ...(branchId ? { branchId } : {}),
  };

  const [appointments, opd] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["departmentId"],
      where: appointmentWhere,
      _count: { _all: true },
    }),
    prisma.opdVisit.groupBy({
      by: ["departmentId"],
      where: opdWhere,
      _count: { _all: true },
    }),
  ]);

  const departmentIds = [
    ...new Set([
      ...appointments.map((item) => item.departmentId),
      ...opd.map((item) => item.departmentId),
    ]),
  ];

  const departments = await prisma.department.findMany({
    where: {
      hospitalId,
      id: { in: departmentIds },
      deletedAt: null,
    },
    select: {
      id: true,
      departmentCode: true,
      departmentName: true,
      departmentType: true,
    },
  });

  return departments.map((department) => ({
    departmentId: department.id,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    departmentType: department.departmentType,
    appointments:
      appointments.find((item) => item.departmentId === department.id)?._count._all ?? 0,
    opdVisits:
      opd.find((item) => item.departmentId === department.id)?._count._all ?? 0,
  }));
}
