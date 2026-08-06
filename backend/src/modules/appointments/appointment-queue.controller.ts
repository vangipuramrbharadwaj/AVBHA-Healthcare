import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./appointment-queue.schema";
import * as service from "./appointment-queue.service";

export async function createQueueController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createQueueSchema.parse(req.body);
    const result = await service.createQueue(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );
    res.status(201).json(successResponse(result, "Queue created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listQueuesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listQueuesQuerySchema.parse(req.query);
    const payload = {
      ...(query.doctorId !== undefined ? { doctorId: query.doctorId } : {}),
      ...(query.date !== undefined ? { date: query.date } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };
    const result = await service.listQueues(req.auth!.hospitalId, payload);
    res.json(successResponse(result, "Queues retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function getQueueController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.queueIdParamsSchema.parse(req.params);
    const result = await service.getQueue(req.auth!.hospitalId, id);
    res.json(successResponse(result, "Queue retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createQueueEntryController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.createQueueEntrySchema.parse(req.body);
    const payload = {
      queueId: input.queueId,
      patientId: input.patientId,
      priority: input.priority,
      source: input.source,
      ...(input.appointmentId !== undefined ? { appointmentId: input.appointmentId } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    const result = await service.createQueueEntry(
      req.auth!.hospitalId,
      req.auth!.userId,
      payload,
    );
    res.status(201).json(successResponse(result, "Queue token generated successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listQueueEntriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listQueueEntriesQuerySchema.parse(req.query);
    const payload = {
      ...(query.queueId !== undefined ? { queueId: query.queueId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.priority !== undefined ? { priority: query.priority } : {}),
    };
    const result = await service.listQueueEntries(req.auth!.hospitalId, payload);
    res.json(successResponse(result, "Queue entries retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
