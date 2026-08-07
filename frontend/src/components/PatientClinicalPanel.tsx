import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  acknowledgeAlert,
  archiveClinicalResource,
  createAlert,
  createClinicalResource,
  listAlerts,
  listClinicalResource,
  listFamily,
  listIdentifiers,
  listTimeline,
  type ClinicalResource,
} from "../api/patients.api";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "./Alert";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { StatusBadge } from "./StatusBadge";
import { ApiClientError } from "../types/api";
import type { ClinicalRecord } from "../types/patient";

type Panel =
  | ClinicalResource
  | "alerts"
  | "family"
  | "identifiers"
  | "timeline";

const config: Record<Panel, { title: string; description: string }> = {
  insurances: { title: "Insurance", description: "Policies, TPA and coverage information." },
  allergies: { title: "Allergies", description: "Known allergies and reactions." },
  "chronic-diseases": { title: "Chronic diseases", description: "Long-term diseases and treatment status." },
  "medical-history": { title: "Medical history", description: "Historical illnesses, procedures and events." },
  documents: { title: "Documents", description: "Patient document metadata and verification status." },
  alerts: { title: "Alerts", description: "Important patient safety and operational alerts." },
  family: { title: "Family", description: "Linked patient family relationships." },
  identifiers: { title: "Identifiers", description: "QR, barcode and external identifiers." },
  timeline: { title: "Timeline", description: "Chronological patient activity." },
};

function valueOf(record: ClinicalRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "—";
}

function AddResourceForm({
  panel,
  onSubmit,
}: {
  panel: Panel;
  onSubmit(input: Record<string, unknown>): Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const field = (name: string, label: string, required = false, type = "text") => (
    <label className={required ? "required" : ""}>
      <span>{label}</span>
      <input
        type={type}
        required={required}
        value={form[name] ?? ""}
        onChange={(e)=>setForm((current)=>({...current,[name]:e.target.value}))}
      />
    </label>
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const raw = Object.fromEntries(Object.entries(form).filter(([,value])=>value.trim() !== ""));
    const input: Record<string, unknown> = { ...raw };
    if (panel === "insurances") {
      input.preAuthRequired = false;
      input.isPrimary = false;
    }
    if (panel === "allergies") input.verified = false;
    if (panel === "documents") {
      input.confidential = false;
      input.verified = false;
    }
    if (panel === "alerts") {
      input.severity = form.severity || "INFO";
      input.active = true;
    }
    await onSubmit(input);
  }

  return (
    <form className="compact-form" onSubmit={submit}>
      {panel === "insurances" ? <>
        {field("providerName","Provider name",true)}
        {field("policyNumber","Policy number",true)}
        {field("memberId","Member ID")}
        {field("planName","Plan name")}
        {field("validTo","Valid to",false,"date")}
      </> : null}
      {panel === "allergies" ? <>
        {field("allergen","Allergen",true)}
        {field("allergyType","Allergy type")}
        {field("reaction","Reaction")}
        <label><span>Severity</span><select value={form.severity ?? ""} onChange={(e)=>setForm((c)=>({...c,severity:e.target.value}))}><option value="">Select</option><option>MILD</option><option>MODERATE</option><option>SEVERE</option></select></label>
      </> : null}
      {panel === "chronic-diseases" ? <>
        {field("diseaseName","Disease name",true)}
        {field("diagnosisDate","Diagnosis date",false,"date")}
        {field("diagnosingDoctor","Diagnosing doctor")}
        {field("controlStatus","Control status")}
      </> : null}
      {panel === "medical-history" ? <>
        {field("historyType","History type",true)}
        {field("title","Title",true)}
        {field("eventDate","Event date",false,"date")}
        {field("provider","Provider")}
      </> : null}
      {panel === "documents" ? <>
        {field("documentType","Document type",true)}
        {field("documentName","Document name",true)}
        {field("filePath","File path / URL",true)}
        {field("mimeType","MIME type")}
      </> : null}
      {panel === "alerts" ? <>
        {field("alertType","Alert type",true)}
        {field("title","Title",true)}
        {field("description","Description")}
        <label><span>Severity</span><select value={form.severity ?? "INFO"} onChange={(e)=>setForm((c)=>({...c,severity:e.target.value}))}><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select></label>
      </> : null}
      <button className="button button-primary">Save</button>
    </form>
  );
}

export function PatientClinicalPanel({
  patientId,
  panel,
}: {
  patientId: string;
  panel: Panel;
}) {
  const { can, hasRole } = useAuth();
  const editable = hasRole("SUPER_ADMIN") || can("patients.update");
  const deletable = hasRole("SUPER_ADMIN") || can("patients.delete");
  const [items, setItems] = useState<ClinicalRecord[]>([]);
  const [timelineTotal, setTimelineTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (panel === "alerts") setItems(await listAlerts(patientId));
      else if (panel === "family") setItems(await listFamily(patientId));
      else if (panel === "identifiers") setItems(await listIdentifiers(patientId));
      else if (panel === "timeline") {
        const result = await listTimeline(patientId);
        setItems(result.items);
        setTimelineTotal(result.pagination.total);
      } else setItems(await listClinicalResource(patientId, panel));
    } catch (value) {
      setError(value instanceof ApiClientError ? value.message : `${config[panel].title} could not be loaded`);
    } finally {
      setLoading(false);
    }
  }, [patientId, panel]);

  useEffect(() => void load(), [load]);

  async function add(input: Record<string, unknown>) {
    try {
      if (panel === "alerts") await createAlert(patientId, input);
      else if (
        panel !== "family" &&
        panel !== "identifiers" &&
        panel !== "timeline"
      ) {
        await createClinicalResource(patientId, panel, input);
      }
      setModal(false);
      await load();
    } catch (value) {
      setError(value instanceof ApiClientError ? value.message : "Record could not be saved");
    }
  }

  async function remove(id: string) {
    if (
      panel === "alerts" ||
      panel === "family" ||
      panel === "identifiers" ||
      panel === "timeline"
    ) return;
    if (!window.confirm("Archive this record?")) return;
    await archiveClinicalResource(patientId, panel, id);
    await load();
  }

  const addSupported = ["insurances","allergies","chronic-diseases","medical-history","documents","alerts"].includes(panel);

  return (
    <section className="profile-panel">
      <div className="section-heading">
        <div><h2>{config[panel].title}</h2><p>{config[panel].description}</p></div>
        {editable && addSupported ? <button className="button button-secondary" onClick={()=>setModal(true)}>＋ Add</button> : null}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <div className="page-loading compact"><Spinner label={`Loading ${config[panel].title.toLowerCase()}…`}/></div> :
        !items.length ? <EmptyState title={`No ${config[panel].title.toLowerCase()} recorded`} description="No records are currently available for this patient."/> :
        <div className="record-list">
          {items.map((item,index) => (
            <article className="record-card" key={item.id ?? String(index)}>
              <div className="record-card-main">
                <strong>{valueOf(item,["title","allergen","diseaseName","disease_name","providerName","provider_name","documentName","document_name","historyType","history_type","relationshipType","relationship_type","identifierValue","identifier_value","eventTitle","event_title","eventType","event_type"])}</strong>
                <p>{valueOf(item,["description","reaction","currentTreatment","current_treatment","policyNumber","policy_number","documentType","document_type","notes","displayValue","display_value"])}</p>
                <small>{valueOf(item,["createdAt","created_at","eventDate","event_date","diagnosisDate","diagnosis_date","issuedAt","issued_at"])}</small>
              </div>
              <div className="record-card-actions">
                {"severity" in item && item.severity ? <StatusBadge tone={String(item.severity)==="CRITICAL"?"danger":String(item.severity)==="WARNING"?"warning":"neutral"}>{String(item.severity)}</StatusBadge> : null}
                {panel === "alerts" && editable && !item.acknowledgedAt && !item.acknowledged_at ? <button className="text-button" onClick={()=>void acknowledgeAlert(patientId,item.id).then(load)}>Acknowledge</button> : null}
                {deletable && addSupported && panel !== "alerts" ? <button className="text-button danger-text" onClick={()=>void remove(item.id)}>Archive</button> : null}
              </div>
            </article>
          ))}
          {panel === "timeline" && timelineTotal !== null ? <p className="muted-copy">{timelineTotal} timeline events available.</p> : null}
        </div>
      }
      {modal ? (
        <Modal title={`Add ${config[panel].title}`} onClose={()=>setModal(false)}>
          <AddResourceForm panel={panel} onSubmit={add}/>
        </Modal>
      ) : null}
    </section>
  );
}
