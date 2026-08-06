import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import * as repository from "./patient-clinical.repository";

async function requirePatient(
  hospitalId: string,
  patientId: string,
): Promise<void> {
  const count = await repository.patientExists(hospitalId, patientId);
  if (count === 0) {
    throw new AppError("Patient was not found", 404, "PATIENT_NOT_FOUND");
  }
}

function clean(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export const listInsurances = wrapList(repository.listInsurances);
export async function createInsurance(
  hospitalId: string,
  patientId: string,
  userId: string,
  input: Record<string, unknown>,
) {
  await requirePatient(hospitalId, patientId);
  const data = clean(input);
  if (typeof data.sumInsured === "number") {
    data.sumInsured = new Prisma.Decimal(data.sumInsured);
  }
  return repository.createInsurance(hospitalId, patientId, userId, data);
}
export const updateInsurance = wrapUpdate(
  repository.updateInsurance,
  "Insurance",
);
export const archiveInsurance = wrapArchive(
  repository.archiveInsurance,
  "Insurance",
);

export const listAllergies = wrapList(repository.listAllergies);
export const createAllergy = wrapCreate(repository.createAllergy);
export const updateAllergy = wrapUpdate(repository.updateAllergy, "Allergy");
export const archiveAllergy = wrapArchive(repository.archiveAllergy, "Allergy");

export const listChronicDiseases = wrapList(repository.listChronicDiseases);
export const createChronicDisease = wrapCreate(repository.createChronicDisease);
export const updateChronicDisease = wrapUpdate(
  repository.updateChronicDisease,
  "Chronic disease",
);
export const archiveChronicDisease = wrapArchive(
  repository.archiveChronicDisease,
  "Chronic disease",
);

export const listMedicalHistory = wrapList(repository.listMedicalHistory);
export const createMedicalHistory = wrapCreate(repository.createMedicalHistory);
export const updateMedicalHistory = wrapUpdate(
  repository.updateMedicalHistory,
  "Medical history",
);
export const archiveMedicalHistory = wrapArchive(
  repository.archiveMedicalHistory,
  "Medical history",
);

export const listDocuments = wrapList(repository.listDocuments);
export const createDocument = wrapCreate(repository.createDocument);
export const updateDocument = wrapUpdate(repository.updateDocument, "Document");
export const archiveDocument = wrapArchive(repository.archiveDocument, "Document");

export async function listTimeline(
  hospitalId: string,
  patientId: string,
  page: number,
  pageSize: number,
  eventType?: string,
) {
  await requirePatient(hospitalId, patientId);
  return repository.listTimeline(
    hospitalId,
    patientId,
    page,
    pageSize,
    eventType,
  );
}

function wrapList(fn: any) {
  return async (hospitalId: string, patientId: string) => {
    await requirePatient(hospitalId, patientId);
    return fn(hospitalId, patientId);
  };
}
function wrapCreate(fn: any) {
  return async (
    hospitalId: string,
    patientId: string,
    userId: string,
    input: Record<string, unknown>,
  ) => {
    await requirePatient(hospitalId, patientId);
    return fn(hospitalId, patientId, userId, clean(input));
  };
}
function wrapUpdate(fn: any, label: string) {
  return async (
    hospitalId: string,
    patientId: string,
    resourceId: string,
    userId: string,
    input: Record<string, unknown>,
  ) => {
    await requirePatient(hospitalId, patientId);
    const record = await fn(
      hospitalId,
      patientId,
      resourceId,
      userId,
      clean(input),
    );
    if (!record) {
      throw new AppError(
        `${label} was not found`,
        404,
        "PATIENT_RESOURCE_NOT_FOUND",
      );
    }
    return record;
  };
}
function wrapArchive(fn: any, label: string) {
  return async (
    hospitalId: string,
    patientId: string,
    resourceId: string,
    userId: string,
  ) => {
    await requirePatient(hospitalId, patientId);
    const record = await fn(
      hospitalId,
      patientId,
      resourceId,
      userId,
    );
    if (!record) {
      throw new AppError(
        `${label} was not found`,
        404,
        "PATIENT_RESOURCE_NOT_FOUND",
      );
    }
    return record;
  };
}
