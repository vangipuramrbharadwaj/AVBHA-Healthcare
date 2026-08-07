import {
  DOCUMENT_TYPES,
  nextDocumentNumber,
} from "./index";

async function allocate(
  hospitalId: string,
  documentType: (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES],
  prefix: string,
  date: Date,
  period: "YEAR" | "DATE",
): Promise<string> {
  const allocation = await nextDocumentNumber({
    hospitalId,
    documentType,
    prefix,
    date,
    period,
    padding: 6,
  });

  return allocation.number;
}

export function nextPatientUhid(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.PATIENT_UHID,
    "UHID",
    date,
    "YEAR",
  );
}

export function nextAppointmentNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.APPOINTMENT,
    "APT",
    date,
    "DATE",
  );
}

export function nextOpdVisitNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.OPD_VISIT,
    "OPD",
    date,
    "DATE",
  );
}

export function nextIpdAdmissionNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.IPD_ADMISSION,
    "IPD",
    date,
    "DATE",
  );
}

export function nextLabOrderNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.LAB_ORDER,
    "LAB",
    date,
    "DATE",
  );
}

export function nextRadiologyOrderNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.RADIOLOGY_ORDER,
    "RAD",
    date,
    "DATE",
  );
}

export function nextPharmacyPurchaseNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.PHARMACY_PURCHASE,
    "PO",
    date,
    "DATE",
  );
}

export function nextPharmacyGrnNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.PHARMACY_GRN,
    "GRN",
    date,
    "DATE",
  );
}

export function nextPharmacySaleNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.PHARMACY_SALE,
    "PHS",
    date,
    "DATE",
  );
}

export function nextPharmacyDispenseNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.PHARMACY_DISPENSE,
    "PHD",
    date,
    "DATE",
  );
}

export function nextBillingInvoiceNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.BILLING_INVOICE,
    "INV",
    date,
    "DATE",
  );
}

export function nextBillingReceiptNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.BILLING_RECEIPT,
    "RCT",
    date,
    "DATE",
  );
}

export function nextBillingRefundNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.BILLING_REFUND,
    "RFN",
    date,
    "DATE",
  );
}

export function nextBillingAdvanceNumber(
  hospitalId: string,
  date: Date = new Date(),
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.BILLING_ADVANCE,
    "ADV",
    date,
    "DATE",
  );
}

export function nextOtBookingNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.OT_BOOKING,
    "OT",
    date,
    "DATE",
  );
}

export function nextOtSpecimenNumber(
  hospitalId: string,
  date: Date,
): Promise<string> {
  return allocate(
    hospitalId,
    DOCUMENT_TYPES.OT_SPECIMEN,
    "OTS",
    date,
    "DATE",
  );
}
