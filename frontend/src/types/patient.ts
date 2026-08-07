export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PatientAddress {
  id?: string;
  address_type?: string;
  addressType?: string;
  address_line1?: string;
  addressLine1?: string;
  address_line2?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  postalCode?: string | null;
  is_primary?: boolean;
  isPrimary?: boolean;
}

export interface EmergencyContact {
  id?: string;
  contact_name?: string;
  contactName?: string;
  relationship?: string | null;
  mobile?: string;
  alternate_mobile?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  is_primary?: boolean;
  isPrimary?: boolean;
}

export interface Patient {
  id: string;
  hospitalId: string;
  branchId?: string | null;
  uhid: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  primaryMobile: string;
  alternateMobile?: string | null;
  email?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  passportNumber?: string | null;
  occupation?: string | null;
  preferredLanguage?: string | null;
  referredBy?: string | null;
  referralSource?: string | null;
  medicalAlerts?: string | null;
  allergiesSummary?: string | null;
  chronicDiseasesSummary?: string | null;
  isDeceased: boolean;
  deceasedAt?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  addresses?: PatientAddress[];
  emergencyContacts?: EmergencyContact[];
}

export interface PatientListResponse {
  items: Patient[];
  pagination: Pagination;
}

export interface PatientListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  gender?: string;
  sortBy?: "createdAt" | "firstName" | "uhid";
  sortOrder?: "asc" | "desc";
}

export interface PatientFormInput {
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  primaryMobile: string;
  alternateMobile?: string | null;
  email?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  passportNumber?: string | null;
  occupation?: string | null;
  preferredLanguage?: string | null;
  referredBy?: string | null;
  referralSource?: string | null;
  medicalAlerts?: string | null;
  allergiesSummary?: string | null;
  chronicDiseasesSummary?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  addresses?: Array<{
    addressType: string;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    country: string;
    postalCode?: string | null;
    isPrimary: boolean;
  }>;
  emergencyContacts?: Array<{
    contactName: string;
    relationship?: string | null;
    mobile: string;
    alternateMobile?: string | null;
    email?: string | null;
    isPrimary: boolean;
  }>;
}

export interface ClinicalRecord {
  id: string;
  [key: string]: unknown;
}

export interface TimelineResponse {
  items: ClinicalRecord[];
  pagination: Pagination;
}
