import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./appointment-queue-actions.schema";
import * as service from "./appointment-queue-actions.service";

export async function callEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);

    const result = await service.callEntry(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
    );

    res.json(
      successResponse(
        result,
        "Queue token called successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function startConsultationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);

    const result = await service.startConsultation(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
    );

    res.json(
      successResponse(
        result,
        "Consultation started successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function holdEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);
    const input = schema.queueActionNotesSchema.parse(req.body);

    const result =
      input.notes === undefined
        ? await service.holdEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
          )
        : await service.holdEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.notes,
          );

    res.json(
      successResponse(
        result,
        "Queue token held successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function skipEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);
    const input = schema.queueActionNotesSchema.parse(req.body);

    const result =
      input.notes === undefined
        ? await service.skipEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
          )
        : await service.skipEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.notes,
          );

    res.json(
      successResponse(
        result,
        "Queue token skipped successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function completeEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);
    const input = schema.queueActionNotesSchema.parse(req.body);

    const result =
      input.notes === undefined
        ? await service.completeEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
          )
        : await service.completeEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.notes,
          );

    res.json(
      successResponse(
        result,
        "Queue consultation completed successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function cancelEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);
    const input = schema.queueActionNotesSchema.parse(req.body);

    const result =
      input.notes === undefined
        ? await service.cancelEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
          )
        : await service.cancelEntry(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.notes,
          );

    res.json(
      successResponse(
        result,
        "Queue token cancelled successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function noShowEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueEntryIdParamsSchema.parse(req.params);
    const input = schema.queueActionNotesSchema.parse(req.body);

    const result =
      input.notes === undefined
        ? await service.markNoShow(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
          )
        : await service.markNoShow(
            req.auth!.hospitalId,
            id,
            req.auth!.userId,
            input.notes,
          );

    res.json(
      successResponse(
        result,
        "Queue token marked as no-show",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function nextEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.queueIdParamsSchema.parse(req.params);

    const result = await service.nextEntry(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
    );

    res.json(
      successResponse(
        result,
        "Next queue token called successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function queueDashboardController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.queueDashboardQuerySchema.parse(req.query);

    const payload = {
      ...(query.queueId !== undefined
        ? { queueId: query.queueId }
        : {}),
      ...(query.doctorId !== undefined
        ? { doctorId: query.doctorId }
        : {}),
      ...(query.branchId !== undefined
        ? { branchId: query.branchId }
        : {}),
      ...(query.date !== undefined
        ? { date: query.date }
        : {}),
    };

    const result = await service.queueDashboard(
      req.auth!.hospitalId,
      payload,
    );

    res.json(
      successResponse(
        result,
        "Queue dashboard retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
