import { AppError } from "../../shared/errors/app-error";
import type {
  CreatePatientInput,
  PatientListQuery,
  UpdatePatientInput,
} from "./patients.schema";
import * as repository from "./patients.repository";

export const listPatients = repository.listPatients;

export async function getPatient(
  hospitalId: string,
  id: string,
) {
  const patient = await repository.findPatient(hospitalId, id);

  if (!patient) {
    throw new AppError(
      "Patient was not found",
      404,
      "PATIENT_NOT_FOUND",
    );
  }

  return patient;
}

export async function createPatient(
  hospitalId: string,
  userId: string,
  input: CreatePatientInput,
) {
  if (input.branchId) {
    const branchValid = await repository.branchExists(
      hospitalId,
      input.branchId,
    );

    if (!branchValid) {
      throw new AppError(
        "Branch was not found in this hospital",
        400,
        "INVALID_BRANCH",
      );
    }
  }

const duplicates = await repository.findPotentialDuplicates(
  hospitalId,
  {
    primaryMobile: input.primaryMobile,
    firstName: input.firstName,
    ...(input.dateOfBirth !== undefined
      ? { dateOfBirth: input.dateOfBirth }
      : {}),
  },
);

  if (duplicates.length > 0) {
    throw new AppError(
      "Potential duplicate patient found",
      409,
      "POTENTIAL_DUPLICATE_PATIENT",
      { duplicates },
    );
  }

  const uhid =
    input.uhid ?? (await repository.generateUhid(hospitalId));

  return repository.createPatient(
    hospitalId,
    userId,
    uhid,
    input,
  );
}

export async function updatePatient(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdatePatientInput,
) {
  if (input.branchId) {
    const branchValid = await repository.branchExists(
      hospitalId,
      input.branchId,
    );

    if (!branchValid) {
      throw new AppError(
        "Branch was not found in this hospital",
        400,
        "INVALID_BRANCH",
      );
    }
  }

  const patient = await repository.updatePatient(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!patient) {
    throw new AppError(
      "Patient was not found",
      404,
      "PATIENT_NOT_FOUND",
    );
  }

  return patient;
}

export async function deletePatient(
  hospitalId: string,
  userId: string,
  id: string,
) {
  const patient = await repository.softDeletePatient(
    hospitalId,
    userId,
    id,
  );

  if (!patient) {
    throw new AppError(
      "Patient was not found",
      404,
      "PATIENT_NOT_FOUND",
    );
  }

  return patient;
}
