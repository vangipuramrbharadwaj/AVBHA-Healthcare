import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  acknowledgeAlert,
  archiveClinicalResource,
  archiveFamilyRelationship,
  createAlert,
  createClinicalResource,
  createFamilyRelationship,
  listPatients,
  listAlerts,
  listClinicalResource,
  listFamily,
  listIdentifiers,
  listTimeline,
  updateFamilyRelationship,
  type ClinicalResource,
} from "../api/patients.api";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "./Alert";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { StatusBadge } from "./StatusBadge";
import { ApiClientError } from "../types/api";
import type { ClinicalRecord, Patient } from "../types/patient";

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
        onChange={(event) =>
          setForm((current) => ({ ...current, [name]: event.target.value }))
        }
      />
    </label>
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const raw = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value.trim() !== ""),
    );
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
        <label>
          <span>Severity</span>
          <select
            value={form.severity ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, severity: event.target.value }))
            }
          >
            <option value="">Select</option>
            <option>MILD</option>
            <option>MODERATE</option>
            <option>SEVERE</option>
          </select>
        </label>
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
        <label>
          <span>Severity</span>
          <select
            value={form.severity ?? "INFO"}
            onChange={(event) =>
              setForm((current) => ({ ...current, severity: event.target.value }))
            }
          >
            <option>INFO</option>
            <option>WARNING</option>
            <option>CRITICAL</option>
          </select>
        </label>
      </> : null}

      <button className="button button-primary">Save</button>
    </form>
  );
}

function patientName(patient: Patient) {
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

function FamilyForm({
  patientId,
  record,
  onSave,
}: {
  patientId: string;
  record?: ClinicalRecord;
  onSave(): Promise<void>;
}) {
  const related = record?.relatedPatient as Patient | undefined;
  const [search, setSearch] = useState(
    related ? `${related.uhid} · ${patientName(related)}` : "",
  );
  const [results, setResults] = useState<Patient[]>([]);
  const [relatedPersonMobile, setRelatedPersonMobile] = useState(
    String(record?.relatedPersonMobile ?? record?.related_person_mobile ?? ""),
  );
  const [selectedId, setSelectedId] = useState(
    related?.id ?? String(record?.relatedPatientId ?? record?.related_patient_id ?? ""),
  );
  const [relationshipType, setRelationshipType] = useState(
    String(record?.relationshipType ?? record?.relationship_type ?? ""),
  );
  const [isEmergencyContact, setEmergency] = useState(
    Boolean(record?.isEmergencyContact ?? record?.is_emergency_contact ?? false),
  );
  const [isPrimaryContact, setPrimary] = useState(
    Boolean(record?.isPrimaryContact ?? record?.is_primary_contact ?? false),
  );
  const [notes, setNotes] = useState(
    String(record?.notes ?? ""),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(record?.id);

  useEffect(() => {
    if (isEdit || search.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      listPatients({
        page: 1,
        pageSize: 10,
        search: search.trim(),
        status: "ACTIVE",
        sortBy: "firstName",
        sortOrder: "asc",
      })
        .then((result) =>
          setResults(
            result.items.filter((patient) => patient.id !== patientId),
          ),
        )
        .catch(() => setResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, isEdit, patientId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!relationshipType.trim()) {
      setError("Relationship type is required");
      return;
    }
    if (!isEdit && !selectedId && search.trim().length < 2) {
      setError("Select an existing patient or enter the family member name");
      return;
    }

    setSaving(true);
    try {
      const common = {
        relationshipType: relationshipType.trim(),
        isEmergencyContact,
        isPrimaryContact,
        notes: notes.trim() || null,
      };

      if (isEdit && record?.id) {
        await updateFamilyRelationship(patientId, record.id, common);
      } else {
        await createFamilyRelationship(patientId, {
          ...(selectedId
            ? { relatedPatientId: selectedId }
            : {
                relatedPersonName: search.trim(),
                ...(relatedPersonMobile.trim()
                  ? { relatedPersonMobile: relatedPersonMobile.trim() }
                  : {}),
              }),
          ...common,
        });
      }

      await onSave();
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Family relationship could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="family-form" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!isEdit ? (
        <label>
          <span>Find existing patient</span>
          <input
            required
            placeholder="Search existing patient or type family member name"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedId("");
            }}
          />
          {results.length ? (
            <div className="patient-search-results">
              {results.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  onClick={() => {
                    setSelectedId(patient.id);
                    setSearch(`${patient.uhid} · ${patientName(patient)}`);
                    setResults([]);
                  }}
                >
                  <strong>{patientName(patient)}</strong>
                  <small>{patient.uhid} · {patient.primaryMobile}</small>
                </button>
              ))}
            </div>
          ) : null}
          {!selectedId && search.trim().length >= 2 ? (
            <small className="muted-copy">
              No patient selection is required. This name will be saved as an unregistered family member.
            </small>
          ) : null}
        </label>
      ) : (
        <div className="selected-family-patient">
          <span>Related patient</span>
          <strong>
            {related ? `${related.uhid} · ${patientName(related)}` : "Existing linked patient"}
          </strong>
        </div>
      )}

      {!isEdit && !selectedId ? (
        <label>
          <span>Family member mobile (optional)</span>
          <input
            type="tel"
            placeholder="Mobile number"
            value={relatedPersonMobile}
            onChange={(event) => setRelatedPersonMobile(event.target.value)}
          />
        </label>
      ) : null}

      <label className="required">
        <span>Relationship</span>
        <select
          required
          value={relationshipType}
          onChange={(event) => setRelationshipType(event.target.value)}
        >
          <option value="">Select relationship</option>
          <option value="WIFE">Wife</option>
          <option value="HUSBAND">Husband</option>
          <option value="FATHER">Father</option>
          <option value="MOTHER">Mother</option>
          <option value="SON">Son</option>
          <option value="DAUGHTER">Daughter</option>
          <option value="BROTHER">Brother</option>
          <option value="SISTER">Sister</option>
          <option value="GRANDFATHER">Grandfather</option>
          <option value="GRANDMOTHER">Grandmother</option>
          <option value="GUARDIAN">Guardian</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label>
        <span>Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <div className="checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={isEmergencyContact}
            onChange={(event) => setEmergency(event.target.checked)}
          />
          Emergency contact
        </label>
        <label>
          <input
            type="checkbox"
            checked={isPrimaryContact}
            onChange={(event) => setPrimary(event.target.checked)}
          />
          Primary family contact
        </label>
      </div>

      <button className="button button-primary" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Save relationship" : "Add family relationship"}
      </button>
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
  const [editingFamily, setEditingFamily] = useState<ClinicalRecord | undefined>();
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
      } else {
        setItems(await listClinicalResource(patientId, panel));
      }
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : `${config[panel].title} could not be loaded`,
      );
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
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Record could not be saved",
      );
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

  async function archiveFamily(record: ClinicalRecord) {
    if (!record.id) return;
    if (!window.confirm("Archive this family relationship?")) return;

    try {
      await archiveFamilyRelationship(patientId, record.id);
      await load();
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Family relationship could not be archived",
      );
    }
  }

  const addSupported = [
    "insurances",
    "allergies",
    "chronic-diseases",
    "medical-history",
    "documents",
    "alerts",
    "family",
  ].includes(panel);

  return (
    <section className="profile-panel">
      <div className="section-heading">
        <div>
          <h2>{config[panel].title}</h2>
          <p>{config[panel].description}</p>
        </div>

        {editable && addSupported ? (
          <button
            className="button button-secondary"
            onClick={() => {
              setEditingFamily(undefined);
              setModal(true);
            }}
          >
            ＋ Add
          </button>
        ) : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {loading ? (
        <div className="page-loading compact">
          <Spinner label={`Loading ${config[panel].title.toLowerCase()}…`} />
        </div>
      ) : !items.length ? (
        <EmptyState
          title={`No ${config[panel].title.toLowerCase()} recorded`}
          description="No records are currently available for this patient."
        />
      ) : panel === "family" ? (
        <div className="record-list">
          {items.map((item, index) => {
            const related = item.relatedPatient as Patient | undefined;
            return (
              <article className="record-card" key={item.id ?? String(index)}>
                <div className="record-card-main">
                  <strong>
                    {related
                      ? `${patientName(related)} · ${related.uhid}`
                      : valueOf(item, [
                          "relatedPersonName",
                          "related_person_name",
                          "relatedPatientId",
                          "related_patient_id",
                        ])}
                  </strong>
                  <p>
                    {valueOf(item, ["relationshipType", "relationship_type"])}
                    {Boolean(item.isEmergencyContact ?? item.is_emergency_contact)
                      ? " · Emergency contact"
                      : ""}
                    {Boolean(item.isPrimaryContact ?? item.is_primary_contact)
                      ? " · Primary contact"
                      : ""}
                  </p>
                  <small>{valueOf(item, ["notes", "createdAt", "created_at"])}</small>
                </div>

                <div className="record-card-actions">
                  {editable ? (
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditingFamily(item);
                        setModal(true);
                      }}
                    >
                      Edit
                    </button>
                  ) : null}

                  {deletable ? (
                    <button
                      className="text-button danger-text"
                      onClick={() => void archiveFamily(item)}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="record-list">
          {items.map((item,index) => (
            <article className="record-card" key={item.id ?? String(index)}>
              <div className="record-card-main">
                <strong>{valueOf(item,["title","allergen","diseaseName","disease_name","providerName","provider_name","documentName","document_name","historyType","history_type","relationshipType","relationship_type","identifierValue","identifier_value","eventTitle","event_title","eventType","event_type"])}</strong>
                <p>{valueOf(item,["description","reaction","currentTreatment","current_treatment","policyNumber","policy_number","documentType","document_type","notes","displayValue","display_value"])}</p>
                <small>{valueOf(item,["createdAt","created_at","eventDate","event_date","diagnosisDate","diagnosis_date","issuedAt","issued_at"])}</small>
              </div>
              <div className="record-card-actions">
                {"severity" in item && item.severity ? (
                  <StatusBadge tone={String(item.severity)==="CRITICAL"?"danger":String(item.severity)==="WARNING"?"warning":"neutral"}>
                    {String(item.severity)}
                  </StatusBadge>
                ) : null}

                {panel === "alerts" && editable && !item.acknowledgedAt && !item.acknowledged_at ? (
                  <button
                    className="text-button"
                    onClick={() => void acknowledgeAlert(patientId,item.id).then(load)}
                  >
                    Acknowledge
                  </button>
                ) : null}

                {deletable && addSupported && panel !== "alerts" ? (
                  <button
                    className="text-button danger-text"
                    onClick={() => void remove(item.id)}
                  >
                    Archive
                  </button>
                ) : null}
              </div>
            </article>
          ))}

          {panel === "timeline" && timelineTotal !== null ? (
            <p className="muted-copy">{timelineTotal} timeline events available.</p>
          ) : null}
        </div>
      )}

      {modal ? (
        <Modal
          title={
            panel === "family"
              ? editingFamily
                ? "Edit family relationship"
                : "Add family relationship"
              : `Add ${config[panel].title}`
          }
          onClose={() => {
            setModal(false);
            setEditingFamily(undefined);
          }}
        >
          {panel === "family" ? (
            <FamilyForm
              patientId={patientId}
              {...(editingFamily ? { record: editingFamily } : {})}
              onSave={async () => {
                setModal(false);
                setEditingFamily(undefined);
                await load();
              }}
            />
          ) : (
            <AddResourceForm panel={panel} onSubmit={add} />
          )}
        </Modal>
      ) : null}
    </section>
  );
}
