import { AppError } from "../../shared/errors/app-error";
import type { DailyMisQuery, ReportQuery } from "./reports.schema";
import type { ReportContext } from "./reports.types";
import * as repository from "./reports.repository";

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

async function resolveBranch(
  context: ReportContext,
  requestedBranchId?: string,
): Promise<string | undefined> {
  if (context.branchId) {
    if (requestedBranchId && requestedBranchId !== context.branchId) {
      throw new AppError(
        "Cross-branch report access is not permitted",
        403,
        "REPORT_BRANCH_ACCESS_DENIED",
      );
    }
    return context.branchId;
  }

  if (!requestedBranchId) return undefined;

  if ((await repository.branchExists(context.hospitalId, requestedBranchId)) === 0) {
    throw new AppError("Branch was not found in this hospital", 400, "INVALID_BRANCH");
  }

  return requestedBranchId;
}

async function validateDimensions(context: ReportContext, query: ReportQuery) {
  if (
    query.departmentId &&
    (await repository.departmentExists(context.hospitalId, query.departmentId)) === 0
  ) {
    throw new AppError(
      "Department was not found in this hospital",
      400,
      "INVALID_DEPARTMENT",
    );
  }

  if (
    query.doctorId &&
    (await repository.doctorExists(context.hospitalId, query.doctorId)) === 0
  ) {
    throw new AppError("Doctor was not found in this hospital", 400, "INVALID_DOCTOR");
  }
}

async function reportScope(context: ReportContext, query: ReportQuery) {
  await validateDimensions(context, query);
  return {
    from: startOfDay(query.from),
    to: endOfDay(query.to),
    branchId: await resolveBranch(context, query.branchId),
  };
}

export async function overview(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.overview(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function patientRegistration(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.patientRegistration(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function appointments(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.appointmentReport(
    context.hospitalId,
    scope.from,
    scope.to,
    scope.branchId,
    query.departmentId,
    query.doctorId,
  );
}

export async function opd(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.opdReport(
    context.hospitalId,
    scope.from,
    scope.to,
    scope.branchId,
    query.departmentId,
    query.doctorId,
  );
}

export async function ipd(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.ipdReport(
    context.hospitalId,
    scope.from,
    scope.to,
    scope.branchId,
    query.departmentId,
    query.doctorId,
  );
}

export async function revenue(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.revenueReport(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function laboratory(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.laboratoryReport(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function radiology(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.radiologyReport(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function pharmacy(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.pharmacyReport(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function inventory(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.inventoryReport(context.hospitalId, scope.branchId);
}

export async function departments(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.departmentPerformance(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function doctors(context: ReportContext, query: ReportQuery) {
  const scope = await reportScope(context, query);
  return repository.doctorPerformance(context.hospitalId, scope.from, scope.to, scope.branchId);
}

export async function dailyMis(context: ReportContext, query: DailyMisQuery) {
  const branchId = await resolveBranch(context, query.branchId);
  const from = startOfDay(query.date);
  const to = endOfDay(query.date);

  const [overviewResult, appointmentResult, ipdResult, revenueResult] = await Promise.all([
    repository.overview(context.hospitalId, from, to, branchId),
    repository.appointmentReport(context.hospitalId, from, to, branchId),
    repository.ipdReport(context.hospitalId, from, to, branchId),
    repository.revenueReport(context.hospitalId, from, to, branchId),
  ]);

  return {
    date: from.toISOString().slice(0, 10),
    overview: overviewResult,
    appointments: appointmentResult,
    ipd: ipdResult,
    revenue: revenueResult,
  };
}
