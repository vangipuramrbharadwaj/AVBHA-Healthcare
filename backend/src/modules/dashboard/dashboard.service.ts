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
      route: "/patients/new",
      requiredPermission: "patients.create",
    },
    {
      key: "book-appointment",
      label: "Book Appointment",
      route: "/appointments/new",
      requiredPermission: "appointments.create",
    },
    {
      key: "add-employee",
      label: "Add Employee",
      route: "/employees/new",
      requiredPermission: "employees.create",
    },
    {
      key: "add-doctor",
      label: "Add Doctor",
      route: "/doctors/new",
      requiredPermission: "doctors.create",
    },
    {
      key: "view-reports",
      label: "View Reports",
      route: "/reports",
      requiredPermission: "reports.view",
    },
    {
      key: "hospital-settings",
      label: "Hospital Settings",
      route: "/settings",
      requiredPermission: "settings.view",
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
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/patients",
      },
      {
        key: "appointments-today",
        label: "Appointments Today",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/appointments",
      },
      {
        key: "current-inpatients",
        label: "Current Inpatients",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/ipd",
      },
      {
        key: "available-beds",
        label: "Available Beds",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/ipd/beds",
      },
      {
        key: "revenue-today",
        label: "Revenue Today",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/billing",
      },
      {
        key: "pending-laboratory",
        label: "Pending Laboratory",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/laboratory",
      },
      {
        key: "pending-radiology",
        label: "Pending Radiology",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/radiology",
      },
      {
        key: "pharmacy-expiry-alerts",
        label: "Pharmacy Expiry Alerts",
        value: null,
        status: "MODULE_NOT_IMPLEMENTED",
        route: "/pharmacy",
      },
    ],
    quickActions: quickActions(context),
    notices: [
      "Clinical dashboard metrics will activate after the patient, appointment, IPD, billing, laboratory, radiology and pharmacy database migrations are implemented.",
    ],
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
