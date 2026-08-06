import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import { dashboardQuerySchema } from "./dashboard.schema";
import { getDashboard } from "./dashboard.service";

export async function dashboardController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);

    const dashboard = await getDashboard(
      {
        userId: req.auth!.userId,
        hospitalId: req.auth!.hospitalId,
        ...(req.auth!.branchId
          ? { branchId: req.auth!.branchId }
          : {}),
        roles: req.auth!.roles,
        permissions: req.auth!.permissions,
      },
      query.branchId,
    );

    res.status(200).json(
      successResponse(
        dashboard,
        "Dashboard retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
