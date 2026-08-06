import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./appointment-schedule.schema";
import * as service from "./appointment-schedule.service";

export async function createScheduleController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const input = schema.createScheduleSchema.parse(req.body);
    const payload = {
      branchId: input.branchId,
      doctorId: input.doctorId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      slotDuration: input.slotDuration,
      effectiveFrom: input.effectiveFrom,
      ...(input.maxAppointments !== undefined
        ? { maxAppointments: input.maxAppointments } : {}),
      ...(input.effectiveTo !== undefined
        ? { effectiveTo: input.effectiveTo } : {}),
    };
    const result = await service.createSchedule(
      req.auth!.hospitalId, req.auth!.userId, payload,
    );
    res.status(201).json(successResponse(
      result, "Doctor schedule created successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function listSchedulesController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const query = schema.listSchedulesQuerySchema.parse(req.query);
    const payload = {
      ...(query.doctorId !== undefined ? { doctorId: query.doctorId } : {}),
      ...(query.branchId !== undefined ? { branchId: query.branchId } : {}),
      ...(query.dayOfWeek !== undefined ? { dayOfWeek: query.dayOfWeek } : {}),
    };
    const result = await service.listSchedules(
      req.auth!.hospitalId, payload,
    );
    res.json(successResponse(
      result, "Doctor schedules retrieved successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function updateScheduleController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.updateScheduleSchema.parse(req.body);
    const result = await service.updateSchedule(
      req.auth!.hospitalId, id, req.auth!.userId, input,
    );
    res.json(successResponse(
      result, "Doctor schedule updated successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function archiveScheduleController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    await service.archiveSchedule(
      req.auth!.hospitalId, id, req.auth!.userId,
    );
    res.json(successResponse(
      null, "Doctor schedule archived successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function addBreakController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.createBreakSchema.parse(req.body);
    const result = await service.addBreak(
      req.auth!.hospitalId, id, req.auth!.userId, input,
    );
    res.status(201).json(successResponse(
      result, "Schedule break created successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function createHolidayController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const input = schema.createHolidaySchema.parse(req.body);
    const payload = {
      branchId: input.branchId,
      doctorId: input.doctorId,
      holidayDate: input.holidayDate,
      allDay: input.allDay,
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    };
    const result = await service.createHoliday(
      req.auth!.hospitalId, req.auth!.userId, payload,
    );
    res.status(201).json(successResponse(
      result, "Doctor holiday created successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function availableSlotsController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const query = schema.slotsQuerySchema.parse(req.query);
    const result = await service.availableSlots(
      req.auth!.hospitalId,
      query.doctorId,
      query.branchId,
      query.date,
    );
    res.json(successResponse(
      result, "Available slots retrieved successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function lockSlotController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const input = schema.lockSlotSchema.parse(req.body);
    const payload = {
      doctorId: input.doctorId,
      branchId: input.branchId,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
      lockMinutes: input.lockMinutes,
      ...(input.patientId !== undefined ? { patientId: input.patientId } : {}),
    };
    const result = await service.lockSlot(
      req.auth!.hospitalId, req.auth!.userId, payload,
    );
    res.status(201).json(successResponse(
      result, "Appointment slot locked successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}

export async function releaseSlotController(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { lockToken } = schema.lockTokenParamsSchema.parse(req.params);
    const result = await service.releaseSlot(
      req.auth!.hospitalId, lockToken,
    );
    res.json(successResponse(
      result, "Appointment slot released successfully", req.requestId,
    ));
  } catch (error) { next(error); }
}
