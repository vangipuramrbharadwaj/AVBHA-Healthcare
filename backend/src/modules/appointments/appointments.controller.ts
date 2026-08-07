import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./appointments.schema";
import * as service from "./appointments.service";

export async function createAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = schema.createAppointmentSchema.parse(req.body);

    const createInput = {
      branchId: input.branchId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      ...(input.patientId !== undefined && input.patientId !== null
        ? { patientId: input.patientId }
        : {}),
      ...(input.guestName !== undefined
        ? { guestName: input.guestName }
        : {}),
      ...(input.guestMobile !== undefined
        ? { guestMobile: input.guestMobile }
        : {}),
      ...(input.guestGender !== undefined
        ? { guestGender: input.guestGender }
        : {}),
      ...(input.guestDateOfBirth !== undefined
        ? { guestDateOfBirth: input.guestDateOfBirth }
        : {}),
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      appointmentType: input.appointmentType,
      visitType: input.visitType,
      priority: input.priority,
      status: input.status,
      ...(input.chiefComplaint !== undefined
        ? { chiefComplaint: input.chiefComplaint }
        : {}),
      ...(input.reason !== undefined
        ? { reason: input.reason }
        : {}),
      ...(input.notes !== undefined
        ? { notes: input.notes }
        : {}),
      ...(input.internalNotes !== undefined
        ? { internalNotes: input.internalNotes }
        : {}),
      ...(input.source !== undefined
        ? { source: input.source }
        : {}),
      ...(input.referredBy !== undefined
        ? { referredBy: input.referredBy }
        : {}),
      ...(input.confirmationMode !== undefined
        ? { confirmationMode: input.confirmationMode }
        : {}),
    };

    const result = await service.createAppointment(
      req.auth!.hospitalId,
      req.auth!.userId,
      createInput,
    );

    res.status(201).json(
      successResponse(
        result,
        "Appointment created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listAppointmentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = schema.appointmentListQuerySchema.parse(req.query);

    const listInput = {
      page: query.page,
      pageSize: query.pageSize,
      sortOrder: query.sortOrder,
      ...(query.search !== undefined
        ? { search: query.search }
        : {}),
      ...(query.patientId !== undefined
        ? { patientId: query.patientId }
        : {}),
      ...(query.doctorId !== undefined
        ? { doctorId: query.doctorId }
        : {}),
      ...(query.branchId !== undefined
        ? { branchId: query.branchId }
        : {}),
      ...(query.departmentId !== undefined
        ? { departmentId: query.departmentId }
        : {}),
      ...(query.status !== undefined
        ? { status: query.status }
        : {}),
      ...(query.appointmentType !== undefined
        ? { appointmentType: query.appointmentType }
        : {}),
      ...(query.dateFrom !== undefined
        ? { dateFrom: query.dateFrom }
        : {}),
      ...(query.dateTo !== undefined
        ? { dateTo: query.dateTo }
        : {}),
    };

    const result = await service.listAppointments(
      req.auth!.hospitalId,
      listInput,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointments retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.appointmentIdParamsSchema.parse(req.params);

    const result = await service.getAppointment(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointment retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.appointmentIdParamsSchema.parse(req.params);
    const input = schema.updateAppointmentSchema.parse(req.body);

    const result = await service.updateAppointment(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointment updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.appointmentIdParamsSchema.parse(req.params);
    const input = schema.cancelAppointmentSchema.parse(req.body);

    const result = await service.cancelAppointment(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.cancellationReason,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointment cancelled successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function rescheduleAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = schema.appointmentIdParamsSchema.parse(req.params);
    const input = schema.rescheduleAppointmentSchema.parse(req.body);

    const rescheduleInput = {
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      ...(input.reason !== undefined
        ? { reason: input.reason }
        : {}),
    };

    const result = await service.rescheduleAppointment(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      rescheduleInput,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointment rescheduled successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function appointmentDashboardController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const date = req.query.date
      ? new Date(String(req.query.date))
      : new Date();

    const result = await service.dashboard(
      req.auth!.hospitalId,
      date,
    );

    res.status(200).json(
      successResponse(
        result,
        "Appointment dashboard retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
