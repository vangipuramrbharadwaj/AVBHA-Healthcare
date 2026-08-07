import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./communications.schema";
import * as service from "./communications.service";

export async function listController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.list(req.auth!.hospitalId, schema.listSchema.parse(req.query));
    res.status(200).json(successResponse(result, "Communications retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function getController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamSchema.parse(req.params);
    const result = await service.get(req.auth!.hospitalId, id);
    res.status(200).json(successResponse(result, "Communication retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function sendController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.sendSchema.parse(req.body);
    const result = await service.send(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Communication accepted successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function notificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = schema.notificationListSchema.parse(req.query);
    const result = await service.notifications(req.auth!.hospitalId, req.auth!.userId, query);
    res.status(200).json(successResponse(result, "Notifications retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function readController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamSchema.parse(req.params);
    const result = await service.markRead(req.auth!.hospitalId, req.auth!.userId, id);
    res.status(200).json(successResponse(result, "Notification marked as read", req.requestId));
  } catch (error) { next(error); }
}
export async function readAllController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markAllRead(req.auth!.hospitalId, req.auth!.userId);
    res.status(200).json(successResponse(result, "Notifications marked as read", req.requestId));
  } catch (error) { next(error); }
}
export async function templatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.templates(req.auth!.hospitalId);
    res.status(200).json(successResponse(result, "Communication templates retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function createTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.templateSchema.parse(req.body);
    const result = await service.createTemplate(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(201).json(successResponse(result, "Communication template created successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function updateTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = schema.idParamSchema.parse(req.params);
    const input = schema.templateUpdateSchema.parse(req.body);
    const result = await service.updateTemplate(req.auth!.hospitalId, req.auth!.userId, id, input);
    res.status(200).json(successResponse(result, "Communication template updated successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function preferencesController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.preferences(req.auth!.hospitalId, req.auth!.userId);
    res.status(200).json(successResponse(result, "Communication preferences retrieved successfully", req.requestId));
  } catch (error) { next(error); }
}
export async function savePreferenceController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = schema.preferenceSchema.parse(req.body);
    const result = await service.setPreference(req.auth!.hospitalId, req.auth!.userId, input);
    res.status(200).json(successResponse(result, "Communication preference saved successfully", req.requestId));
  } catch (error) { next(error); }
}
