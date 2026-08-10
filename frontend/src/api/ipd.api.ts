import { apiRequest } from "./http";

export type IpdPatient = {
  id: string;
  uhid: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  primaryMobile?: string | null;
  gender?: string | null;
  ageYears?: number | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  allergiesSummary?: string | null;
  chronicDiseasesSummary?: string | null;
  medicalAlerts?: string | null;
};

export type IpdDoctor = {
  id: string;
  doctorCode?: string | null;
  specialization?: string | null;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  employee?: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  } | null;
};

export type IpdDepartment = {
  id: string;
  departmentCode?: string | null;
  departmentName: string;
};

export type IpdBranch = {
  id: string;
  branchCode?: string | null;
  branchName: string;
};

export type IpdBed = {
  id: string;
  branchId: string;
  roomId: string;
  bedCode: string;
  bedName: string;
  bedType: string;
  dailyCharge?: string | number | null;
  bedStatus: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
  status: string;
  room: {
    id: string;
    roomCode: string;
    roomName: string;
    roomType: string;
    dailyCharge?: string | number | null;
    ward: {
      id: string;
      wardCode: string;
      wardName: string;
      wardType: string;
      floor?: string | null;
    };
  };
};

export type IpdWard = {
  id: string;
  branchId: string;
  wardCode: string;
  wardName: string;
  wardType: string;
  floor?: string | null;
  rooms: Array<{
    id: string;
    roomCode: string;
    roomName: string;
    roomType: string;
    dailyCharge?: string | number | null;
    beds: Array<{
      id: string;
      bedCode: string;
      bedName: string;
      bedType: string;
      dailyCharge?: string | number | null;
      bedStatus: string;
    }>;
  }>;
};

export type IpdRoom = {
  id: string;
  branchId: string;
  wardId: string;
  roomCode: string;
  roomName: string;
  roomType: string;
  dailyCharge?: string | number | null;
  ward: IpdWard;
  beds: Array<{
    id: string;
    bedCode: string;
    bedName: string;
    bedType: string;
    dailyCharge?: string | number | null;
    bedStatus: string;
  }>;
};

export type BedAllocation = {
  id: string;
  bedId: string;
  allocatedAt: string;
  releasedAt?: string | null;
  status: string;
  transferReason?: string | null;
  bed: IpdBed;
};

export type NursingNote = {
  id: string;
  noteType: string;
  note: string;
  shift?: string | null;
  recordedAt: string;
};

export type IpdVital = {
  id: string;
  temperatureCelsius?: string | number | null;
  pulseRate?: number | null;
  respiratoryRate?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  spo2?: number | null;
  bloodSugar?: string | number | null;
  painScore?: number | null;
  notes?: string | null;
  recordedAt: string;
};

export type DoctorRound = {
  id: string;
  doctorId: string;
  roundDate: string;
  progressNotes?: string | null;
  examination?: string | null;
  diagnosis?: string | null;
  plan?: string | null;
  orders?: string | null;
};

export type MedicationAdministration = {
  id: string;
  scheduledAt: string;
  administeredAt?: string | null;
  doseGiven?: string | null;
  status: string;
  remarks?: string | null;
};

export type MedicationOrder = {
  id: string;
  medicineId?: string | null;
  medicineName: string;
  prescribedQuantity?: string | number | null;
  dosage?: string | null;
  route?: string | null;
  frequency?: string | null;
  startDate: string;
  endDate?: string | null;
  instructions?: string | null;
  status: string;
  orderedAt: string;
  administrations: MedicationAdministration[];
};

export type IntakeOutput = {
  id: string;
  recordType: "INTAKE" | "OUTPUT";
  category: string;
  quantityMl: string | number;
  recordedAt: string;
  notes?: string | null;
};

export type DischargeSummary = {
  id: string;
  dischargeType: string;
  finalDiagnosis: string;
  hospitalCourse?: string | null;
  proceduresDone?: string | null;
  conditionAtDischarge?: string | null;
  dischargeAdvice?: string | null;
  dischargeMedication?: string | null;
  followUpDate?: string | null;
  followUpInstructions?: string | null;
  preparedAt: string;
};

export type IpdAdmission = {
  id: string;
  branchId: string;
  departmentId: string;
  doctorId: string;
  patientId: string;
  admissionNumber: string;
  admissionDate: string;
  admissionType: "ELECTIVE" | "EMERGENCY" | "DAY_CARE" | "OBSERVATION";
  status: "ACTIVE" | "DISCHARGE_PLANNED" | "DISCHARGED" | "CANCELLED";
  admissionReason?: string | null;
  provisionalDiagnosis?: string | null;
  expectedDischargeDate?: string | null;
  attendantName?: string | null;
  attendantPhone?: string | null;
  notes?: string | null;
  dischargedAt?: string | null;
  patient: IpdPatient;
  doctor: IpdDoctor;
  department: IpdDepartment;
  branch?: IpdBranch;
  bedAllocations: BedAllocation[];
  nursingNotes?: NursingNote[];
  vitals?: IpdVital[];
  doctorRounds?: DoctorRound[];
  medicationOrders?: MedicationOrder[];
  intakeOutputs?: IntakeOutput[];
  dischargeSummary?: DischargeSummary | null;
};


export type IpdDischargeReadiness = {
  admissionId: string;
  admissionNumber: string;
  ready: boolean;
  billingBalance: number;
  checks: Array<{
    key: string;
    label: string;
    ready: boolean;
    pending: number;
    amount?: number;
    message: string;
  }>;
};

export type PagedAdmissions = {
  items: IpdAdmission[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function qs(values: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const listIpdAdmissions = (input: {
  page?: number;
  pageSize?: number;
  patientId?: string;
  doctorId?: string;
  status?: string;
} = {}) =>
  apiRequest<PagedAdmissions>(
    `/ipd/admissions${qs({
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 100,
      patientId: input.patientId,
      doctorId: input.doctorId,
      status: input.status,
    })}`,
  );

export const getIpdAdmission = (id: string) =>
  apiRequest<IpdAdmission>(`/ipd/admissions/${id}`);

export const createIpdAdmission = (body: Record<string, unknown>) =>
  apiRequest<IpdAdmission>("/ipd/admissions", { method: "POST", body });

export const listIpdBeds = () =>
  apiRequest<IpdBed[]>("/ipd/beds");

export const listIpdWards = (branchId?: string) =>
  apiRequest<IpdWard[]>(`/ipd/wards${qs({ branchId })}`);

export const listIpdRooms = (branchId?: string, wardId?: string) =>
  apiRequest<IpdRoom[]>(`/ipd/rooms${qs({ branchId, wardId })}`);

export const createIpdWard = (body: Record<string, unknown>) =>
  apiRequest<IpdWard>("/ipd/wards", { method: "POST", body });

export const createIpdRoom = (body: Record<string, unknown>) =>
  apiRequest<IpdRoom>("/ipd/rooms", { method: "POST", body });

export const createIpdBed = (body: Record<string, unknown>) =>
  apiRequest<IpdBed>("/ipd/beds", { method: "POST", body });

export const transferIpdBed = (
  admissionId: string,
  body: { bedId: string; transferReason?: string | null },
) =>
  apiRequest<BedAllocation>(`/ipd/admissions/${admissionId}/transfer-bed`, {
    method: "POST",
    body,
  });

export const addIpdNursingNote = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<NursingNote>(`/ipd/admissions/${admissionId}/nursing-notes`, {
    method: "POST",
    body,
  });

export const addIpdVitals = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<IpdVital>(`/ipd/admissions/${admissionId}/vitals`, {
    method: "POST",
    body,
  });

export const addIpdDoctorRound = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<DoctorRound>(`/ipd/admissions/${admissionId}/doctor-rounds`, {
    method: "POST",
    body,
  });

export const addIpdMedicationOrder = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<MedicationOrder>(`/ipd/admissions/${admissionId}/medication-orders`, {
    method: "POST",
    body,
  });

export const addIpdMedicationAdministration = (
  medicationOrderId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<MedicationAdministration>(
    `/ipd/medication-orders/${medicationOrderId}/administrations`,
    { method: "POST", body },
  );

export const addIpdIntakeOutput = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<IntakeOutput>(`/ipd/admissions/${admissionId}/intake-output`, {
    method: "POST",
    body,
  });

export const dischargeIpdPatient = (
  admissionId: string,
  body: Record<string, unknown>,
) =>
  apiRequest<DischargeSummary>(`/ipd/admissions/${admissionId}/discharge`, {
    method: "POST",
    body,
  });


export const getIpdDischargeReadiness = (admissionId: string) =>
  apiRequest<IpdDischargeReadiness>(
    `/ipd/admissions/${admissionId}/discharge-readiness`,
  );
