import { apiRequest } from "./http";

export type LabTestParameter = {
  id: string;
  parameterCode: string;
  parameterName: string;
  valueType: string;
  unit?: string | null;
  referenceRange?: string | null;
  required: boolean;
};

export type LabTest = {
  id: string;
  testCode: string;
  testName: string;
  category?: string | null;
  sampleType: string;
  containerType?: string | null;
  turnaroundMinutes?: number | null;
  price?: string | number | null;
  instructions?: string | null;
  status?: string;
  parameters?: LabTestParameter[];
};

export type LabResultValue = {
  id: string;
  parameterId: string;
  numericValue?: string | number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  choiceValue?: string | null;
  abnormalFlag?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  critical?: boolean;
  comments?: string | null;
  parameter: {
    parameterName: string;
    unit?: string | null;
    referenceRange?: string | null;
  };
};

export type LabOrder = {
  id: string;
  orderNumber: string;
  patientId: string;
  ipdAdmissionId?: string | null;
  priority: string;
  status: string;
  clinicalNotes?: string | null;
  orderedAt: string;
  patient: {
    id: string;
    uhid?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    primaryMobile?: string | null;
  };
  items: Array<{
    id: string;
    testId: string;
    status: string;
    test: LabTest;
    sample?: {
      id: string;
      sampleNumber: string;
      status: string;
      barcode?: string | null;
      collectedAt?: string | null;
    } | null;
    result?: {
      id: string;
      status: string;
      interpretation?: string | null;
      remarks?: string | null;
      verifiedAt?: string | null;
      values: LabResultValue[];
    } | null;
  }>;
};

export const laboratoryDashboard = () => listLabOrders();

export const listLabTests = () =>
  apiRequest<LabTest[]>("/laboratory/tests");

export const createLabTest = (body: unknown) =>
  apiRequest<LabTest>("/laboratory/tests", { method: "POST", body });

export const listLabOrders = (status?: string) =>
  apiRequest<{ items: LabOrder[]; pagination: unknown }>(
    `/laboratory/orders?page=1&pageSize=100${status ? `&status=${status}` : ""}`,
  );

export const getLabOrder = (id: string) =>
  apiRequest<LabOrder>(`/laboratory/orders/${id}`);

export const collectLabSample = (id: string, body: unknown) =>
  apiRequest(`/laboratory/samples/${id}/collect`, {
    method: "POST",
    body,
  });

export const rejectLabSample = (id: string, body: unknown) =>
  apiRequest(`/laboratory/samples/${id}/reject`, {
    method: "POST",
    body,
  });

export const enterLabResult = (id: string, body: unknown) =>
  apiRequest(`/laboratory/order-items/${id}/result`, {
    method: "PUT",
    body,
  });

export const updateLabResultStatus = (id: string, body: unknown) =>
  apiRequest(`/laboratory/results/${id}/status`, {
    method: "POST",
    body,
  });
