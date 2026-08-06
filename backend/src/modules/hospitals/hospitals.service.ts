import { AppError } from "../../shared/errors/app-error";
import type { UpdateHospitalInput } from "./hospitals.schema";
import * as repository from "./hospitals.repository";

export async function getHospitalProfile(hospitalId: string) {
  const hospital = await repository.findHospitalProfile(hospitalId);

  if (!hospital) {
    throw new AppError(
      "Hospital profile was not found",
      404,
      "HOSPITAL_NOT_FOUND",
    );
  }

  return hospital;
}

export async function updateHospitalProfile(
  hospitalId: string,
  userId: string,
  input: UpdateHospitalInput,
) {
  const hospital = await repository.updateHospitalProfile(
    hospitalId,
    userId,
    input,
  );

  if (!hospital) {
    throw new AppError(
      "Hospital profile was not found",
      404,
      "HOSPITAL_NOT_FOUND",
    );
  }

  return hospital;
}
