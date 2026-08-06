import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./operation-theatre.schema";
import * as service from "./operation-theatre.service";

export async function createRoomController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createRoom(
      req.auth!.hospitalId,
      req.auth!.userId,
      schema.roomSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT room created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createProcedureController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createProcedure(
      req.auth!.hospitalId,
      req.auth!.userId,
      schema.procedureSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT procedure created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listRoomsController(req: Request, res: Response, next: NextFunction) {
  try {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const result = await service.listRooms(req.auth!.hospitalId, branchId);
    res.json(successResponse(result, "OT rooms retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listProceduresController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listProcedures(req.auth!.hospitalId);
    res.json(successResponse(result, "OT procedures retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function createBookingController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.bookingSchema.parse(req.body);

    const result = await service.createBooking(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        otRoomId: input.otRoomId,
        procedureId: input.procedureId,
        priority: input.priority,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        primarySurgeonId: input.primarySurgeonId,
        ...(input.ipdAdmissionId !== undefined ? { ipdAdmissionId: input.ipdAdmissionId } : {}),
        ...(input.opdVisitId !== undefined ? { opdVisitId: input.opdVisitId } : {}),
        ...(input.anaesthetistId !== undefined ? { anaesthetistId: input.anaesthetistId } : {}),
        ...(input.preOperativeDiagnosis !== undefined
          ? { preOperativeDiagnosis: input.preOperativeDiagnosis }
          : {}),
        ...(input.indication !== undefined ? { indication: input.indication } : {}),
        ...(input.specialInstructions !== undefined
          ? { specialInstructions: input.specialInstructions }
          : {}),
      },
    );

    res.status(201).json(successResponse(result, "OT booking created successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function listBookingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.listBookingsSchema.parse(req.query);

    const result = await service.listBookings(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined ? { patientId: query.patientId } : {}),
        ...(query.roomId !== undefined ? { roomId: query.roomId } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.date !== undefined ? { date: query.date } : {}),
      },
    );

    res.json(successResponse(result, "OT bookings retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function getBookingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.getBooking(req.auth!.hospitalId, id);
    res.json(successResponse(result, "OT booking retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function updateBookingStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.bookingStatusSchema.parse(req.body);

    const result = await service.updateBookingStatus(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.status,
      {
        ...(input.postOperativeDiagnosis !== undefined
          ? { postOperativeDiagnosis: input.postOperativeDiagnosis }
          : {}),
        ...(input.estimatedBloodLossMl !== undefined
          ? { estimatedBloodLossMl: input.estimatedBloodLossMl }
          : {}),
      },
    );

    res.json(successResponse(result, "OT booking status updated successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function rescheduleBookingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.rescheduleSchema.parse(req.body);

    const result = await service.rescheduleBooking(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        ...(input.otRoomId !== undefined ? { otRoomId: input.otRoomId } : {}),
      },
    );

    res.json(successResponse(result, "OT booking rescheduled successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function cancelBookingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.cancelSchema.parse(req.body);
    const result = await service.cancelBooking(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.reason,
    );
    res.json(successResponse(result, "OT booking cancelled successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addTeamMemberController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addTeamMember(
      req.auth!.hospitalId,
      id,
      schema.teamSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT team member added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addChecklistController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addChecklistItem(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.checklistSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT checklist item added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addConsentController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addConsent(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.consentSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT consent recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function saveAnaesthesiaController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.saveAnaesthesiaAssessment(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.anaesthesiaAssessmentSchema.parse(req.body),
    );
    res.json(successResponse(result, "Anaesthesia assessment saved successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addIntraoperativeNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addIntraoperativeNote(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.intraoperativeNoteSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "Intraoperative note added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addConsumableController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addConsumable(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.consumableSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT consumable added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addImplantController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addImplant(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.implantSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT implant added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addSpecimenController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addSpecimen(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.specimenSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT specimen recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addRecoveryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addRecoveryRecord(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.recoverySchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT recovery record added successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function addComplicationController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const result = await service.addComplication(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      schema.complicationSchema.parse(req.body),
    );
    res.status(201).json(successResponse(result, "OT complication recorded successfully", req.requestId));
  } catch (error) { next(error); }
}

export async function dashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.dashboardQuerySchema.parse(req.query);
    const result = await service.dashboard(
      req.auth!.hospitalId,
      query.date ?? new Date(),
    );
    res.json(successResponse(result, "OT dashboard retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
