import { AppError } from "../../shared/errors/app-error";
import * as repository from "./doctors.repository";
import type {
  CreateDoctorInput,
  DoctorListQuery,
  UpdateDoctorInput,
} from "./doctors.schema";

export const listDoctors = repository.listDoctors;

export async function getDoctor(hospitalId: string, id: string) {
  const doctor = await repository.findDoctor(hospitalId, id);

  if (!doctor) {
    throw new AppError("Doctor was not found", 404, "DOCTOR_NOT_FOUND");
  }

  return doctor;
}

export async function createDoctor(
  hospitalId: string,
  userId: string,
  input: CreateDoctorInput,
) {
  const department = await repository.findDepartment(
    hospitalId,
    input.departmentId,
  );

  if (!department) {
    throw new AppError(
      "Active department was not found in this hospital",
      400,
      "INVALID_DEPARTMENT",
    );
  }

  if (input.employeeId) {
    const employee = await repository.findEmployeeForDoctor(
      hospitalId,
      input.employeeId,
    );

    if (!employee) {
      throw new AppError(
        "Active employee was not found in this hospital",
        400,
        "INVALID_EMPLOYEE",
      );
    }

    if (employee.doctor) {
      throw new AppError(
        "This employee already has a doctor profile",
        409,
        "DOCTOR_ALREADY_EXISTS",
      );
    }
  }

  return repository.createDoctor(hospitalId, userId, input);
}

export async function updateDoctor(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDoctorInput,
) {
  if (input.departmentId) {
    const department = await repository.findDepartment(
      hospitalId,
      input.departmentId,
    );

    if (!department) {
      throw new AppError(
        "Active department was not found in this hospital",
        400,
        "INVALID_DEPARTMENT",
      );
    }
  }

  const doctor = await repository.updateDoctor(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!doctor) {
    throw new AppError("Doctor was not found", 404, "DOCTOR_NOT_FOUND");
  }

  return doctor;
}
