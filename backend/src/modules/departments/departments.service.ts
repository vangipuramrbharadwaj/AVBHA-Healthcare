import { AppError } from "../../shared/errors/app-error";
import type {
  CreateDepartmentInput,
  DepartmentListQuery,
  UpdateDepartmentInput,
  UpdateDepartmentStatusInput,
} from "./departments.schema";
import * as repository from "./departments.repository";

export const listDepartments = repository.listDepartments;

async function validateBranch(
  hospitalId: string,
  branchId?: string | null,
): Promise<void> {
  if (!branchId) {
    return;
  }

  const count = await repository.branchExists(hospitalId, branchId);

  if (count === 0) {
    throw new AppError(
      "Branch was not found in this hospital",
      400,
      "INVALID_BRANCH",
    );
  }
}

export async function getDepartment(hospitalId: string, id: string) {
  const department = await repository.findDepartment(hospitalId, id);

  if (!department) {
    throw new AppError(
      "Department was not found",
      404,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  return department;
}

export async function createDepartment(
  hospitalId: string,
  userId: string,
  input: CreateDepartmentInput,
) {
  await validateBranch(hospitalId, input.branchId);
  return repository.createDepartment(hospitalId, userId, input);
}

export async function updateDepartment(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDepartmentInput,
) {
  await validateBranch(hospitalId, input.branchId);

  const department = await repository.updateDepartment(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!department) {
    throw new AppError(
      "Department was not found",
      404,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  return department;
}

export async function updateDepartmentStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDepartmentStatusInput,
) {
  const department = await repository.updateDepartmentStatus(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!department) {
    throw new AppError(
      "Department was not found",
      404,
      "DEPARTMENT_NOT_FOUND",
    );
  }

  return department;
}
