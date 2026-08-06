import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { successResponse } from "../../shared/http/api-response";
import {
  createEmployeeDocumentSchema,
  createEmployeeSchema,
  employeeDocumentParamSchema,
  employeeIdParamSchema,
  employeeListQuerySchema,
  updateEmployeeDocumentSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "./employees.schema";
import * as service from "./employees.service";

export async function listEmployeesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = employeeListQuerySchema.parse(req.query);
    const result = await service.listEmployees(
      req.auth!.hospitalId,
      query,
    );

    res.status(200).json(
      successResponse(
        result,
        "Employees retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = employeeIdParamSchema.parse(req.params);
    const employee = await service.getEmployee(
      req.auth!.hospitalId,
      id,
    );

    res.status(200).json(
      successResponse(
        employee,
        "Employee retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await service.createEmployee(
      req.auth!.hospitalId,
      req.auth!.userId,
      input,
    );

    res.status(201).json(
      successResponse(
        employee,
        "Employee created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = employeeIdParamSchema.parse(req.params);
    const input = updateEmployeeSchema.parse(req.body);
    const employee = await service.updateEmployee(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        employee,
        "Employee updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = employeeIdParamSchema.parse(req.params);
    const input = updateEmployeeStatusSchema.parse(
      req.body,
    );
    const employee = await service.updateEmployeeStatus(
      req.auth!.hospitalId,
      req.auth!.userId,
      id,
      input,
    );

    res.status(200).json(
      successResponse(
        employee,
        "Employee status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listEmployeeDocumentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = employeeIdParamSchema.parse(req.params);
    const documents =
      await service.listEmployeeDocuments(
        req.auth!.hospitalId,
        id,
      );

    res.status(200).json(
      successResponse(
        documents,
        "Employee documents retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createEmployeeDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = employeeIdParamSchema.parse(req.params);
    const input = createEmployeeDocumentSchema.parse(
      req.body,
    );
    const document =
      await service.createEmployeeDocument(
        req.auth!.hospitalId,
        id,
        req.auth!.userId,
        input,
      );

    res.status(201).json(
      successResponse(
        document,
        "Employee document created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, documentId } =
      employeeDocumentParamSchema.parse(req.params);
    const input = updateEmployeeDocumentSchema.parse(
      req.body,
    );
    const document =
      await service.updateEmployeeDocument(
        req.auth!.hospitalId,
        id,
        documentId,
        req.auth!.userId,
        input,
      );

    res.status(200).json(
      successResponse(
        document,
        "Employee document updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, documentId } =
      employeeDocumentParamSchema.parse(req.params);
    await service.deleteEmployeeDocument(
      req.auth!.hospitalId,
      id,
      documentId,
      req.auth!.userId,
    );

    res.status(200).json(
      successResponse(
        null,
        "Employee document deleted successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
