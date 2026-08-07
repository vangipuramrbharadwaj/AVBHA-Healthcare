import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import { dailyMisQuerySchema, reportQuerySchema } from "./reports.schema";
import type { ReportContext } from "./reports.types";
import * as service from "./reports.service";

function context(req: Request): ReportContext {
  return {
    hospitalId: req.auth!.hospitalId,
    userId: req.auth!.userId,
    ...(req.auth!.branchId ? { branchId: req.auth!.branchId } : {}),
    roles: req.auth!.roles,
  };
}

async function run(
  req: Request,
  res: Response,
  next: NextFunction,
  message: string,
  handler: (ctx: ReportContext) => Promise<unknown>,
): Promise<void> {
  try {
    const result = await handler(context(req));
    res.status(200).json(successResponse(result, message, req.requestId));
  } catch (error) {
    next(error);
  }
}

export function overviewController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "MIS overview retrieved successfully", (ctx) =>
    service.overview(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function patientRegistrationController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Patient registration report retrieved successfully", (ctx) =>
    service.patientRegistration(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function appointmentsController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Appointment report retrieved successfully", (ctx) =>
    service.appointments(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function opdController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "OPD report retrieved successfully", (ctx) =>
    service.opd(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function ipdController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "IPD report retrieved successfully", (ctx) =>
    service.ipd(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function revenueController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Revenue report retrieved successfully", (ctx) =>
    service.revenue(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function laboratoryController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Laboratory report retrieved successfully", (ctx) =>
    service.laboratory(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function radiologyController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Radiology report retrieved successfully", (ctx) =>
    service.radiology(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function pharmacyController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Pharmacy report retrieved successfully", (ctx) =>
    service.pharmacy(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function inventoryController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Inventory report retrieved successfully", (ctx) =>
    service.inventory(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function departmentsController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Department performance report retrieved successfully", (ctx) =>
    service.departments(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function doctorsController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Doctor performance report retrieved successfully", (ctx) =>
    service.doctors(ctx, reportQuerySchema.parse(req.query)),
  );
}
export function dailyMisController(req: Request, res: Response, next: NextFunction) {
  return run(req, res, next, "Daily MIS retrieved successfully", (ctx) =>
    service.dailyMis(ctx, dailyMisQuerySchema.parse(req.query)),
  );
}
