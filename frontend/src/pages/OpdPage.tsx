import { FormEvent, useEffect, useMemo, useState } from "react";
import * as opd from "../api/opd.api";
import type { OpdVisit } from "../api/opd.api";
import "../styles/opd.css";

const pname=(v?:OpdVisit|null)=>[v?.patient?.firstName,v?.patient?.middleName,v?.patient?.lastName].filter(Boolean).join(" ")||"Patient";
const dname=(v?:OpdVisit|null)=>{const d=v?.doctor;return [d?.title,d?.employee?.firstName??d?.firstName,d?.employee?.middleName??d?.middleName,d?.employee?.lastName??d?.lastName].filter(Boolean).join(" ")||d?.doctorCode||"Doctor";};
const value=(f:HTMLFormElement,n:string)=>String(new FormData(f).get(n)??"").trim();
const number=(f:HTMLFormElement,n:string)=>{const v=value(f,n);return v?Number(v):null};

export default function OpdPage(){
 const [visits,setVisits]=useState<OpdVisit[]>([]),[selected,setSelected]=useState<OpdVisit|null>(null);
 const [tab,setTab]=useState("overview"),[search,setSearch]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const load=async(id?:string)=>{try{const r=await opd.listOpdVisits();setVisits(r.items??[]);const pick=id??selected?.id??r.items?.[0]?.id;if(pick)setSelected(await opd.getOpdVisit(pick));else setSelected(null)}catch(e:any){setMessage(e?.message??"Unable to load OPD")}};
 useEffect(()=>{void load()},[]);
 const shown=useMemo(()=>visits.filter(v=>`${v.visitNumber} ${pname(v)} ${v.patient?.uhid??""} ${dname(v)} ${v.status}`.toLowerCase().includes(search.toLowerCase())),[visits,search]);
 const run=async(fn:()=>Promise<any>,ok:string)=>{if(!selected)return;setBusy(true);setMessage("");try{await fn();setMessage(ok);await load(selected.id)}catch(e:any){setMessage(e?.message??"Unable to save")}finally{setBusy(false)}};
 return <div className="opd-page">
  <header className="opd-hero"><div><span>CLINICAL WORKSPACE</span><h1>OPD</h1><p>Queue, vitals, consultation, diagnosis, prescription, orders and follow-up.</p></div><strong>{visits.length}<small>Visits</small></strong></header>
  {message&&<div className="opd-message">{message}</div>}
  <div className="opd-layout">
   <aside className="opd-queue"><div className="opd-head"><div><span>TODAY</span><h2>OPD Queue</h2></div><button onClick={()=>void load()}>Refresh</button></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search UHID, patient or doctor"/>
    <div className="opd-list">{shown.map(v=><button key={v.id} className={selected?.id===v.id?"active":""} onClick={async()=>{setSelected(await opd.getOpdVisit(v.id));setTab("overview")}}><strong>{pname(v)}</strong><span>{v.patient?.uhid??v.visitNumber}</span><small>{dname(v)} · {v.status.replaceAll("_"," ")}</small></button>)}</div>
   </aside>
   <main className="opd-work">
    {!selected?<div className="opd-empty">No OPD visit selected.</div>:<>
     <section className="opd-patient"><div className="opd-avatar">{pname(selected)[0]}</div><div><span>{selected.visitNumber}</span><h2>{pname(selected)}</h2><p>{selected.patient?.uhid??"UHID unavailable"} · {selected.patient?.mobile??"No mobile"}</p></div><div><span>Doctor</span><strong>{dname(selected)}</strong><small>{selected.doctor.specialization}</small></div><b>{selected.status.replaceAll("_"," ")}</b></section>
     <nav className="opd-tabs">{["overview","vitals","consultation","diagnosis","prescription","orders","followup"].map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x === "followup" ? "Follow-up" : x.charAt(0).toUpperCase() + x.slice(1)}</button>)}</nav>
     {tab==="overview"&&<section className="opd-panel"><h3>Visit Overview</h3><div className="opd-info"><Card l="Visit type" v={selected.visitType}/><Card l="Department" v={selected.department?.departmentName??"—"}/><Card l="Chief complaint" v={selected.chiefComplaint??"Not recorded"}/><Card l="Vitals" v={selected.vitals?.length?"Recorded":"Pending"}/><Card l="Diagnoses" v={`${selected.diagnoses?.length??0}`}/><Card l="Orders" v={`${selected.orders?.length??0}`}/></div><div className="opd-actions"><button onClick={()=>setTab("vitals")}>Record Vitals</button><button onClick={()=>setTab("consultation")}>Consultation</button><button className="secondary" disabled={busy||selected.status==="COMPLETED"} onClick={()=>void run(()=>opd.completeOpdVisit(selected.id),"OPD visit completed")}>Complete Visit</button></div></section>}
     {tab==="vitals"&&<Vitals disabled={busy} save={x=>run(()=>opd.addOpdVitals(selected.id,x),"Vitals recorded")}/>}
     {tab==="consultation"&&<Consult disabled={busy} initial={selected.consultation} save={x=>run(()=>opd.saveOpdConsultation(selected.id,x),"Consultation saved")}/>}
     {tab==="diagnosis"&&<Diagnosis disabled={busy} rows={selected.diagnoses??[]} save={x=>run(()=>opd.addOpdDiagnosis(selected.id,x),"Diagnosis added")}/>}
     {tab==="prescription"&&<Prescription disabled={busy} rows={selected.prescription?.items??[]} save={x=>run(()=>opd.createOpdPrescription(selected.id,x),"Prescription saved")}/>}
     {tab==="orders"&&<Orders disabled={busy} rows={selected.orders??[]} save={x=>run(()=>opd.addOpdOrder(selected.id,x),"Order added")}/>}
     {tab==="followup"&&<Follow disabled={busy} rows={selected.followUps??[]} save={x=>run(()=>opd.addOpdFollowUp(selected.id,x),"Follow-up added")}/>}
    </>}
   </main>
  </div>
 </div>
}
function Card({l,v}:{l:string;v:string}){return <div><span>{l}</span><strong>{v}</strong></div>}
function Records({rows,label}:{rows:any[];label:(x:any)=>string}){return rows.length?<div className="opd-records">{rows.map((x,i)=><span key={x.id??i}>{label(x)}</span>)}</div>:null}
function Vitals({save,disabled}:{save:(x:any)=>void;disabled:boolean}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({temperatureCelsius:number(f,"temperatureCelsius"),pulseRate:number(f,"pulseRate"),systolicBp:number(f,"systolicBp"),diastolicBp:number(f,"diastolicBp"),spo2:number(f,"spo2"),heightCm:number(f,"heightCm"),weightKg:number(f,"weightKg"),notes:value(f,"notes")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Vitals & Pre-consultation</h3><div className="opd-form">{[["temperatureCelsius","Temperature °C"],["pulseRate","Pulse / min"],["systolicBp","Systolic BP"],["diastolicBp","Diastolic BP"],["spo2","SpO₂ %"],["heightCm","Height cm"],["weightKg","Weight kg"]].map(([n,l])=><label key={n}><span>{l}</span><input name={n} type="number" step="any"/></label>)}</div><label><span>Notes</span><textarea name="notes"/></label><button disabled={disabled}>Save Vitals</button></form>}
function Consult({save,disabled,initial}:{save:(x:any)=>void;disabled:boolean;initial:any}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({status:value(f,"status"),history:value(f,"history")||null,examinationNotes:value(f,"examinationNotes")||null,clinicalNotes:value(f,"clinicalNotes")||null,advice:value(f,"advice")||null,doctorNotes:value(f,"doctorNotes")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Doctor Consultation</h3><label><span>Status</span><select name="status" defaultValue={initial?.status??"IN_PROGRESS"}><option>IN_PROGRESS</option><option>COMPLETED</option></select></label>{([
  ["history", "History / symptoms"],
  ["examinationNotes", "Examination"],
  ["clinicalNotes", "Clinical notes"],
  ["advice", "Advice"],
  ["doctorNotes", "Doctor notes"],
] as const).map(([n, l]) => (
  <label key={n}>
    <span>{l}</span>
    <textarea name={n} defaultValue={initial?.[n] ?? ""} />
  </label>
))}<button disabled={disabled}>Save Consultation</button></form>}
function Diagnosis({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({diagnosisType:value(f,"diagnosisType"),diagnosisCode:value(f,"diagnosisCode")||null,diagnosisName:value(f,"diagnosisName"),description:value(f,"description")||null,isPrimary:new FormData(f).get("isPrimary")==="on"})};return <form className="opd-panel" onSubmit={submit}><h3>Diagnosis</h3><Records rows={rows} label={x=>x.diagnosisName}/><div className="opd-form"><label><span>Type</span><select name="diagnosisType"><option>PROVISIONAL</option><option>FINAL</option><option>DIFFERENTIAL</option></select></label><label><span>Code</span><input name="diagnosisCode"/></label><label className="wide"><span>Diagnosis *</span><input required name="diagnosisName"/></label></div><label><span>Description</span><textarea name="description"/></label><label className="check"><input type="checkbox" name="isPrimary"/> Primary diagnosis</label><button disabled={disabled}>Add Diagnosis</button></form>}
function Prescription({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({notes:value(f,"notes")||null,items:[{medicineName:value(f,"medicineName"),dosage:value(f,"dosage")||null,frequency:value(f,"frequency")||null,durationDays:number(f,"durationDays"),instructions:value(f,"instructions")||null}]})};return <form className="opd-panel" onSubmit={submit}><h3>Prescription</h3><Records rows={rows} label={x=>`${x.medicineName}${x.dosage?` · ${x.dosage}`:""}`}/><div className="opd-form"><label className="wide"><span>Medicine *</span><input required name="medicineName"/></label><label><span>Dosage</span><input name="dosage"/></label><label><span>Frequency</span><input name="frequency" placeholder="1-0-1"/></label><label><span>Duration days</span><input name="durationDays" type="number"/></label><label><span>Instructions</span><input name="instructions"/></label></div><label><span>Notes</span><textarea name="notes"/></label><button disabled={disabled}>Add Medicine</button></form>}
function Orders({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({orderType:value(f,"orderType"),orderName:value(f,"orderName"),priority:value(f,"priority"),instructions:value(f,"instructions")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Clinical Orders</h3><Records rows={rows} label={x=>`${x.orderType} · ${x.orderName}`}/><div className="opd-form"><label><span>Type</span><select name="orderType"><option>LABORATORY</option><option>RADIOLOGY</option><option>PROCEDURE</option><option>OTHER</option></select></label><label><span>Priority</span><select name="priority"><option>NORMAL</option><option>URGENT</option><option>EMERGENCY</option></select></label><label className="wide"><span>Test / procedure *</span><input required name="orderName"/></label></div><label><span>Instructions</span><textarea name="instructions"/></label><button disabled={disabled}>Create Order</button></form>}
function Follow({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({followUpDate:value(f,"followUpDate"),reason:value(f,"reason")||null,notes:value(f,"notes")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Follow-up</h3><Records rows={rows} label={x=>`${String(x.followUpDate??"").slice(0,10)} · ${x.reason??"Follow-up"}`}/><div className="opd-form"><label><span>Date *</span><input required type="date" name="followUpDate"/></label><label><span>Reason</span><input name="reason"/></label></div><label><span>Notes</span><textarea name="notes"/></label><button disabled={disabled}>Add Follow-up</button></form>}
