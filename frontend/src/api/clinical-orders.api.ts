import { apiRequest } from "./http";

export type ClinicalLabTest = {
  id: string;
  testCode: string;
  testName: string;
  category?: string | null;
  sampleType: string;
  price?: string | number | null;
};

export type ClinicalRadiologyProcedure = {
  id: string;
  procedureCode: string;
  procedureName: string;
  modality: string;
  bodyPart?: string | null;
  price?: string | number | null;
};

export const listClinicalLabTests = () =>
  apiRequest<ClinicalLabTest[]>("/laboratory/tests");

export const listClinicalRadiologyProcedures = () =>
  apiRequest<ClinicalRadiologyProcedure[]>("/radiology/procedures");

export const createOpdLabOrder = (body: Record<string, unknown>) =>
  apiRequest("/laboratory/orders", { method: "POST", body });

export const createOpdRadiologyOrder = (body: Record<string, unknown>) =>
  apiRequest("/radiology/orders", { method: "POST", body });
