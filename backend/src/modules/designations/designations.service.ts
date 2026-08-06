import { AppError } from "../../shared/errors/app-error";
import type {
  CreateDesignationInput,
  DesignationListQuery,
  UpdateDesignationInput,
  UpdateDesignationStatusInput,
} from "./designations.schema";
import * as repository from "./designations.repository";

export const listDesignations = repository.listDesignations;

async function validateDepartment(
  hospitalId: string,
  departmentId?: string | null,
): Promise<void> {
  if (!departmentId) {
    return;
  }

  const count = await repository.departmentExists(
    hospitalId,
    departmentId,
  );

  if (count === 0) {
    throw new AppError(
      "Department was not found in this hospital",
      400,
      "INVALID_DEPARTMENT",
    );
  }
}

export async function getDesignation(
  hospitalId: string,
  id: string,
) {
  const designation = await repository.findDesignation(hospitalId, id);

  if (!designation) {
    throw new AppError(
      "Designation was not found",
      404,
      "DESIGNATION_NOT_FOUND",
    );
  }

  return designation;
}

export async function createDesignation(
  hospitalId: string,
  userId: string,
  input: CreateDesignationInput,
) {
  await validateDepartment(hospitalId, input.departmentId);
  return repository.createDesignation(hospitalId, userId, input);
}

export async function updateDesignation(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDesignationInput,
) {
  await validateDepartment(hospitalId, input.departmentId);

  const designation = await repository.updateDesignation(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!designation) {
    throw new AppError(
      "Designation was not found",
      404,
      "DESIGNATION_NOT_FOUND",
    );
  }

  return designation;
}

export async function updateDesignationStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDesignationStatusInput,
) {
  const designation = await repository.updateDesignationStatus(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!designation) {
    throw new AppError(
      "Designation was not found",
      404,
      "DESIGNATION_NOT_FOUND",
    );
  }

  return designation;
}
