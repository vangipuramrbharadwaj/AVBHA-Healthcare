export const DOCUMENT_TYPES = {
  PATIENT_UHID: "PATIENT_UHID",
  APPOINTMENT: "APPOINTMENT",
  OPD_VISIT: "OPD_VISIT",
  IPD_ADMISSION: "IPD_ADMISSION",
  LAB_ORDER: "LAB_ORDER",
  RADIOLOGY_ORDER: "RADIOLOGY_ORDER",
  PHARMACY_PURCHASE: "PHARMACY_PURCHASE",
  PHARMACY_GRN: "PHARMACY_GRN",
  PHARMACY_SALE: "PHARMACY_SALE",
  PHARMACY_DISPENSE: "PHARMACY_DISPENSE",
  BILLING_INVOICE: "BILLING_INVOICE",
  BILLING_RECEIPT: "BILLING_RECEIPT",
  BILLING_REFUND: "BILLING_REFUND",
  BILLING_ADVANCE: "BILLING_ADVANCE",
  OT_BOOKING: "OT_BOOKING",
  OT_SPECIMEN: "OT_SPECIMEN",
  INVENTORY_TRANSFER: "INVENTORY_TRANSFER",
  INVENTORY_MATERIAL_REQUEST: "INVENTORY_MATERIAL_REQUEST",
  INVENTORY_GOODS_RECEIPT: "INVENTORY_GOODS_RECEIPT",
  INVENTORY_PURCHASE_ORDER: "INVENTORY_PURCHASE_ORDER",
} as const;

export type DocumentType =
  (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export type SequencePeriod = "NONE" | "YEAR" | "MONTH" | "DATE";

export interface NextDocumentNumberInput {
  hospitalId: string;
  branchId?: string | null;
  documentType: DocumentType;
  prefix: string;
  period?: SequencePeriod;
  date?: Date;
  padding?: number;
}

export interface SequenceAllocation {
  number: string;
  sequence: bigint;
  periodKey: string;
  scopeKey: string;
}
