export interface PatientRow {
  id: string;
  hospitalId: string;
  branchId: string | null;
  uhid: string;
  title: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  ageYears: number | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  religion: string | null;
  primaryMobile: string;
  alternateMobile: string | null;
  email: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
  passportNumber: string | null;
  occupation: string | null;
  preferredLanguage: string | null;
  referredBy: string | null;
  referralSource: string | null;
  medicalAlerts: string | null;
  allergiesSummary: string | null;
  chronicDiseasesSummary: string | null;
  isDeceased: boolean;
  deceasedAt: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PatientAddressRow {
  id: string;
  hospitalId: string;
  patientId: string;
  addressType: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientEmergencyContactRow {
  id: string;
  hospitalId: string;
  patientId: string;
  contactName: string;
  relationship: string | null;
  mobile: string;
  alternateMobile: string | null;
  email: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
