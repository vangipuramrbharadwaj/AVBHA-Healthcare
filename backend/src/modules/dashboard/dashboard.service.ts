import { AppError } from "../../shared/errors/app-error";
import type { DashboardResponse } from "./dashboard.types";
import * as repository from "./dashboard.repository";

interface DashboardContext {
  userId: string;
  hospitalId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
}

function can(
  context: DashboardContext,
  permission: string,
): boolean {
  return (
    context.roles.includes("SUPER_ADMIN") ||
    context.permissions.includes(permission)
  );
}

function quickActions(context: DashboardContext) {
  const candidates = [
    {
      key: "register-patient",
      label: "Register Patient",
      route: "/patients",
      requiredPermission: "patients.create",
    },
    {
      key: "book-appointment",
      label: "Book Appointment",
      route: "/appointments",
      requiredPermission: "appointments.create",
    },
    {
      key: "reception-opd",
      label: "Create OPD",
      route: "/reception-opd",
      requiredPermission: "opd.create",
    },
    {
      key: "ipd-admission",
      label: "IPD Admission",
      route: "/ipd",
      requiredPermission: "ipd.create",
    },
    {
      key: "laboratory",
      label: "Laboratory Queue",
      route: "/laboratory",
      requiredPermission: "laboratory.view",
    },
    {
      key: "pharmacy",
      label: "Pharmacy Queue",
      route: "/pharmacy",
      requiredPermission: "pharmacy.view",
    },
    {
      key: "billing",
      label: "Billing",
      route: "/billing",
      requiredPermission: "billing.view",
    },
    {
      key: "reports",
      label: "Reports",
      route: "/reports",
      requiredPermission: "reports.view",
    },
  ];

  return candidates.filter((item) =>
    can(context, item.requiredPermission),
  );
}

export async function getDashboard(
  context: DashboardContext,
  requestedBranchId?: string,
): Promise<DashboardResponse> {
  const effectiveBranchId =
    requestedBranchId ?? context.branchId;

  if (
    requestedBranchId &&
    context.branchId &&
    requestedBranchId !== context.branchId &&
    !context.roles.includes("SUPER_ADMIN") &&
    !context.roles.includes("ADMIN")
  ) {
    throw new AppError(
      "You cannot view another branch dashboard",
      403,
      "BRANCH_ACCESS_DENIED",
    );
  }

  const [hospital, branch, user] = await Promise.all([
    repository.findHospital(context.hospitalId),
    repository.findBranch(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.findUser(
      context.userId,
      context.hospitalId,
    ),
  ]);

  if (!hospital || !user) {
    throw new AppError(
      "Dashboard context is unavailable",
      404,
      "DASHBOARD_CONTEXT_NOT_FOUND",
    );
  }

  const [
    totalPatients,
    today,
    queues,
    beds,
    pharmacy,
    activeIpd,
  ] = await Promise.all([
    repository.patientTotal(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.todaySummary(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.clinicalQueues(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.bedSummary(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.pharmacySummary(
      context.hospitalId,
      effectiveBranchId,
    ),
    repository.activeIpdCount(
      context.hospitalId,
      effectiveBranchId,
    ),
  ]);

  const response: DashboardResponse = {
    generatedAt: new Date().toISOString(),
    hospital: {
      id: hospital.id,
      code: hospital.hospitalCode,
      name: hospital.displayName,
    },
    branch: branch
      ? {
          id: branch.id,
          code: branch.branchCode,
          name: branch.branchName,
        }
      : null,
    user: {
      id: user.id,
      name: user.fullName,
      roles: context.roles,
    },
    metrics: [
      {
        key: "patients-total",
        label: "Total Patients",
        value: totalPatients,
        status: "AVAILABLE",
        route: "/patients",
        tone: "BLUE",
        helper: `${today.patientsRegistered} registered today`,
      },
      {
        key: "appointments-today",
        label: "Appointments Today",
        value: today.appointments,
        status: "AVAILABLE",
        route: "/appointments",
        tone: "PURPLE",
        helper: `${queues.appointmentsWaiting} currently active`,
      },
      {
        key: "current-inpatients",
        label: "Current Inpatients",
        value: activeIpd,
        status: "AVAILABLE",
        route: "/ipd",
        tone: "AMBER",
        helper: `${queues.dischargePlanned} discharge planned`,
      },
      {
        key: "available-beds",
        label: "Available Beds",
        value: beds.available,
        status: "AVAILABLE",
        route: "/ipd",
        tone: "GREEN",
        helper: `${beds.occupancyPercent}% occupancy`,
      },
      {
        key: "revenue-today",
        label: "Revenue Today",
        value: `₹${today.revenue.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`,
        status: "AVAILABLE",
        route: "/billing",
        tone: "GREEN",
        helper: `${today.payments} payment(s) received`,
      },
      {
        key: "pending-laboratory",
        label: "Pending Laboratory",
        value: queues.laboratoryPending,
        status: "AVAILABLE",
        route: "/laboratory",
        tone:
          queues.laboratoryPending > 0 ? "AMBER" : "GREEN",
        helper: "Orders awaiting final report",
      },
      {
        key: "pending-radiology",
        label: "Pending Radiology",
        value: queues.radiologyPending,
        status: "AVAILABLE",
        route: "/radiology",
        tone:
          queues.radiologyPending > 0 ? "AMBER" : "GREEN",
        helper: "Imaging orders still open",
      },
      {
        key: "pharmacy-expiry-alerts",
        label: "Pharmacy Expiry Alerts",
        value: pharmacy.expiryAlerts,
        status: "AVAILABLE",
        route: "/pharmacy",
        tone:
          pharmacy.expiryAlerts > 0 ? "RED" : "GREEN",
        helper: `${pharmacy.expiredBatches} expired batch(es)`,
      },
    ],
    today,
    queues,
    beds,
    pharmacy,
    quickActions: quickActions(context),
    notices: [],
  };

  if (
    can(context, "employees.view") ||
    can(context, "doctors.view")
  ) {
    response.workforce = await repository.workforceSummary(
      context.hospitalId,
      effectiveBranchId,
    );
  }

  if (
    context.roles.includes("SUPER_ADMIN") ||
    context.roles.includes("ADMIN") ||
    can(context, "audit.view")
  ) {
    response.security = await repository.securitySummary(
      context.hospitalId,
    );
  }

  return response;
}
