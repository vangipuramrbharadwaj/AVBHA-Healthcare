import { AppError } from "../../shared/errors/app-error";
import * as repository from "./roles.repository";

export const listRoles = repository.listRoles;

export async function getRole(hospitalId: string, id: string) {
  const role = await repository.findRole(hospitalId, id);
  if (!role) throw new AppError("Role was not found", 404, "ROLE_NOT_FOUND");
  return role;
}

async function validatePermissions(permissionIds: string[]) {
  if (!permissionIds.length) return;
  const count = await repository.countPermissions(permissionIds);
  if (count !== new Set(permissionIds).size) {
    throw new AppError("Invalid permission selection", 400, "INVALID_PERMISSION");
  }
}

export async function createRole(hospitalId: string, actorId: string, input: any) {
  await validatePermissions(input.permissionIds);
  return repository.createRole(hospitalId, actorId, input);
}

export async function updateRole(hospitalId: string, actorId: string, id: string, input: any) {
  const current = await repository.findRole(hospitalId, id);
  if (!current) throw new AppError("Role was not found", 404, "ROLE_NOT_FOUND");
  if (current.isSystemRole || current.hospitalId === null) {
    throw new AppError(
      "System roles cannot be edited from hospital administration",
      400,
      "SYSTEM_ROLE_READ_ONLY",
    );
  }
  const role = await repository.updateRole(hospitalId, actorId, id, input);
  if (!role) throw new AppError("Role was not found", 404, "ROLE_NOT_FOUND");
  return role;
}

export async function setRolePermissions(
  hospitalId: string,
  actorId: string,
  id: string,
  permissionIds: string[],
) {
  await validatePermissions(permissionIds);
  const role = await repository.setPermissions(
    hospitalId,
    actorId,
    id,
    permissionIds,
  );
  if (!role) {
    throw new AppError(
      "Only hospital-created roles can be changed",
      400,
      "ROLE_PERMISSIONS_READ_ONLY",
    );
  }
  return role;
}
