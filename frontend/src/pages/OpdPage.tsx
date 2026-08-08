import { FormEvent, useEffect, useMemo, useState } from "react";
import * as opd from "../api/opd.api";
import type { OpdVisit } from "../api/opd.api";
import "../styles/opd.css";

const pname=(v?:OpdVisit|null)=>[v?.patient?.firstName,v?.patient?.middleName,v?.patient?.lastName].filter(Boolean).join(" ")||"Patient";
const dname=(v?:OpdVisit|null)=>{const d=v?.doctor;return [d?.title,d?.employee?.firstName??d?.firstName,d?.employee?.middleName??d?.middleName,d?.employee?.lastName??d?.lastName].filter(Boolean).join(" ")||d?.doctorCode||"Doctor";};
const value=(f:HTMLFormElement,n:string)=>String(new FormData(f).get(n)??"").trim();
const number=(f:HTMLFormElement,n:string)=>{const v=value(f,n);return v?Number(v):null};

type OpdStage = {
  key: string;
  label: string;
  shortLabel: string;
};

const OPD_STAGES: OpdStage[] = [
  { key: "CHECKED_IN", label: "Checked In", shortLabel: "Checked In" },
  { key: "VITALS", label: "Vitals / Pre-consultation", shortLabel: "Vitals" },
  { key: "READY", label: "Ready for Doctor", shortLabel: "Ready" },
  { key: "CONSULTATION", label: "Doctor Consultation", shortLabel: "Consultation" },
  { key: "COMPLETED", label: "Consultation Completed", shortLabel: "Completed" },
];

function opdStageIndex(status?: string): number {
  switch (String(status ?? "").toUpperCase()) {
    case "WAITING":
      return 2;
    case "IN_CONSULTATION":
      return 3;
    case "COMPLETED":
      return 4;
    case "CANCELLED":
      return 0;
    case "REGISTERED":
    default:
      return 1;
  }
}

function opdStageLabel(status?: string): string {
  switch (String(status ?? "").toUpperCase()) {
    case "REGISTERED":
      return "Awaiting Vitals";
    case "WAITING":
      return "Ready for Doctor";
    case "IN_CONSULTATION":
      return "With Doctor";
    case "COMPLETED":
      return "Consultation Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return String(status ?? "Registered").replaceAll("_", " ");
  }
}

function OpdJourney({ status }: { status?: string }) {
  const activeIndex = opdStageIndex(status);
  const cancelled = String(status ?? "").toUpperCase() === "CANCELLED";

  return (
    <section className="opd-journey" aria-label="Patient OPD journey">
      <div className="opd-journey-head">
        <div>
          <span>PATIENT JOURNEY</span>
          <strong>{opdStageLabel(status)}</strong>
        </div>
        <span className={`opd-live-stage stage-${String(status ?? "REGISTERED").toLowerCase()}`}>
          {cancelled ? "CANCELLED" : "LIVE"}
        </span>
      </div>

      <div className="opd-journey-track">
        {OPD_STAGES.map((stage, index) => {
          const complete = !cancelled && index < activeIndex;
          const current = !cancelled && index === activeIndex;

          return (
            <div
              key={stage.key}
              className={`opd-journey-step ${complete ? "done" : ""} ${current ? "current" : ""}`}
            >
              <div className="opd-step-marker">
                {complete ? "✓" : index + 1}
              </div>
              <div className="opd-step-copy">
                <strong>{stage.shortLabel}</strong>
                <span>{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

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
    <div className="opd-list">{shown.map(v=><button key={v.id} className={selected?.id===v.id?"active":""} onClick={async()=>{setSelected(await opd.getOpdVisit(v.id));setTab("overview")}}><strong>{pname(v)}</strong><span>{v.patient?.uhid??v.visitNumber}</span><small>{dname(v)} · <b className={`opd-queue-stage stage-${String(v.status).toLowerCase()}`}>{opdStageLabel(v.status)}</b></small></button>)}</div>
   </aside>
   <main className="opd-work">
    {!selected?<div className="opd-empty">No OPD visit selected.</div>:<>
     <section className="opd-patient"><div className="opd-avatar">{pname(selected)[0]}</div><div><span>{selected.visitNumber}</span><h2>{pname(selected)}</h2><p>{selected.patient?.uhid??"UHID unavailable"} · {selected.patient?.mobile??"No mobile"}</p></div><div><span>Doctor</span><strong>{dname(selected)}</strong><small>{selected.doctor.specialization}</small></div><b className={`stage-${String(selected.status).toLowerCase()}`}>{opdStageLabel(selected.status)}</b></section>
     <OpdJourney status={selected.status} />
     <nav className="opd-tabs">{["overview","vitals","consultation","diagnosis","prescription","orders","followup"].map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x === "followup" ? "Follow-up" : x.charAt(0).toUpperCase() + x.slice(1)}</button>)}</nav>
     {tab==="overview"&&<section className="opd-panel"><div className="opd-panel-title"><div><span>LIVE CLINICAL STATUS</span><h3>Visit Overview</h3></div><strong>{opdStageLabel(selected.status)}</strong></div><div className="opd-info"><Card l="Visit type" v={selected.visitType}/><Card l="Department" v={selected.department?.departmentName??"—"}/><Card l="Chief complaint" v={selected.chiefComplaint??"Not recorded"}/><Card l="Vitals" v={selected.vitals?.length?`Completed · ${selected.vitals.length} record${selected.vitals.length===1?"":"s"}`:"Pending"}/><Card l="Diagnoses" v={`${selected.diagnoses?.length??0} recorded`}/><Card l="Orders" v={`${selected.orders?.length??0} ordered`}/></div><div className="opd-actions"><button onClick={()=>setTab("vitals")}>{selected.vitals?.length?"View / Retake Vitals":"Complete Vitals"}</button><button onClick={()=>setTab("consultation")} disabled={!selected.vitals?.length && selected.status==="REGISTERED"}>{selected.status==="IN_CONSULTATION"?"Continue Consultation":"Open Consultation"}</button><button className="secondary" disabled={busy||selected.status==="COMPLETED"} onClick={()=>void run(()=>opd.completeOpdVisit(selected.id),"OPD visit completed")}>Complete Visit</button></div>{!selected.vitals?.length&&selected.status==="REGISTERED"&&<div className="opd-next-action"><span>NEXT STEP</span><strong>Complete vitals to move the patient to “Ready for Doctor”.</strong></div>}</section>}
     {tab==="vitals"&&<Vitals rows={selected.vitals??[]} disabled={busy} save={async x=>{setBusy(true);setMessage("");try{await opd.addOpdVitals(selected.id,x);setMessage("Vitals completed. Patient is now Ready for Doctor.");await load(selected.id);setTab("consultation")}catch(e:any){setMessage(e?.message??"Unable to save vitals")}finally{setBusy(false)}}}/>}
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
type VitalRecord = Record<string, any>;

function vitalDateValue(record: VitalRecord): string {
  return String(
    record.recordedAt ??
      record.createdAt ??
      record.created_at ??
      record.updatedAt ??
      record.updated_at ??
      "",
  );
}

function vitalDateLabel(record: VitalRecord): string {
  const raw = vitalDateValue(record);
  if (!raw) return "Recorded vital";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vitalNumber(record: VitalRecord | null, ...keys: string[]): number | null {
  if (!record) return null;
  for (const key of keys) {
    const raw = record[key];
    if (raw !== null && raw !== undefined && raw !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function vitalText(record: VitalRecord | null, ...keys: string[]): string {
  if (!record) return "";
  for (const key of keys) {
    const raw = record[key];
    if (raw !== null && raw !== undefined && String(raw).trim()) {
      return String(raw);
    }
  }
  return "";
}

function fahrenheitFromCelsius(value: number | null): string {
  if (value === null) return "";
  return ((value * 9) / 5 + 32).toFixed(1);
}

function VitalDetailModal({
  record,
  onClose,
}: {
  record: VitalRecord;
  onClose: () => void;
}) {
  const tempC = vitalNumber(
    record,
    "temperatureCelsius",
    "temperature_celsius",
  );
  const pulse = vitalNumber(record, "pulseRate", "pulse_rate");
  const systolic = vitalNumber(record, "systolicBp", "systolic_bp");
  const diastolic = vitalNumber(record, "diastolicBp", "diastolic_bp");
  const spo2 = vitalNumber(record, "spo2", "spO2");
  const height = vitalNumber(record, "heightCm", "height_cm");
  const weight = vitalNumber(record, "weightKg", "weight_kg");
  const bmi = vitalNumber(record, "bmi");
  const notes = vitalText(record, "notes");

  return (
    <div className="opd-vital-overlay" onMouseDown={onClose}>
      <section
        className="opd-vital-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Vital record details"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="opd-vital-modal-head">
          <div>
            <span>VITAL RECORD</span>
            <h3>{vitalDateLabel(record)}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="opd-vital-detail-grid">
          <Card
            l="Temperature"
            v={
              tempC === null
                ? "—"
                : `${fahrenheitFromCelsius(tempC)} °F / ${tempC.toFixed(1)} °C`
            }
          />
          <Card l="Pulse" v={pulse === null ? "—" : `${pulse} / min`} />
          <Card
            l="Blood pressure"
            v={
              systolic === null && diastolic === null
                ? "—"
                : `${systolic ?? "—"} / ${diastolic ?? "—"} mmHg`
            }
          />
          <Card l="SpO₂" v={spo2 === null ? "—" : `${spo2}%`} />
          <Card l="Height" v={height === null ? "—" : `${height} cm`} />
          <Card l="Weight" v={weight === null ? "—" : `${weight} kg`} />
          <Card l="BMI" v={bmi === null ? "—" : bmi.toFixed(1)} />
        </div>

        {notes && (
          <div className="opd-vital-notes">
            <span>Notes</span>
            <p>{notes}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Vitals({
  save,
  disabled,
  rows,
}: {
  save: (x: any) => void;
  disabled: boolean;
  rows: VitalRecord[];
}) {
  const sortedRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        const a = new Date(vitalDateValue(left)).getTime();
        const b = new Date(vitalDateValue(right)).getTime();
        return (Number.isFinite(b) ? b : 0) - (Number.isFinite(a) ? a : 0);
      }),
    [rows],
  );

  const latest = sortedRows[0] ?? null;
  const history = sortedRows.slice(1);
  const [selectedHistory, setSelectedHistory] = useState<VitalRecord | null>(
    null,
  );
  const [temperatureUnit, setTemperatureUnit] = useState<"F" | "C">("F");
  const [validationError, setValidationError] = useState("");

  const latestTempC = vitalNumber(
    latest,
    "temperatureCelsius",
    "temperature_celsius",
  );

  const latestKey = latest
    ? String(latest.id ?? vitalDateValue(latest) ?? "latest")
    : "new";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    setValidationError("");

    const enteredTemperature = number(f, "temperature");
    let temperatureCelsius: number | null = null;

    if (enteredTemperature !== null) {
      temperatureCelsius =
        temperatureUnit === "F"
          ? Number((((enteredTemperature - 32) * 5) / 9).toFixed(2))
          : enteredTemperature;

      if (temperatureCelsius < 20 || temperatureCelsius > 50) {
        setValidationError(
          temperatureUnit === "F"
            ? "Temperature must be between 68°F and 122°F."
            : "Temperature must be between 20°C and 50°C.",
        );
        return;
      }
    }

    const pulseRate = number(f, "pulseRate");
    const systolicBp = number(f, "systolicBp");
    const diastolicBp = number(f, "diastolicBp");
    const spo2 = number(f, "spo2");
    const heightCm = number(f, "heightCm");
    const weightKg = number(f, "weightKg");

    if (pulseRate !== null && (pulseRate < 20 || pulseRate > 250)) {
      setValidationError("Pulse must be between 20 and 250 per minute.");
      return;
    }
    if (systolicBp !== null && (systolicBp < 40 || systolicBp > 300)) {
      setValidationError("Systolic BP must be between 40 and 300.");
      return;
    }
    if (diastolicBp !== null && (diastolicBp < 20 || diastolicBp > 200)) {
      setValidationError("Diastolic BP must be between 20 and 200.");
      return;
    }
    if (spo2 !== null && (spo2 < 0 || spo2 > 100)) {
      setValidationError("SpO₂ must be between 0 and 100%.");
      return;
    }
    if (heightCm !== null && (heightCm < 20 || heightCm > 300)) {
      setValidationError("Height must be between 20 and 300 cm.");
      return;
    }
    if (weightKg !== null && (weightKg < 0.5 || weightKg > 1000)) {
      setValidationError("Weight must be between 0.5 and 1000 kg.");
      return;
    }

    save({
      temperatureCelsius,
      pulseRate,
      systolicBp,
      diastolicBp,
      spo2,
      heightCm,
      weightKg,
      notes: value(f, "notes") || null,
    });
  };

  const latestTemperature =
    temperatureUnit === "F"
      ? fahrenheitFromCelsius(latestTempC)
      : latestTempC === null
        ? ""
        : latestTempC.toFixed(1);

  return (
    <>
      <form className="opd-panel" onSubmit={submit} key={latestKey}>
        <div className="opd-vital-section-head">
          <div>
            <h3>Vitals & Pre-consultation</h3>
            <p>
              {latest
                ? `Latest vitals recorded ${vitalDateLabel(latest)}`
                : "No vitals recorded yet. Enter the patient's first vital record."}
            </p>
          </div>
          {latest && <span className="opd-vital-latest-badge">LATEST</span>}
        </div>

        {history.length > 0 && (
          <div className="opd-vital-history">
            <div className="opd-vital-history-head">
              <strong>Previous vital records</strong>
              <span>Click a date to view the complete record</span>
            </div>
            <div className="opd-vital-history-list">
              {history.map((record, index) => (
                <button
                  type="button"
                  key={String(record.id ?? `${vitalDateValue(record)}-${index}`)}
                  onClick={() => setSelectedHistory(record)}
                >
                  <span>{vitalDateLabel(record)}</span>
                  <small>View vitals</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {validationError && (
          <div className="opd-message">{validationError}</div>
        )}

        <div className="opd-form">
          <label>
            <span>Temperature</span>
            <input
              name="temperature"
              type="number"
              step="0.1"
              min={temperatureUnit === "F" ? 68 : 20}
              max={temperatureUnit === "F" ? 122 : 50}
              defaultValue={latestTemperature}
              placeholder={temperatureUnit === "F" ? "98.6" : "37.0"}
            />
          </label>

          <label>
            <span>Temperature unit</span>
            <select
              value={temperatureUnit}
              onChange={(event) =>
                setTemperatureUnit(event.target.value as "F" | "C")
              }
            >
              <option value="F">°F Fahrenheit</option>
              <option value="C">°C Celsius</option>
            </select>
          </label>

          <label>
            <span>Pulse / min</span>
            <input
              name="pulseRate"
              type="number"
              min="20"
              max="250"
              defaultValue={
                vitalNumber(latest, "pulseRate", "pulse_rate") ?? ""
              }
            />
          </label>

          <label>
            <span>Systolic BP</span>
            <input
              name="systolicBp"
              type="number"
              min="40"
              max="300"
              defaultValue={
                vitalNumber(latest, "systolicBp", "systolic_bp") ?? ""
              }
            />
          </label>

          <label>
            <span>Diastolic BP</span>
            <input
              name="diastolicBp"
              type="number"
              min="20"
              max="200"
              defaultValue={
                vitalNumber(latest, "diastolicBp", "diastolic_bp") ?? ""
              }
            />
          </label>

          <label>
            <span>SpO₂ %</span>
            <input
              name="spo2"
              type="number"
              min="0"
              max="100"
              defaultValue={vitalNumber(latest, "spo2", "spO2") ?? ""}
            />
          </label>

          <label>
            <span>Height cm</span>
            <input
              name="heightCm"
              type="number"
              step="0.1"
              min="20"
              max="300"
              defaultValue={
                vitalNumber(latest, "heightCm", "height_cm") ?? ""
              }
            />
          </label>

          <label>
            <span>Weight kg</span>
            <input
              name="weightKg"
              type="number"
              step="0.1"
              min="0.5"
              max="1000"
              defaultValue={
                vitalNumber(latest, "weightKg", "weight_kg") ?? ""
              }
            />
          </label>
        </div>

        <label>
          <span>Notes</span>
          <textarea
            name="notes"
            defaultValue={vitalText(latest, "notes")}
          />
        </label>

        <div className="opd-vital-save-row">
          {latest && (
            <span>
              Saving again creates a new vital record and preserves this one in
              history.
            </span>
          )}
          <button disabled={disabled}>
            {latest ? "Record Updated Vitals" : "Complete Vitals & Send to Doctor"}
          </button>
        </div>
      </form>

      {selectedHistory && (
        <VitalDetailModal
          record={selectedHistory}
          onClose={() => setSelectedHistory(null)}
        />
      )}
    </>
  );
}

function Consult({save,disabled,initial}:{save:(x:any)=>void;disabled:boolean;initial:any}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({status:value(f,"status"),history:value(f,"history")||null,examinationNotes:value(f,"examinationNotes")||null,clinicalNotes:value(f,"clinicalNotes")||null,advice:value(f,"advice")||null,doctorNotes:value(f,"doctorNotes")||null})};return <form className="opd-panel" onSubmit={submit}><div className="opd-consult-head"><div><span>DOCTOR WORKSPACE</span><h3>Doctor Consultation</h3></div><label><span>Consultation status</span><select name="status" defaultValue={initial?.status??"IN_PROGRESS"}><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></label></div>{([
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
))}<div className="opd-consult-footer"><span>Select “Completed” when the doctor has finished the consultation.</span><button disabled={disabled}>Save Consultation Status</button></div></form>}
function Diagnosis({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({diagnosisType:value(f,"diagnosisType"),diagnosisCode:value(f,"diagnosisCode")||null,diagnosisName:value(f,"diagnosisName"),description:value(f,"description")||null,isPrimary:new FormData(f).get("isPrimary")==="on"})};return <form className="opd-panel" onSubmit={submit}><h3>Diagnosis</h3><Records rows={rows} label={x=>x.diagnosisName}/><div className="opd-form"><label><span>Type</span><select name="diagnosisType"><option>PROVISIONAL</option><option>FINAL</option><option>DIFFERENTIAL</option></select></label><label><span>Code</span><input name="diagnosisCode"/></label><label className="wide"><span>Diagnosis *</span><input required name="diagnosisName"/></label></div><label><span>Description</span><textarea name="description"/></label><label className="check"><input type="checkbox" name="isPrimary"/> Primary diagnosis</label><button disabled={disabled}>Add Diagnosis</button></form>}
function Prescription({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({notes:value(f,"notes")||null,items:[{medicineName:value(f,"medicineName"),dosage:value(f,"dosage")||null,frequency:value(f,"frequency")||null,durationDays:number(f,"durationDays"),instructions:value(f,"instructions")||null}]})};return <form className="opd-panel" onSubmit={submit}><h3>Prescription</h3><Records rows={rows} label={x=>`${x.medicineName}${x.dosage?` · ${x.dosage}`:""}`}/><div className="opd-form"><label className="wide"><span>Medicine *</span><input required name="medicineName"/></label><label><span>Dosage</span><input name="dosage"/></label><label><span>Frequency</span><input name="frequency" placeholder="1-0-1"/></label><label><span>Duration days</span><input name="durationDays" type="number"/></label><label><span>Instructions</span><input name="instructions"/></label></div><label><span>Notes</span><textarea name="notes"/></label><button disabled={disabled}>Add Medicine</button></form>}
function Orders({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({orderType:value(f,"orderType"),orderName:value(f,"orderName"),priority:value(f,"priority"),instructions:value(f,"instructions")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Clinical Orders</h3><Records rows={rows} label={x=>`${x.orderType} · ${x.orderName}`}/><div className="opd-form"><label><span>Type</span><select name="orderType"><option>LABORATORY</option><option>RADIOLOGY</option><option>PROCEDURE</option><option>OTHER</option></select></label><label><span>Priority</span><select name="priority"><option>NORMAL</option><option>URGENT</option><option>EMERGENCY</option></select></label><label className="wide"><span>Test / procedure *</span><input required name="orderName"/></label></div><label><span>Instructions</span><textarea name="instructions"/></label><button disabled={disabled}>Create Order</button></form>}
function Follow({save,disabled,rows}:{save:(x:any)=>void;disabled:boolean;rows:any[]}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;save({followUpDate:value(f,"followUpDate"),reason:value(f,"reason")||null,notes:value(f,"notes")||null})};return <form className="opd-panel" onSubmit={submit}><h3>Follow-up</h3><Records rows={rows} label={x=>`${String(x.followUpDate??"").slice(0,10)} · ${x.reason??"Follow-up"}`}/><div className="opd-form"><label><span>Date *</span><input required type="date" name="followUpDate"/></label><label><span>Reason</span><input name="reason"/></label></div><label><span>Notes</span><textarea name="notes"/></label><button disabled={disabled}>Add Follow-up</button></form>}
