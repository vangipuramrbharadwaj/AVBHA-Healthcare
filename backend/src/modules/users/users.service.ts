import type { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { hashPassword } from "../../shared/security/password";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
} from "./users.schema";
import * as repository from "./users.repository";

export const listUsers = repository.listUsers;
export const getUser = async (hospitalId: string, id: string) => {
  const user = await repository.findUser(hospitalId, id);
  if (!user) {
    throw new AppError("User was not found", 404, "USER_NOT_FOUND");
  }
  return user;
};

export const listAssignableRoles = repository.listAssignableRoles;

async function validateBranch(hospitalId: string, branchId?: string | null) {
  if (!branchId) return;
  if (!(await repository.findBranch(hospitalId, branchId))) {
    throw new AppError("Branch was not found", 400, "INVALID_BRANCH");
  }
}

async function validateRoles(hospitalId: string, roleIds: string[]) {
  if (!roleIds.length) return;
  const roles = await repository.rolesByIds(hospitalId, roleIds);
  if (roles.length !== new Set(roleIds).size) {
    throw new AppError(
      "One or more roles are invalid for this hospital",
      400,
      "INVALID_ROLE",
    );
  }
}

export async function createUser(
  hospitalId: string,
  actorId: string,
  input: CreateUserInput,
) {
  await validateBranch(hospitalId, input.branchId);
  await validateRoles(hospitalId, input.roleIds);

  if (input.employeeId) {
    const employee = await repository.findEmployee(hospitalId, input.employeeId);
    if (!employee) {
      throw new AppError("Employee was not found", 400, "INVALID_EMPLOYEE");
    }
    if (employee.user) {
      throw new AppError(
        "This employee already has a user account",
        409,
        "EMPLOYEE_USER_EXISTS",
      );
    }
  }

  const passwordHash = await hashPassword(input.temporaryPassword);

  const data: Prisma.UserUncheckedCreateInput = {
    hospitalId,
    branchId: input.branchId ?? null,
    employeeId: input.employeeId ?? null,
    fullName: input.fullName,
    username: input.username.toLowerCase(),
    email: input.email?.toLowerCase() ?? null,
    phone: input.phone ?? null,
    passwordHash,
    mustChangePassword: input.mustChangePassword,
    sessionTimeoutMinutes: input.sessionTimeoutMinutes,
    status: input.status,
    createdBy: actorId,
    updatedBy: actorId,
  };

  return repository.createUser(
    hospitalId,
    actorId,
    data,
    input.roleIds,
  );
}

export async function updateUser(
  hospitalId: string,
  actorId: string,
  id: string,
  input: UpdateUserInput,
) {
  await validateBranch(hospitalId, input.branchId);

  const user = await repository.updateUser(
    hospitalId,
    actorId,
    id,
    {
      ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.username !== undefined
        ? { username: input.username.toLowerCase() }
        : {}),
      ...(input.email !== undefined
        ? { email: input.email?.toLowerCase() ?? null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.sessionTimeoutMinutes !== undefined
        ? { sessionTimeoutMinutes: input.sessionTimeoutMinutes }
        : {}),
      ...(input.twoFactorEnabled !== undefined
        ? { twoFactorEnabled: input.twoFactorEnabled }
        : {}),
      updatedBy: actorId,
    },
  );

  if (!user) {
    throw new AppError("User was not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function updateUserStatus(
  hospitalId: string,
  actorId: string,
  id: string,
  status: any,
) {
  if (actorId === id && status !== "ACTIVE") {
    throw new AppError(
      "You cannot disable your own logged-in account",
      400,
      "SELF_DISABLE_NOT_ALLOWED",
    );
  }

  const user = await repository.updateUser(
    hospitalId,
    actorId,
    id,
    { status, updatedBy: actorId },
  );

  if (!user) {
    throw new AppError("User was not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function setUserRoles(
  hospitalId: string,
  actorId: string,
  userId: string,
  roleIds: string[],
) {
  await validateRoles(hospitalId, roleIds);
  const user = await repository.setRoles(
    hospitalId,
    actorId,
    userId,
    roleIds,
  );
  if (!user) {
    throw new AppError("User was not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function resetPassword(
  hospitalId: string,
  actorId: string,
  userId: string,
  temporaryPassword: string,
  mustChangePassword: boolean,
) {
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await repository.updateUser(
    hospitalId,
    actorId,
    userId,
    {
      passwordHash,
      mustChangePassword,
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
      updatedBy: actorId,
    },
  );

  if (!user) {
    throw new AppError("User was not found", 404, "USER_NOT_FOUND");
  }
  return user;
}
