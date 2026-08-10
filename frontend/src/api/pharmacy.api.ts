import { apiRequest } from "./http";

export type Medicine={
  id:string;medicineCode:string;brandName:string;genericName?:string|null;
  strength?:string|null;dosageForm?:string|null;manufacturer?:string|null;
  gstPercent?:string|number|null;purchasePrice?:string|number|null;
  sellingPrice?:string|number|null;reorderLevel?:string|number|null;
  requiresPrescription:boolean;controlledDrug:boolean;status:string
};

export type Batch={
  id:string;branchId:string;medicineId:string;batchNumber:string;
  expiryDate:string;purchasePrice:string|number;sellingPrice:string|number;
  availableQuantity:string|number;rackLocation?:string|null;status:string
};

export type InventoryMedicine=Medicine&{batches:Batch[]};

export type Supplier={
  id:string;supplierCode:string;supplierName:string;contactPerson?:string|null;
  phone?:string|null;email?:string|null;gstin?:string|null;drugLicenseNo?:string|null;
  address?:string|null;paymentTerms?:string|null;status:string
};

export type PurchaseOrderItem={
  id:string;
  medicineId:string;
  orderedQuantity:string|number;
  receivedQuantity:string|number;
  unitPrice:string|number;
  taxPercent?:string|number|null;
  discountPercent?:string|number|null;
  lineTotal:string|number;
  medicine:Medicine;
};

export type PurchaseOrder={
  id:string;
  branchId:string;
  supplierId:string;
  purchaseNumber:string;
  status:"DRAFT"|"ORDERED"|"PARTIALLY_RECEIVED"|"RECEIVED"|"CANCELLED";
  orderDate:string;
  expectedDate?:string|null;
  subtotal:string|number;
  taxAmount:string|number;
  discountAmount:string|number;
  totalAmount:string|number;
  notes?:string|null;
  supplier:Supplier;
  items:PurchaseOrderItem[];
};

export const pharmacyDashboard=()=>apiRequest<any>("/pharmacy/dashboard");
export const listMedicines=(search="")=>apiRequest<Medicine[]>(`/pharmacy/medicines${search?`?search=${encodeURIComponent(search)}`:""}`);
export const createMedicine=(body:any)=>apiRequest<Medicine>("/pharmacy/medicines",{method:"POST",body});
export const listSuppliers=()=>apiRequest<Supplier[]>("/pharmacy/suppliers");
export const createSupplier=(body:any)=>apiRequest<Supplier>("/pharmacy/suppliers",{method:"POST",body});
export const pharmacyInventory=(branchId?:string)=>apiRequest<InventoryMedicine[]>(`/pharmacy/inventory${branchId?`?branchId=${branchId}`:""}`);
export const createBatch=(body:any)=>apiRequest<Batch>("/pharmacy/batches",{method:"POST",body});
export const stockLedger=(branchId?:string)=>apiRequest<any[]>(`/pharmacy/stock-ledger${branchId?`?branchId=${branchId}`:""}`);

export const listPurchaseOrders=()=>apiRequest<{items:PurchaseOrder[];pagination:any}>("/pharmacy/purchase-orders?page=1&pageSize=100");
export const createPurchaseOrder=(body:any)=>apiRequest<PurchaseOrder>("/pharmacy/purchase-orders",{method:"POST",body});
export const receivePurchaseOrder=(id:string,body:any)=>apiRequest<any>(`/pharmacy/purchase-orders/${id}/receive`,{method:"POST",body});

export const listSales=()=>apiRequest<any>("/pharmacy/sales?page=1&pageSize=100");
export const createSale=(body:any)=>apiRequest<any>("/pharmacy/sales",{method:"POST",body});

export type PrescriptionQueueItem={id:string;source?:"OPD"|"IPD";prescriptionId?:string|null;ipdAdmissionId?:string|null;createdAt:string;status:string;visit:{id:string;visitNumber:string;visitDate:string};patient:{id:string;uhid?:string|null;firstName?:string|null;middleName?:string|null;lastName?:string|null;primaryMobile?:string|null};doctor:{id:string;doctorCode:string;specialization:string;title?:string|null;firstName?:string|null;middleName?:string|null;lastName?:string|null;employee?:{firstName?:string|null;middleName?:string|null;lastName?:string|null}|null};department?:{departmentName?:string|null}|null;items:Array<{id:string;medicineId?:string|null;medicineName:string;dosage?:string|null;frequency?:string|null;durationDays?:number|null;prescribedQuantity?:string|number|null;instructions?:string|null;medicine?:{id:string;medicineCode:string;brandName:string;genericName?:string|null;strength?:string|null;dosageForm?:string|null;totalAvailable:number;batches:Array<{id:string;batchNumber:string;expiryDate:string;availableQuantity:string|number;sellingPrice:string|number;rackLocation?:string|null}>}|null}>};
export const listPrescriptionQueue=(branchId?:string)=>apiRequest<PrescriptionQueueItem[]>(`/pharmacy/prescription-queue${branchId?`?branchId=${branchId}`:""}`);
export const dispensePrescription=(body:any)=>apiRequest<any>("/pharmacy/dispenses",{method:"POST",body});
