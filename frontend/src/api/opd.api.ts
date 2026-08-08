import { apiRequest } from "./http";

export type OpdVisit = {
  id: string; visitNumber: string; visitDate: string; visitType: string; status: string;
  chiefComplaint?: string | null; notes?: string | null;
  patient: { id:string; uhid?:string|null; firstName?:string|null; middleName?:string|null; lastName?:string|null; mobile?:string|null; };
  doctor: { id:string; doctorCode:string; specialization:string; title?:string|null; firstName?:string|null; middleName?:string|null; lastName?:string|null; employee?:{firstName?:string|null;middleName?:string|null;lastName?:string|null}|null; };
  department?: { id:string; departmentName:string } | null;
  vitals?: any[]; consultation?: any; diagnoses?: any[]; prescription?: any; orders?: any[]; followUps?: any[];
};
type Paged<T>={items:T[];pagination:{page:number;pageSize:number;total:number;totalPages:number}};
const unwrap=<T,>(v:any):T => v && typeof v==="object" && "data" in v ? v.data as T : v as T;
const qs=(x:Record<string,string|number|undefined>)=>{const p=new URLSearchParams();Object.entries(x).forEach(([k,v])=>{if(v!==undefined&&String(v).trim())p.set(k,String(v))});const s=p.toString();return s?`?${s}`:"";};

export async function listOpdVisits(input:{status?:string;patientId?:string;doctorId?:string;page?:number;pageSize?:number}={}) {
  return unwrap<Paged<OpdVisit>>(await apiRequest<unknown>(`/opd${qs({...input,page:input.page??1,pageSize:input.pageSize??100})}`));
}
export async function getOpdVisit(id:string){return unwrap<OpdVisit>(await apiRequest<unknown>(`/opd/${id}`));}
export async function addOpdVitals(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/vitals`,{method:"POST",body:input}));}
export async function saveOpdConsultation(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/consultation`,{method:"PUT",body:input}));}
export async function addOpdDiagnosis(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/diagnoses`,{method:"POST",body:input}));}
export async function createOpdPrescription(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/prescription`,{method:"POST",body:input}));}
export async function addOpdOrder(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/orders`,{method:"POST",body:input}));}
export async function addOpdFollowUp(id:string,input:Record<string,unknown>){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/follow-ups`,{method:"POST",body:input}));}
export async function completeOpdVisit(id:string){return unwrap<any>(await apiRequest<unknown>(`/opd/${id}/complete`,{method:"POST"}));}

export type PrescriptionMedicineSearchResult = {
  id:string; medicineCode:string; brandName:string; genericName?:string|null; strength?:string|null;
  dosageForm?:string|null; manufacturer?:string|null; sellingPrice?:string|number|null; totalAvailable:number;
  batches:Array<{id:string;batchNumber:string;expiryDate:string;availableQuantity:string|number;sellingPrice:string|number;rackLocation?:string|null}>;
};
export async function searchPrescriptionMedicines(q:string,branchId?:string){
  return unwrap<PrescriptionMedicineSearchResult[]>(await apiRequest<unknown>(`/opd/medicine-search${qs({q,branchId})}`));
}
