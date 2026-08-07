import { apiRequest } from "./http";
import type {
  ClinicalRecord,
  Patient,
  PatientFormInput,
  PatientListQuery,
  PatientListResponse,
  TimelineResponse,
} from "../types/patient";

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function listPatients(query: PatientListQuery = {}) {
  return apiRequest<PatientListResponse>(
    `/patients${queryString({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      gender: query.gender,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })}`,
  );
}

export function getPatient(id: string) {
  return apiRequest<Patient>(`/patients/${id}`);
}

export function createPatient(input: PatientFormInput) {
  return apiRequest<Patient>("/patients", {
    method: "POST",
    body: input,
  });
}

export function updatePatient(id: string, input: Partial<PatientFormInput>) {
  return apiRequest<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function archivePatient(id: string) {
  return apiRequest<null>(`/patients/${id}`, {
    method: "DELETE",
  });
}

export type ClinicalResource =
  | "insurances"
  | "allergies"
  | "chronic-diseases"
  | "medical-history"
  | "documents";

export function listClinicalResource(id: string, resource: ClinicalResource) {
  return apiRequest<ClinicalRecord[]>(`/patients/${id}/${resource}`);
}

export function createClinicalResource(
  id: string,
  resource: ClinicalResource,
  input: Record<string, unknown>,
) {
  return apiRequest<ClinicalRecord>(`/patients/${id}/${resource}`, {
    method: "POST",
    body: input,
  });
}

export function archiveClinicalResource(
  id: string,
  resource: ClinicalResource,
  resourceId: string,
) {
  return apiRequest<null>(`/patients/${id}/${resource}/${resourceId}`, {
    method: "DELETE",
  });
}

export function listAlerts(id: string) {
  return apiRequest<ClinicalRecord[]>(`/patients/${id}/alerts`);
}

export function createAlert(id: string, input: Record<string, unknown>) {
  return apiRequest<ClinicalRecord>(`/patients/${id}/alerts`, {
    method: "POST",
    body: input,
  });
}

export function acknowledgeAlert(id: string, alertId: string) {
  return apiRequest<ClinicalRecord>(`/patients/${id}/alerts/${alertId}/acknowledge`, {
    method: "PATCH",
    body: {},
  });
}

export function listFamily(id: string) {
  return apiRequest<ClinicalRecord[]>(`/patients/${id}/family`);
}

export function listIdentifiers(id: string) {
  return apiRequest<ClinicalRecord[]>(`/patients/${id}/identifiers`);
}

export function listTimeline(id: string, page = 1, pageSize = 30) {
  return apiRequest<TimelineResponse>(
    `/patients/${id}/timeline${queryString({ page, pageSize })}`,
  );
}

export function duplicateSearch(q: string) {
  return apiRequest<Patient[]>(
    `/patients/duplicates/search${queryString({ q, limit: 10 })}`,
  );
}

export function createFamilyRelationship(
  patientId: string,
  input: {
    relatedPatientId?: string;
    relatedPersonName?: string;
    relatedPersonMobile?: string;
    relationshipType: string;
    isEmergencyContact: boolean;
    isPrimaryContact: boolean;
    notes?: string | null;
  },
) {
  return apiRequest<ClinicalRecord>(`/patients/${patientId}/family`, {
    method: "POST",
    body: input,
  });
}

export function updateFamilyRelationship(
  patientId: string,
  relationshipId: string,
  input: {
    relationshipType?: string;
    isEmergencyContact?: boolean;
    isPrimaryContact?: boolean;
    notes?: string | null;
  },
) {
  return apiRequest<ClinicalRecord>(
    `/patients/${patientId}/family/${relationshipId}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export function archiveFamilyRelationship(
  patientId: string,
  relationshipId: string,
) {
  return apiRequest<null>(
    `/patients/${patientId}/family/${relationshipId}`,
    { method: "DELETE" },
  );
}
