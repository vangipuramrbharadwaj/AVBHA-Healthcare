import { AppError } from "../../shared/errors/app-error";
import type {
  BranchListQuery,
  CreateBranchInput,
  UpdateBranchInput,
  UpdateBranchStatusInput,
} from "./branches.schema";
import * as repository from "./branches.repository";

export const listBranches = repository.listBranches;

export async function getBranch(hospitalId: string, id: string) {
  const branch = await repository.findBranch(hospitalId, id);

  if (!branch) {
    throw new AppError("Branch was not found", 404, "BRANCH_NOT_FOUND");
  }

  return branch;
}

export function createBranch(
  hospitalId: string,
  userId: string,
  input: CreateBranchInput,
) {
  return repository.createBranch(hospitalId, userId, input);
}

export async function updateBranch(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateBranchInput,
) {
  const branch = await repository.updateBranch(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!branch) {
    throw new AppError("Branch was not found", 404, "BRANCH_NOT_FOUND");
  }

  return branch;
}

export async function updateBranchStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateBranchStatusInput,
) {
  const existing = await repository.findBranch(hospitalId, id);

  if (!existing) {
    throw new AppError("Branch was not found", 404, "BRANCH_NOT_FOUND");
  }

  if (existing.isMainBranch && input.status !== "ACTIVE") {
    throw new AppError(
      "The main branch cannot be deactivated",
      409,
      "MAIN_BRANCH_DEACTIVATION_NOT_ALLOWED",
    );
  }

  return repository.updateBranchStatus(
    hospitalId,
    userId,
    id,
    input,
  );
}
