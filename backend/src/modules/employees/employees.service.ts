import { AppError } from "../../shared/errors/app-error";
import type {
  CreateEmployeeDocumentInput,
  CreateEmployeeInput,
  EmployeeListQuery,
  UpdateEmployeeDocumentInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "./employees.schema";
import * as repository from "./employees.repository";

export const listEmployees = repository.listEmployees;

interface EmployeeReferenceInput {
  branchId?: string | null | undefined;
  departmentId?: string | undefined;
  designationId?: string | undefined;
  reportingManagerId?: string | null | undefined;
}

async function validateReferences(
  hospitalId: string,
  input: EmployeeReferenceInput,
  currentEmployeeId?: string,
): Promise<void> {
  if (input.branchId) {
    const count = await repository.branchExists(
      hospitalId,
      input.branchId,
    );

    if (count === 0) {
      throw new AppError(
        "Branch was not found in this hospital",
        400,
        "INVALID_BRANCH",
      );
    }
  }

  if (input.departmentId) {
    const count = await repository.departmentExists(
      hospitalId,
      input.departmentId,
    );

    if (count === 0) {
      throw new AppError(
        "Department was not found in this hospital",
        400,
        "INVALID_DEPARTMENT",
      );
    }
  }

  if (input.designationId) {
    const count = await repository.designationExists(
      hospitalId,
      input.designationId,
    );

    if (count === 0) {
      throw new AppError(
        "Designation was not found in this hospital",
        400,
        "INVALID_DESIGNATION",
      );
    }
  }

  if (input.reportingManagerId) {
    if (input.reportingManagerId === currentEmployeeId) {
      throw new AppError(
        "An employee cannot report to themselves",
        400,
        "INVALID_REPORTING_MANAGER",
      );
    }

    const count = await repository.reportingManagerExists(
      hospitalId,
      input.reportingManagerId,
    );

    if (count === 0) {
      throw new AppError(
        "Reporting manager was not found in this hospital",
        400,
        "INVALID_REPORTING_MANAGER",
      );
    }
  }
}

export async function getEmployee(
  hospitalId: string,
  id: string,
) {
  const employee = await repository.findEmployee(
    hospitalId,
    id,
  );

  if (!employee) {
    throw new AppError(
      "Employee was not found",
      404,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  return employee;
}

export async function createEmployee(
  hospitalId: string,
  userId: string,
  input: CreateEmployeeInput,
) {
  await validateReferences(hospitalId, {
    branchId: input.branchId,
    departmentId: input.departmentId,
    designationId: input.designationId,
    reportingManagerId: input.reportingManagerId,
  });

  return repository.createEmployee(
    hospitalId,
    userId,
    input,
  );
}

export async function updateEmployee(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateEmployeeInput,
) {
  await validateReferences(
    hospitalId,
    {
      branchId: input.branchId,
      departmentId: input.departmentId,
      designationId: input.designationId,
      reportingManagerId: input.reportingManagerId,
    },
    id,
  );

  const employee = await repository.updateEmployee(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!employee) {
    throw new AppError(
      "Employee was not found",
      404,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  return employee;
}

export async function updateEmployeeStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateEmployeeStatusInput,
) {
  const employee = await repository.updateEmployeeStatus(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!employee) {
    throw new AppError(
      "Employee was not found",
      404,
      "EMPLOYEE_NOT_FOUND",
    );
  }

  return employee;
}

async function requireEmployee(
  hospitalId: string,
  employeeId: string,
): Promise<void> {
  const employee = await repository.findEmployeeBasic(
    hospitalId,
    employeeId,
  );

  if (!employee) {
    throw new AppError(
      "Employee was not found",
      404,
      "EMPLOYEE_NOT_FOUND",
    );
  }
}

export async function listEmployeeDocuments(
  hospitalId: string,
  employeeId: string,
) {
  await requireEmployee(hospitalId, employeeId);
  return repository.listEmployeeDocuments(
    hospitalId,
    employeeId,
  );
}

export async function createEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  userId: string,
  input: CreateEmployeeDocumentInput,
) {
  await requireEmployee(hospitalId, employeeId);

  return repository.createEmployeeDocument(
    hospitalId,
    employeeId,
    userId,
    input,
  );
}

export async function updateEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  documentId: string,
  userId: string,
  input: UpdateEmployeeDocumentInput,
) {
  await requireEmployee(hospitalId, employeeId);

  const document = await repository.updateEmployeeDocument(
    hospitalId,
    employeeId,
    documentId,
    userId,
    input,
  );

  if (!document) {
    throw new AppError(
      "Employee document was not found",
      404,
      "EMPLOYEE_DOCUMENT_NOT_FOUND",
    );
  }

  return document;
}

export async function deleteEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  documentId: string,
  userId: string,
) {
  await requireEmployee(hospitalId, employeeId);

  const document = await repository.deleteEmployeeDocument(
    hospitalId,
    employeeId,
    documentId,
    userId,
  );

  if (!document) {
    throw new AppError(
      "Employee document was not found",
      404,
      "EMPLOYEE_DOCUMENT_NOT_FOUND",
    );
  }

  return document;
}
