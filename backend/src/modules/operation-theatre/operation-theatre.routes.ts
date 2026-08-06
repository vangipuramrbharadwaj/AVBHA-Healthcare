import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  addChecklistController,
  addComplicationController,
  addConsentController,
  addConsumableController,
  addImplantController,
  addIntraoperativeNoteController,
  addRecoveryController,
  addSpecimenController,
  addTeamMemberController,
  cancelBookingController,
  createBookingController,
  createProcedureController,
  createRoomController,
  dashboardController,
  getBookingController,
  listBookingsController,
  listProceduresController,
  listRoomsController,
  rescheduleBookingController,
  saveAnaesthesiaController,
  updateBookingStatusController,
} from "./operation-theatre.controller";
import { OT_PERMISSIONS } from "./operation-theatre.permissions";

export const operationTheatreRouter = Router();
operationTheatreRouter.use(authenticate, enforceTenant);

operationTheatreRouter.get("/dashboard", requirePermission(OT_PERMISSIONS.VIEW), dashboardController);

operationTheatreRouter.post("/rooms", requirePermission(OT_PERMISSIONS.CREATE), createRoomController);
operationTheatreRouter.get("/rooms", requirePermission(OT_PERMISSIONS.VIEW), listRoomsController);

operationTheatreRouter.post("/procedures", requirePermission(OT_PERMISSIONS.CREATE), createProcedureController);
operationTheatreRouter.get("/procedures", requirePermission(OT_PERMISSIONS.VIEW), listProceduresController);

operationTheatreRouter.post("/bookings", requirePermission(OT_PERMISSIONS.CREATE), createBookingController);
operationTheatreRouter.get("/bookings", requirePermission(OT_PERMISSIONS.VIEW), listBookingsController);
operationTheatreRouter.get("/bookings/:id", requirePermission(OT_PERMISSIONS.VIEW), getBookingController);
operationTheatreRouter.post("/bookings/:id/status", requirePermission(OT_PERMISSIONS.UPDATE), updateBookingStatusController);
operationTheatreRouter.post("/bookings/:id/reschedule", requirePermission(OT_PERMISSIONS.UPDATE), rescheduleBookingController);
operationTheatreRouter.post("/bookings/:id/cancel", requirePermission(OT_PERMISSIONS.DELETE), cancelBookingController);

operationTheatreRouter.post("/bookings/:id/team", requirePermission(OT_PERMISSIONS.UPDATE), addTeamMemberController);
operationTheatreRouter.post("/bookings/:id/checklist", requirePermission(OT_PERMISSIONS.UPDATE), addChecklistController);
operationTheatreRouter.post("/bookings/:id/consents", requirePermission(OT_PERMISSIONS.UPDATE), addConsentController);
operationTheatreRouter.put("/bookings/:id/anaesthesia-assessment", requirePermission(OT_PERMISSIONS.UPDATE), saveAnaesthesiaController);
operationTheatreRouter.post("/bookings/:id/intraoperative-notes", requirePermission(OT_PERMISSIONS.UPDATE), addIntraoperativeNoteController);
operationTheatreRouter.post("/bookings/:id/consumables", requirePermission(OT_PERMISSIONS.UPDATE), addConsumableController);
operationTheatreRouter.post("/bookings/:id/implants", requirePermission(OT_PERMISSIONS.UPDATE), addImplantController);
operationTheatreRouter.post("/bookings/:id/specimens", requirePermission(OT_PERMISSIONS.UPDATE), addSpecimenController);
operationTheatreRouter.post("/bookings/:id/recovery", requirePermission(OT_PERMISSIONS.UPDATE), addRecoveryController);
operationTheatreRouter.post("/bookings/:id/complications", requirePermission(OT_PERMISSIONS.UPDATE), addComplicationController);
