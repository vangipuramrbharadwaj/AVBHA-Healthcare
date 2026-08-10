import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addIpdDoctorRound,
  addIpdIntakeOutput,
  addIpdMedicationAdministration,
  addIpdMedicationOrder,
  addIpdNursingNote,
  addIpdVitals,
  createIpdAdmission,
  createIpdBed,
  createIpdRoom,
  createIpdWard,
  dischargeIpdPatient,
  getIpdAdmission,
  getIpdDischargeReadiness,
  listIpdAdmissions,
  listIpdBeds,
  listIpdRooms,
  listIpdWards,
  transferIpdBed,
  type IpdAdmission,
  type IpdDischargeReadiness,
  type IpdBed,
  type IpdRoom,
  type IpdWard,
  type MedicationOrder,
} from "../api/ipd.api";
import {
  listBranches,
  listDepartments,
  listDoctors,
  searchPatients,
} from "../api/reception-opd.api";
import { pharmacyInventory, type InventoryMedicine } from "../api/pharmacy.api";
import type {
  BranchSummary,
  DepartmentSummary,
  DoctorSummary,
  PatientSummary,
} from "../types/reception-opd";
import IpdIntegrationsPanel from "../components/ipd/IpdIntegrationsPanel";
import "../styles/ipd.css";

type MainTab = "dashboard" | "admissions" | "beds" | "setup";
type WorkspaceTab =
  | "overview"
  | "vitals"
  | "rounds"
  | "nursing"
  | "medications"
  | "intake"
  | "transfers"
  | "discharge"
  | "connected";

function patientName(patient?: PatientSummary | IpdAdmission["patient"]) {
  if (!patient) return "Patient";
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

function doctorName(doctor?: DoctorSummary | IpdAdmission["doctor"]) {
  if (!doctor) return "Doctor";
  const employee = "employee" in doctor ? doctor.employee : null;
  const first = employee?.firstName ?? ("firstName" in doctor ? doctor.firstName : null);
  const middle = employee?.middleName ?? ("middleName" in doctor ? doctor.middleName : null);
  const last = employee?.lastName ?? ("lastName" in doctor ? doctor.lastName : null);
  return [("title" in doctor ? doctor.title : null), first, middle, last]
    .filter(Boolean)
    .join(" ") || doctor.doctorCode || "Doctor";
}

function dt(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
}

function d(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}

function money(value?: string | number | null) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function currentBed(admission?: IpdAdmission | null) {
  return admission?.bedAllocations?.find((item) => item.status === "ACTIVE")?.bed ?? null;
}

function stayDays(admission: IpdAdmission) {
  const start = new Date(admission.admissionDate).getTime();
  const end = admission.dischargedAt
    ? new Date(admission.dischargedAt).getTime()
    : Date.now();
  return Math.max(1, Math.ceil((end - start) / 86_400_000));
}

function tempF(c?: string | number | null) {
  if (c === null || c === undefined || c === "") return "—";
  const n = Number(c);
  return `${((n * 9) / 5 + 32).toFixed(1)}°F`;
}

export default function IpdPage() {
  const [tab, setTab] = useState<MainTab>("dashboard");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [wards, setWards] = useState<IpdWard[]>([]);
  const [rooms, setRooms] = useState<IpdRoom[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selected, setSelected] = useState<IpdAdmission | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState<"ward" | "room" | "bed" | null>(null);

  async function load(preferredId?: string) {
    try {
      setError("");
      const [a, b, w, r, br, dep, doc] = await Promise.all([
        listIpdAdmissions({ page: 1, pageSize: 100 }),
        listIpdBeds(),
        listIpdWards(),
        listIpdRooms(),
        listBranches(),
        listDepartments(),
        listDoctors(),
      ]);
      setAdmissions(a.items);
      setBeds(b);
      setWards(w);
      setRooms(r);
      setBranches(br);
      setDepartments(dep);
      setDoctors(doc);

      const id = preferredId ?? selected?.id;
      if (id) {
        const detail = await getIpdAdmission(id);
        setSelected(detail);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load IPD");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function refreshSelected() {
    if (!selected) return;
    const detail = await getIpdAdmission(selected.id);
    setSelected(detail);
    const a = await listIpdAdmissions({ page: 1, pageSize: 100 });
    setAdmissions(a.items);
    setBeds(await listIpdBeds());
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      await action();
      setMessage(success);
      await refreshSelected();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function openWorkspace(admission: IpdAdmission) {
    try {
      setBusy(true);
      setError("");
      const detail = await getIpdAdmission(admission.id);
      setSelected(detail);
      setWorkspaceTab("overview");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open admission");
    } finally {
      setBusy(false);
    }
  }

  const active = admissions.filter((item) => item.status === "ACTIVE");
  const dischargePlanned = admissions.filter(
    (item) => item.status === "DISCHARGE_PLANNED",
  );
  const availableBeds = beds.filter((bed) => bed.bedStatus === "AVAILABLE");
  const occupiedBeds = beds.filter((bed) => bed.bedStatus === "OCCUPIED");

  const occupancy = beds.length
    ? Math.round((occupiedBeds.length / beds.length) * 100)
    : 0;

  const today = new Date().toDateString();
  const admissionsToday = admissions.filter(
    (item) => new Date(item.admissionDate).toDateString() === today,
  ).length;
  const dischargesToday = admissions.filter(
    (item) =>
      item.dischargedAt &&
      new Date(item.dischargedAt).toDateString() === today,
  ).length;

  return (
    <div className="ipd-page">
      <header className="ipd-hero">
        <div>
          <span>INPATIENT COMMAND CENTRE</span>
          <h1>IPD Management</h1>
          <p>
            Admission, bed control, daily clinical care, nursing, medication
            administration and discharge in one patient journey.
          </p>
        </div>
        <div className="ipd-hero-actions">
          <button onClick={() => setAdmitOpen(true)}>+ Admit Patient</button>
          <button className="secondary" onClick={() => setTab("beds")}>
            Bed Board
          </button>
        </div>
      </header>

      {error && <div className="ipd-alert error">{error}</div>}
      {message && <div className="ipd-alert success">{message}</div>}

      <nav className="ipd-main-tabs">
        {([
          ["dashboard", "Overview"],
          ["admissions", "Admissions"],
          ["beds", "Bed Board"],
          ["setup", "Ward & Bed Setup"],
        ] as Array<[MainTab, string]>).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <>
          <section className="ipd-kpis">
            <Kpi label="Currently admitted" value={active.length} />
            <Kpi label="Available beds" value={availableBeds.length} good />
            <Kpi label="Occupancy" value={`${occupancy}%`} />
            <Kpi label="Admissions today" value={admissionsToday} />
            <Kpi label="Discharges today" value={dischargesToday} good />
            <Kpi label="Discharge planned" value={dischargePlanned.length} warn />
          </section>

          <section className="ipd-dashboard-grid">
            <article className="ipd-card">
              <div className="ipd-card-head">
                <div>
                  <span>LIVE PATIENT FLOW</span>
                  <h2>Current Inpatients</h2>
                </div>
                <button onClick={() => setTab("admissions")}>View all</button>
              </div>

              <div className="ipd-live-list">
                {active.slice(0, 8).map((admission) => {
                  const bed = currentBed(admission);
                  return (
                    <button
                      key={admission.id}
                      onClick={() => void openWorkspace(admission)}
                    >
                      <span className="ipd-avatar">
                        {admission.patient.firstName?.charAt(0)}
                      </span>
                      <span className="ipd-live-person">
                        <strong>{patientName(admission.patient)}</strong>
                        <small>
                          {admission.patient.uhid} · {admission.admissionNumber}
                        </small>
                      </span>
                      <span className="ipd-live-doctor">
                        <small>ATTENDING</small>
                        <strong>{doctorName(admission.doctor)}</strong>
                      </span>
                      <span className="ipd-live-bed">
                        <small>BED</small>
                        <strong>
                          {bed
                            ? `${bed.room.ward.wardName} · ${bed.bedName}`
                            : "Unallocated"}
                        </strong>
                      </span>
                      <span className="ipd-live-days">{stayDays(admission)}d</span>
                    </button>
                  );
                })}
                {active.length === 0 && (
                  <Empty text="No active IPD admissions yet." />
                )}
              </div>
            </article>

            <article className="ipd-card">
              <div className="ipd-card-head">
                <div>
                  <span>BED UTILIZATION</span>
                  <h2>Ward Capacity</h2>
                </div>
              </div>
              <div className="ipd-ward-capacity">
                {wards.map((ward) => {
                  const wardBeds = beds.filter(
                    (bed) => bed.room.ward.id === ward.id,
                  );
                  const occupied = wardBeds.filter(
                    (bed) => bed.bedStatus === "OCCUPIED",
                  ).length;
                  const pct = wardBeds.length
                    ? Math.round((occupied / wardBeds.length) * 100)
                    : 0;
                  return (
                    <div key={ward.id}>
                      <div>
                        <strong>{ward.wardName}</strong>
                        <span>
                          {occupied}/{wardBeds.length} occupied
                        </span>
                      </div>
                      <div className="ipd-progress">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {wards.length === 0 && (
                  <Empty text="Create wards, rooms and beds to start the bed board." />
                )}
              </div>
            </article>
          </section>
        </>
      )}

      {tab === "admissions" && (
        <section className="ipd-card">
          <div className="ipd-card-head">
            <div>
              <span>INPATIENT REGISTER</span>
              <h2>Admissions</h2>
            </div>
            <button onClick={() => setAdmitOpen(true)}>+ New Admission</button>
          </div>

          <div className="ipd-table-scroll">
            <table className="ipd-table">
              <thead>
                <tr>
                  <th>IPD No.</th>
                  <th>Patient</th>
                  <th>Doctor / Department</th>
                  <th>Ward / Bed</th>
                  <th>Admission</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission) => {
                  const bed = currentBed(admission);
                  return (
                    <tr key={admission.id}>
                      <td>
                        <strong>{admission.admissionNumber}</strong>
                        <small>{admission.admissionType.replaceAll("_", " ")}</small>
                      </td>
                      <td>
                        <strong>{patientName(admission.patient)}</strong>
                        <small>
                          {admission.patient.uhid} ·{" "}
                          {admission.patient.primaryMobile || "No mobile"}
                        </small>
                      </td>
                      <td>
                        <strong>{doctorName(admission.doctor)}</strong>
                        <small>{admission.department.departmentName}</small>
                      </td>
                      <td>
                        <strong>
                          {bed ? `${bed.room.ward.wardName} / ${bed.room.roomName}` : "—"}
                        </strong>
                        <small>{bed?.bedName || "Bed pending"}</small>
                      </td>
                      <td>{dt(admission.admissionDate)}</td>
                      <td>{stayDays(admission)} day{stayDays(admission) === 1 ? "" : "s"}</td>
                      <td>
                        <span className={`ipd-status ${admission.status.toLowerCase()}`}>
                          {admission.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ipd-link"
                          onClick={() => void openWorkspace(admission)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "beds" && (
        <BedBoard
          beds={beds}
          wards={wards}
          onSetup={() => setTab("setup")}
        />
      )}

      {tab === "setup" && (
        <section className="ipd-card">
          <div className="ipd-card-head">
            <div>
              <span>BED MASTER</span>
              <h2>Ward, Room & Bed Setup</h2>
              <p>
                Configure physical inpatient capacity once; admissions and
                transfers use the same bed master.
              </p>
            </div>
            <div className="ipd-inline-actions">
              <button onClick={() => setSetupOpen("ward")}>+ Ward</button>
              <button onClick={() => setSetupOpen("room")}>+ Room</button>
              <button onClick={() => setSetupOpen("bed")}>+ Bed</button>
            </div>
          </div>

          <div className="ipd-setup-grid">
            {wards.map((ward) => (
              <article className="ipd-setup-ward" key={ward.id}>
                <header>
                  <div>
                    <span>{ward.wardType}</span>
                    <h3>{ward.wardName}</h3>
                    <small>{ward.floor || "Floor not specified"}</small>
                  </div>
                  <strong>
                    {ward.rooms.reduce((n, room) => n + room.beds.length, 0)} beds
                  </strong>
                </header>

                {ward.rooms.map((room) => (
                  <div className="ipd-setup-room" key={room.id}>
                    <div>
                      <strong>{room.roomName}</strong>
                      <small>
                        {room.roomType} · {money(room.dailyCharge)}/day
                      </small>
                    </div>
                    <div className="ipd-bed-chips">
                      {room.beds.map((bed) => (
                        <span
                          key={bed.id}
                          className={bed.bedStatus.toLowerCase()}
                        >
                          {bed.bedName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </article>
            ))}
            {wards.length === 0 && (
              <Empty text="No wards configured. Create your first ward." />
            )}
          </div>
        </section>
      )}

      {selected && (
        <div className="ipd-workspace-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="ipd-workspace"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="ipd-workspace-head">
              <div>
                <span>{selected.admissionNumber}</span>
                <h2>{patientName(selected.patient)}</h2>
                <p>
                  {selected.patient.uhid} · {selected.patient.primaryMobile || "No mobile"} ·{" "}
                  {selected.patient.gender || "—"} · {selected.patient.ageYears ?? "—"} yrs
                </p>
              </div>
              <div className="ipd-workspace-meta">
                <div>
                  <small>ATTENDING</small>
                  <strong>{doctorName(selected.doctor)}</strong>
                </div>
                <div>
                  <small>CURRENT BED</small>
                  <strong>
                    {currentBed(selected)?.bedName || "Not allocated"}
                  </strong>
                </div>
                <span className={`ipd-status ${selected.status.toLowerCase()}`}>
                  {selected.status.replaceAll("_", " ")}
                </span>
                <button onClick={() => setSelected(null)}>×</button>
              </div>
            </header>

            <div className="ipd-patient-alerts">
              {selected.patient.medicalAlerts && (
                <span className="danger">⚠ {selected.patient.medicalAlerts}</span>
              )}
              {selected.patient.allergiesSummary && (
                <span className="warn">Allergy: {selected.patient.allergiesSummary}</span>
              )}
              {selected.patient.bloodGroup && (
                <span>Blood: {selected.patient.bloodGroup}</span>
              )}
              <span>Stay: {stayDays(selected)} day{stayDays(selected) === 1 ? "" : "s"}</span>
            </div>

            <nav className="ipd-workspace-tabs">
              {([
                ["overview", "Overview"],
                ["vitals", "Vitals"],
                ["rounds", "Doctor Rounds"],
                ["nursing", "Nursing"],
                ["medications", "Medications"],
                ["intake", "Intake / Output"],
                ["transfers", "Transfers"],
                ["connected", "Connected Modules"],
                ["discharge", "Discharge"],
              ] as Array<[WorkspaceTab, string]>).map(([key, label]) => (
                <button
                  key={key}
                  className={workspaceTab === key ? "active" : ""}
                  onClick={() => setWorkspaceTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="ipd-workspace-body">
              {workspaceTab === "overview" && <Overview admission={selected} />}
              {workspaceTab === "vitals" && (
                <VitalsPanel
                  admission={selected}
                  busy={busy}
                  onSave={(body) =>
                    run(() => addIpdVitals(selected.id, body), "Vitals recorded")
                  }
                />
              )}
              {workspaceTab === "rounds" && (
                <RoundsPanel
                  admission={selected}
                  doctors={doctors}
                  busy={busy}
                  onSave={(body) =>
                    run(
                      () => addIpdDoctorRound(selected.id, body),
                      "Doctor round recorded",
                    )
                  }
                />
              )}
              {workspaceTab === "nursing" && (
                <NursingPanel
                  admission={selected}
                  busy={busy}
                  onSave={(body) =>
                    run(
                      () => addIpdNursingNote(selected.id, body),
                      "Nursing note recorded",
                    )
                  }
                />
              )}
              {workspaceTab === "medications" && (
                <MedicationPanel
                  admission={selected}
                  busy={busy}
                  onOrder={(body) =>
                    run(
                      () => addIpdMedicationOrder(selected.id, body),
                      "Medication order created",
                    )
                  }
                  onAdmin={(orderId, body) =>
                    run(
                      () => addIpdMedicationAdministration(orderId, body),
                      "Medication administration recorded",
                    )
                  }
                />
              )}
              {workspaceTab === "intake" && (
                <IntakePanel
                  admission={selected}
                  busy={busy}
                  onSave={(body) =>
                    run(
                      () => addIpdIntakeOutput(selected.id, body),
                      "Intake / output recorded",
                    )
                  }
                />
              )}
              {workspaceTab === "transfers" && (
                <TransferPanel
                  admission={selected}
                  beds={beds}
                  busy={busy}
                  onSave={(body) =>
                    run(
                      () => transferIpdBed(selected.id, body),
                      "Bed transferred successfully",
                    )
                  }
                />
              )}
              {workspaceTab === "connected" && (
                <IpdIntegrationsPanel admission={selected} doctors={doctors} onDone={refreshSelected} />
              )}
              {workspaceTab === "discharge" && (
                <DischargePanel
                  admission={selected}
                  busy={busy}
                  onSave={(body) =>
                    run(
                      () => dischargeIpdPatient(selected.id, body),
                      "Patient discharged successfully",
                    )
                  }
                />
              )}
            </div>
          </section>
        </div>
      )}

      {admitOpen && (
        <AdmissionModal
          branches={branches}
          departments={departments}
          doctors={doctors}
          beds={beds}
          busy={busy}
          onClose={() => setAdmitOpen(false)}
          onCreated={async (id) => {
            setAdmitOpen(false);
            setMessage("Patient admitted successfully");
            await load(id);
            const detail = await getIpdAdmission(id);
            setSelected(detail);
            setWorkspaceTab("overview");
          }}
          setBusy={setBusy}
          setError={setError}
        />
      )}

      {setupOpen && (
        <SetupModal
          mode={setupOpen}
          branches={branches}
          wards={wards}
          rooms={rooms}
          busy={busy}
          onClose={() => setSetupOpen(null)}
          onSave={async (body) => {
            try {
              setBusy(true);
              setError("");
              if (setupOpen === "ward") await createIpdWard(body);
              if (setupOpen === "room") await createIpdRoom(body);
              if (setupOpen === "bed") await createIpdBed(body);
              setSetupOpen(null);
              setMessage(`${setupOpen} created successfully`);
              await load();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Unable to save");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  warn = false,
  good = false,
}: {
  label: string;
  value: ReactNode;
  warn?: boolean;
  good?: boolean;
}) {
  return (
    <article className={`ipd-kpi ${warn ? "warn" : ""} ${good ? "good" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="ipd-empty">{text}</div>;
}

function BedBoard({
  beds,
  wards,
  onSetup,
}: {
  beds: IpdBed[];
  wards: IpdWard[];
  onSetup: () => void;
}) {
  const [filter, setFilter] = useState("ALL");
  const filtered = beds.filter(
    (bed) => filter === "ALL" || bed.bedStatus === filter,
  );

  return (
    <section className="ipd-card">
      <div className="ipd-card-head">
        <div>
          <span>REAL-TIME CAPACITY</span>
          <h2>Bed Board</h2>
          <p>Ward → room → bed status at a glance.</p>
        </div>
        <div className="ipd-bed-filter">
          {["ALL", "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "BLOCKED"].map(
            (status) => (
              <button
                key={status}
                className={filter === status ? "active" : ""}
                onClick={() => setFilter(status)}
              >
                {status.replaceAll("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      {wards.length === 0 ? (
        <div className="ipd-bed-empty">
          <Empty text="No wards or beds configured." />
          <button onClick={onSetup}>Configure Bed Master</button>
        </div>
      ) : (
        <div className="ipd-bed-board">
          {wards.map((ward) => {
            const wardBeds = filtered.filter(
              (bed) => bed.room.ward.id === ward.id,
            );
            if (wardBeds.length === 0) return null;
            return (
              <article className="ipd-ward-board" key={ward.id}>
                <header>
                  <div>
                    <span>{ward.wardType}</span>
                    <h3>{ward.wardName}</h3>
                  </div>
                  <small>{ward.floor || ""}</small>
                </header>
                <div className="ipd-bed-grid">
                  {wardBeds.map((bed) => (
                    <div
                      className={`ipd-bed-card ${bed.bedStatus.toLowerCase()}`}
                      key={bed.id}
                    >
                      <span className="ipd-bed-icon">▰</span>
                      <div>
                        <strong>{bed.bedName}</strong>
                        <small>
                          {bed.room.roomName} · {bed.bedType}
                        </small>
                      </div>
                      <span className="ipd-bed-state">
                        {bed.bedStatus.replaceAll("_", " ")}
                      </span>
                      <small>{money(bed.dailyCharge)}/day</small>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Overview({ admission }: { admission: IpdAdmission }) {
  const bed = currentBed(admission);
  const latest = admission.vitals?.[0];

  return (
    <div className="ipd-work-grid">
      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>ADMISSION SNAPSHOT</span>
            <h3>Clinical Overview</h3>
          </div>
        </div>
        <div className="ipd-info-grid">
          <Info label="Admission type" value={admission.admissionType.replaceAll("_", " ")} />
          <Info label="Admitted" value={dt(admission.admissionDate)} />
          <Info label="Department" value={admission.department.departmentName} />
          <Info label="Attending doctor" value={doctorName(admission.doctor)} />
          <Info
            label="Ward / Room / Bed"
            value={
              bed
                ? `${bed.room.ward.wardName} / ${bed.room.roomName} / ${bed.bedName}`
                : "Bed not allocated"
            }
          />
          <Info
            label="Expected discharge"
            value={d(admission.expectedDischargeDate)}
          />
        </div>

        <div className="ipd-clinical-text">
          <div>
            <span>Admission reason</span>
            <p>{admission.admissionReason || "Not recorded"}</p>
          </div>
          <div>
            <span>Provisional diagnosis</span>
            <p>{admission.provisionalDiagnosis || "Not recorded"}</p>
          </div>
        </div>
      </article>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>LATEST OBSERVATIONS</span>
            <h3>Vitals</h3>
          </div>
          <small>{latest ? dt(latest.recordedAt) : "Pending"}</small>
        </div>
        <div className="ipd-vital-snapshot">
          <Info label="Temperature" value={latest ? tempF(latest.temperatureCelsius) : "—"} />
          <Info
            label="Blood pressure"
            value={
              latest?.systolicBp || latest?.diastolicBp
                ? `${latest.systolicBp ?? "—"}/${latest.diastolicBp ?? "—"}`
                : "—"
            }
          />
          <Info label="Pulse" value={latest?.pulseRate ? `${latest.pulseRate}/min` : "—"} />
          <Info label="SpO₂" value={latest?.spo2 != null ? `${latest.spo2}%` : "—"} />
          <Info label="Respiration" value={latest?.respiratoryRate ? `${latest.respiratoryRate}/min` : "—"} />
          <Info label="Pain" value={latest?.painScore != null ? `${latest.painScore}/10` : "—"} />
        </div>
      </article>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>CARE ACTIVITY</span>
            <h3>Today at a Glance</h3>
          </div>
        </div>
        <div className="ipd-activity-kpis">
          <Info label="Doctor rounds" value={admission.doctorRounds?.length ?? 0} />
          <Info label="Nursing notes" value={admission.nursingNotes?.length ?? 0} />
          <Info label="Medication orders" value={admission.medicationOrders?.length ?? 0} />
          <Info label="Vitals records" value={admission.vitals?.length ?? 0} />
          <Info label="I/O entries" value={admission.intakeOutputs?.length ?? 0} />
          <Info label="Bed transfers" value={Math.max(0, admission.bedAllocations.length - 1)} />
        </div>
      </article>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>ATTENDANT</span>
            <h3>Patient Support</h3>
          </div>
        </div>
        <div className="ipd-info-grid two">
          <Info label="Attendant" value={admission.attendantName || "—"} />
          <Info label="Phone" value={admission.attendantPhone || "—"} />
        </div>
        {admission.notes && (
          <div className="ipd-clinical-text">
            <div>
              <span>Admission notes</span>
              <p>{admission.notes}</p>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ipd-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function VitalsPanel({
  admission,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const tempFValue = Number(f.get("temperatureF") || 0);
    onSave({
      temperatureCelsius: tempFValue
        ? Number((((tempFValue - 32) * 5) / 9).toFixed(2))
        : null,
      pulseRate: f.get("pulseRate") ? Number(f.get("pulseRate")) : null,
      respiratoryRate: f.get("respiratoryRate")
        ? Number(f.get("respiratoryRate"))
        : null,
      systolicBp: f.get("systolicBp") ? Number(f.get("systolicBp")) : null,
      diastolicBp: f.get("diastolicBp") ? Number(f.get("diastolicBp")) : null,
      spo2: f.get("spo2") ? Number(f.get("spo2")) : null,
      bloodSugar: f.get("bloodSugar") ? Number(f.get("bloodSugar")) : null,
      painScore: f.get("painScore") ? Number(f.get("painScore")) : null,
      notes: f.get("notes") || null,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>NURSING OBSERVATION</span>
            <h3>Record Vitals</h3>
          </div>
        </div>
        <div className="ipd-form-grid">
          <Field name="temperatureF" label="Temperature °F" type="number" step="0.1" />
          <Field name="pulseRate" label="Pulse / min" type="number" />
          <Field name="respiratoryRate" label="Respiratory rate" type="number" />
          <Field name="systolicBp" label="Systolic BP" type="number" />
          <Field name="diastolicBp" label="Diastolic BP" type="number" />
          <Field name="spo2" label="SpO₂ %" type="number" />
          <Field name="bloodSugar" label="Blood sugar" type="number" step="0.1" />
          <Field name="painScore" label="Pain score 0-10" type="number" />
        </div>
        <label className="ipd-field">
          <span>Notes</span>
          <textarea name="notes" />
        </label>
        <div className="ipd-form-actions">
          <button disabled={busy}>Save Vitals</button>
        </div>
      </form>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>OBSERVATION HISTORY</span>
            <h3>Vital Records</h3>
          </div>
          <strong>{admission.vitals?.length ?? 0}</strong>
        </div>
        <div className="ipd-timeline">
          {admission.vitals?.map((vital) => (
            <div key={vital.id}>
              <span />
              <div>
                <strong>{dt(vital.recordedAt)}</strong>
                <p>
                  Temp {tempF(vital.temperatureCelsius)} · BP{" "}
                  {vital.systolicBp ?? "—"}/{vital.diastolicBp ?? "—"} · Pulse{" "}
                  {vital.pulseRate ?? "—"} · SpO₂ {vital.spo2 ?? "—"}%
                </p>
                {vital.notes && <small>{vital.notes}</small>}
              </div>
            </div>
          ))}
          {!admission.vitals?.length && <Empty text="No vitals recorded." />}
        </div>
      </article>
    </div>
  );
}

function RoundsPanel({
  admission,
  doctors,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  doctors: DoctorSummary[];
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    onSave({
      doctorId: f.get("doctorId"),
      progressNotes: f.get("progressNotes") || null,
      examination: f.get("examination") || null,
      diagnosis: f.get("diagnosis") || null,
      plan: f.get("plan") || null,
      orders: f.get("orders") || null,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>DAILY MEDICAL REVIEW</span>
            <h3>Doctor Round</h3>
          </div>
        </div>
        <label className="ipd-field">
          <span>Doctor</span>
          <select name="doctorId" defaultValue={admission.doctorId} required>
            {doctors.map((doctor) => (
              <option value={doctor.id} key={doctor.id}>
                {doctorName(doctor)} · {doctor.specialization || ""}
              </option>
            ))}
          </select>
        </label>
        <Text name="progressNotes" label="Progress / interval history" />
        <Text name="examination" label="Examination" />
        <Text name="diagnosis" label="Diagnosis / assessment" />
        <Text name="plan" label="Treatment plan" />
        <Text name="orders" label="Orders / instructions" />
        <div className="ipd-form-actions">
          <button disabled={busy}>Save Doctor Round</button>
        </div>
      </form>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>MEDICAL PROGRESS</span>
            <h3>Round History</h3>
          </div>
          <strong>{admission.doctorRounds?.length ?? 0}</strong>
        </div>
        <div className="ipd-record-list">
          {admission.doctorRounds?.map((round) => (
            <article key={round.id}>
              <header>
                <strong>{dt(round.roundDate)}</strong>
              </header>
              {round.progressNotes && <p><b>Progress:</b> {round.progressNotes}</p>}
              {round.examination && <p><b>Examination:</b> {round.examination}</p>}
              {round.diagnosis && <p><b>Assessment:</b> {round.diagnosis}</p>}
              {round.plan && <p><b>Plan:</b> {round.plan}</p>}
              {round.orders && <p><b>Orders:</b> {round.orders}</p>}
            </article>
          ))}
          {!admission.doctorRounds?.length && <Empty text="No doctor rounds recorded." />}
        </div>
      </article>
    </div>
  );
}

function NursingPanel({
  admission,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    onSave({
      noteType: f.get("noteType"),
      shift: f.get("shift") || null,
      note: f.get("note"),
    });
    event.currentTarget.reset();
  };

  return (
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>NURSING DOCUMENTATION</span>
            <h3>Add Nursing Note</h3>
          </div>
        </div>
        <div className="ipd-form-grid">
          <label className="ipd-field">
            <span>Note type</span>
            <select name="noteType" required>
              <option value="SHIFT_NOTE">Shift Note</option>
              <option value="CARE_NOTE">Care Note</option>
              <option value="OBSERVATION">Observation</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="HANDOVER">Handover</option>
            </select>
          </label>
          <label className="ipd-field">
            <span>Shift</span>
            <select name="shift">
              <option value="">Not specified</option>
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
              <option value="NIGHT">Night</option>
            </select>
          </label>
        </div>
        <Text name="note" label="Nursing note" required />
        <div className="ipd-form-actions">
          <button disabled={busy}>Save Nursing Note</button>
        </div>
      </form>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>NURSING TIMELINE</span>
            <h3>Recent Notes</h3>
          </div>
        </div>
        <div className="ipd-record-list">
          {admission.nursingNotes?.map((note) => (
            <article key={note.id}>
              <header>
                <strong>{note.noteType.replaceAll("_", " ")}</strong>
                <span>{note.shift || ""} · {dt(note.recordedAt)}</span>
              </header>
              <p>{note.note}</p>
            </article>
          ))}
          {!admission.nursingNotes?.length && <Empty text="No nursing notes recorded." />}
        </div>
      </article>
    </div>
  );
}

function MedicationPanel({
  admission,
  busy,
  onOrder,
  onAdmin,
}: {
  admission: IpdAdmission;
  busy: boolean;
  onOrder: (body: Record<string, unknown>) => void;
  onAdmin: (orderId: string, body: Record<string, unknown>) => void;
}) {
  const [adminOrder, setAdminOrder] = useState<MedicationOrder | null>(null);
  const [inventory, setInventory] = useState<InventoryMedicine[]>([]);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<InventoryMedicine | null>(null);

  useEffect(() => {
    pharmacyInventory(admission.branchId).then(setInventory).catch(() => setInventory([]));
  }, [admission.branchId]);

  const matches = useMemo(() => {
    const q=medicineSearch.trim().toLowerCase(); if(!q) return [];
    return inventory.filter(m=>[m.brandName,m.genericName,m.medicineCode,m.strength,m.dosageForm].some(v=>String(v??"").toLowerCase().includes(q))).slice(0,8);
  },[inventory,medicineSearch]);

  const order = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMedicine) return;
    const f = new FormData(event.currentTarget);
    onOrder({
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.brandName,
      prescribedQuantity: f.get("prescribedQuantity") ? Number(f.get("prescribedQuantity")) : null,
      dosage: f.get("dosage") || null, route: f.get("route") || null,
      frequency: f.get("frequency") || null, startDate: f.get("startDate"), endDate: f.get("endDate") || null,
      instructions: f.get("instructions") || null,
    });
    event.currentTarget.reset(); setSelectedMedicine(null); setMedicineSearch("");
  };

  const administer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!adminOrder) return; const f = new FormData(event.currentTarget);
    onAdmin(adminOrder.id, { scheduledAt:f.get("scheduledAt"), administeredAt:String(f.get("status"))==="GIVEN"?f.get("administeredAt")||new Date().toISOString():null, doseGiven:f.get("doseGiven")||null, status:f.get("status"), remarks:f.get("remarks")||null }); setAdminOrder(null);
  };

  return <>
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={order}>
        <div className="ipd-panel-head"><div><span>PHARMACY CONNECTED</span><h3>Prescribe Medicine</h3></div></div>
        <label className="ipd-field ipd-medicine-search"><span>Medicine *</span><input value={medicineSearch} onChange={e=>{setMedicineSearch(e.target.value);setSelectedMedicine(null)}} placeholder="Type brand, generic name or medicine code" autoComplete="off" />
          {matches.length>0&&!selectedMedicine&&<div className="ipd-medicine-results">{matches.map(m=>{const stock=m.batches.reduce((t,b)=>t+Number(b.availableQuantity),0);return <button type="button" key={m.id} onClick={()=>{setSelectedMedicine(m);setMedicineSearch(`${m.brandName}${m.strength?` · ${m.strength}`:""}`)}}><div><strong>{m.brandName}</strong><small>{[m.genericName,m.dosageForm,m.strength].filter(Boolean).join(" · ")}</small></div><span>{stock} in stock · {m.batches.length} batch{m.batches.length===1?"":"es"}</span></button>})}</div>}
        </label>
        {selectedMedicine&&<div className="ipd-selected-medicine"><strong>✓ {selectedMedicine.brandName}</strong><span>{selectedMedicine.genericName||"Generic not set"} · {selectedMedicine.batches.reduce((t,b)=>t+Number(b.availableQuantity),0)} available</span></div>}
        <div className="ipd-form-grid"><Field name="prescribedQuantity" label="Required quantity" type="number" required /><Field name="dosage" label="Dosage" /><Field name="route" label="Route" placeholder="Oral / IV / IM" /><Field name="frequency" label="Frequency" placeholder="1-0-1" /><Field name="startDate" label="Start date/time" type="datetime-local" required /><Field name="endDate" label="End date/time" type="datetime-local" /></div>
        <Text name="instructions" label="Instructions" /><div className="ipd-form-actions"><button disabled={busy||!selectedMedicine}>Send to Pharmacy</button></div>
      </form>
      <article className="ipd-panel"><div className="ipd-panel-head"><div><span>MAR</span><h3>Medication Administration</h3></div></div><div className="ipd-med-list">
        {admission.medicationOrders?.map(med=><article key={med.id}><div><strong>{med.medicineName}</strong><small>{[med.dosage,med.route,med.frequency].filter(Boolean).join(" · ")}</small><span>Qty {med.prescribedQuantity?Number(med.prescribedQuantity):"—"} · Started {dt(med.startDate)} · {med.status}</span></div><div className="ipd-med-admins"><span>{med.administrations.length} administrations</span><button onClick={()=>setAdminOrder(med)}>Record Dose</button></div></article>)}
        {!admission.medicationOrders?.length&&<Empty text="No medication orders." />}
      </div></article>
    </div>
    {adminOrder&&<div className="ipd-mini-backdrop" onMouseDown={()=>setAdminOrder(null)}><form className="ipd-mini-modal" onSubmit={administer} onMouseDown={e=>e.stopPropagation()}><header><div><span>MEDICATION ADMINISTRATION</span><h3>{adminOrder.medicineName}</h3></div><button type="button" onClick={()=>setAdminOrder(null)}>×</button></header><div className="ipd-form-grid"><Field name="scheduledAt" label="Scheduled time" type="datetime-local" required /><Field name="administeredAt" label="Given time" type="datetime-local" /><Field name="doseGiven" label="Dose given" /><label className="ipd-field"><span>Status</span><select name="status" defaultValue="GIVEN"><option value="GIVEN">Given</option><option value="MISSED">Missed</option><option value="REFUSED">Refused</option><option value="HELD">Held</option><option value="PENDING">Pending</option></select></label></div><Text name="remarks" label="Remarks" /><div className="ipd-form-actions"><button disabled={busy}>Save Administration</button></div></form></div>}
  </>;
}

function IntakePanel({
  admission,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    onSave({
      recordType: f.get("recordType"),
      category: f.get("category"),
      quantityMl: Number(f.get("quantityMl")),
      notes: f.get("notes") || null,
    });
    event.currentTarget.reset();
  };

  const totalIn =
    admission.intakeOutputs
      ?.filter((item) => item.recordType === "INTAKE")
      .reduce((sum, item) => sum + Number(item.quantityMl), 0) ?? 0;
  const totalOut =
    admission.intakeOutputs
      ?.filter((item) => item.recordType === "OUTPUT")
      .reduce((sum, item) => sum + Number(item.quantityMl), 0) ?? 0;

  return (
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>FLUID BALANCE</span>
            <h3>Record Intake / Output</h3>
          </div>
        </div>
        <div className="ipd-form-grid">
          <label className="ipd-field">
            <span>Type</span>
            <select name="recordType">
              <option value="INTAKE">Intake</option>
              <option value="OUTPUT">Output</option>
            </select>
          </label>
          <Field name="category" label="Category" required placeholder="Oral fluids / Urine / IV..." />
          <Field name="quantityMl" label="Quantity ml" type="number" required />
        </div>
        <Text name="notes" label="Notes" />
        <div className="ipd-form-actions">
          <button disabled={busy}>Save Record</button>
        </div>
      </form>

      <article className="ipd-panel">
        <div className="ipd-io-summary">
          <div className="intake">
            <span>Total Intake</span>
            <strong>{totalIn.toLocaleString("en-IN")} ml</strong>
          </div>
          <div className="output">
            <span>Total Output</span>
            <strong>{totalOut.toLocaleString("en-IN")} ml</strong>
          </div>
          <div>
            <span>Balance</span>
            <strong>{(totalIn - totalOut).toLocaleString("en-IN")} ml</strong>
          </div>
        </div>
        <div className="ipd-record-list compact">
          {admission.intakeOutputs?.map((item) => (
            <article key={item.id}>
              <header>
                <strong>{item.recordType} · {item.category}</strong>
                <span>{dt(item.recordedAt)}</span>
              </header>
              <p>{Number(item.quantityMl)} ml {item.notes ? `· ${item.notes}` : ""}</p>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

function TransferPanel({
  admission,
  beds,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  beds: IpdBed[];
  busy: boolean;
  onSave: (body: { bedId: string; transferReason?: string | null }) => void;
}) {
  const available = beds.filter((bed) => bed.bedStatus === "AVAILABLE");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    onSave({
      bedId: String(f.get("bedId")),
      transferReason: String(f.get("transferReason") || "") || null,
    });
  };

  return (
    <div className="ipd-work-grid">
      <form className="ipd-panel" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>BED MOVEMENT</span>
            <h3>Transfer Patient</h3>
          </div>
        </div>
        <label className="ipd-field">
          <span>New available bed</span>
          <select name="bedId" required>
            <option value="">Select bed</option>
            {available.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.room.ward.wardName} / {bed.room.roomName} / {bed.bedName}
              </option>
            ))}
          </select>
        </label>
        <Text name="transferReason" label="Transfer reason" />
        <div className="ipd-form-actions">
          <button disabled={busy || available.length === 0}>Transfer Bed</button>
        </div>
      </form>

      <article className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>AUDIT TRAIL</span>
            <h3>Bed History</h3>
          </div>
        </div>
        <div className="ipd-timeline">
          {[...admission.bedAllocations]
            .sort(
              (a, b) =>
                new Date(b.allocatedAt).getTime() -
                new Date(a.allocatedAt).getTime(),
            )
            .map((allocation) => (
              <div key={allocation.id}>
                <span />
                <div>
                  <strong>
                    {allocation.bed.room.ward.wardName} /{" "}
                    {allocation.bed.room.roomName} / {allocation.bed.bedName}
                  </strong>
                  <p>
                    {dt(allocation.allocatedAt)} →{" "}
                    {allocation.releasedAt ? dt(allocation.releasedAt) : "Current"}
                  </p>
                  <small>
                    {allocation.status}
                    {allocation.transferReason
                      ? ` · ${allocation.transferReason}`
                      : ""}
                  </small>
                </div>
              </div>
            ))}
        </div>
      </article>
    </div>
  );
}

function DischargePanel({
  admission,
  busy,
  onSave,
}: {
  admission: IpdAdmission;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [readiness, setReadiness] =
    useState<IpdDischargeReadiness | null>(null);
  const [readinessError, setReadinessError] = useState("");

  async function loadReadiness() {
    try {
      setReadinessError("");
      setReadiness(await getIpdDischargeReadiness(admission.id));
    } catch (caught) {
      setReadinessError(
        caught instanceof Error
          ? caught.message
          : "Unable to check discharge clearance",
      );
    }
  }

  useEffect(() => {
    void loadReadiness();
  }, [admission.id]);

  if (admission.dischargeSummary) {
    const summary = admission.dischargeSummary;
    return (
      <article className="ipd-panel discharge-summary">
        <div className="ipd-panel-head">
          <div>
            <span>DISCHARGE COMPLETED</span>
            <h3>Discharge Summary</h3>
          </div>
          <span className="ipd-status discharged">DISCHARGED</span>
        </div>
        <div className="ipd-info-grid">
          <Info label="Discharge type" value={summary.dischargeType} />
          <Info label="Prepared" value={dt(summary.preparedAt)} />
          <Info label="Follow-up" value={d(summary.followUpDate)} />
        </div>
        <div className="ipd-clinical-text">
          <div><span>Final diagnosis</span><p>{summary.finalDiagnosis}</p></div>
          {summary.hospitalCourse && <div><span>Hospital course</span><p>{summary.hospitalCourse}</p></div>}
          {summary.proceduresDone && <div><span>Procedures</span><p>{summary.proceduresDone}</p></div>}
          {summary.dischargeMedication && <div><span>Discharge medication</span><p>{summary.dischargeMedication}</p></div>}
          {summary.dischargeAdvice && <div><span>Advice</span><p>{summary.dischargeAdvice}</p></div>}
          {summary.followUpInstructions && <div><span>Follow-up instructions</span><p>{summary.followUpInstructions}</p></div>}
        </div>
      </article>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readiness?.ready) return;
    const f = new FormData(event.currentTarget);
    onSave({
      dischargeType: f.get("dischargeType"),
      finalDiagnosis: f.get("finalDiagnosis"),
      hospitalCourse: f.get("hospitalCourse") || null,
      proceduresDone: f.get("proceduresDone") || null,
      conditionAtDischarge: f.get("conditionAtDischarge") || null,
      dischargeAdvice: f.get("dischargeAdvice") || null,
      dischargeMedication: f.get("dischargeMedication") || null,
      followUpDate: f.get("followUpDate") || null,
      followUpInstructions: f.get("followUpInstructions") || null,
    });
  };

  return (
    <div className="ipd-discharge-layout">
      <section className="ipd-panel">
        <div className="ipd-panel-head">
          <div>
            <span>DISCHARGE CLEARANCE</span>
            <h3>Connected Module Readiness</h3>
            <p>
              Laboratory, Radiology, OT, Pharmacy and Billing must be clear
              before final discharge.
            </p>
          </div>
          <button type="button" className="ipd-link" onClick={() => void loadReadiness()}>
            Refresh
          </button>
        </div>

        {readinessError && <div className="ipd-alert error">{readinessError}</div>}

        <div className="ipd-clearance-grid">
          {readiness?.checks.map((check) => (
            <article
              key={check.key}
              className={`ipd-clearance ${check.ready ? "ready" : "pending"}`}
            >
              <span>{check.ready ? "✓" : "!"}</span>
              <div>
                <strong>{check.label}</strong>
                <small>{check.message}</small>
              </div>
            </article>
          ))}
          {!readiness && !readinessError && (
            <div className="ipd-empty">Checking discharge readiness...</div>
          )}
        </div>

        {readiness && (
          <div className={`ipd-discharge-state ${readiness.ready ? "ready" : "pending"}`}>
            <strong>
              {readiness.ready
                ? "Patient is ready for discharge"
                : "Discharge is currently blocked"}
            </strong>
            <span>
              {readiness.ready
                ? "All connected-module clearances are complete."
                : "Complete the pending items above before final discharge."}
            </span>
          </div>
        )}
      </section>

      <form className="ipd-panel ipd-discharge-form" onSubmit={submit}>
        <div className="ipd-panel-head">
          <div>
            <span>FINAL CLINICAL DOCUMENT</span>
            <h3>Prepare Discharge</h3>
          </div>
        </div>
        <div className="ipd-form-grid">
          <label className="ipd-field">
            <span>Discharge type</span>
            <select name="dischargeType">
              <option value="NORMAL">Normal</option>
              <option value="LAMA">LAMA</option>
              <option value="TRANSFER">Transfer</option>
              <option value="DEATH">Death</option>
              <option value="ABSCONDED">Absconded</option>
            </select>
          </label>
          <Field name="followUpDate" label="Follow-up date" type="date" />
        </div>
        <Text name="finalDiagnosis" label="Final diagnosis" required />
        <Text name="hospitalCourse" label="Hospital course" />
        <Text name="proceduresDone" label="Procedures performed" />
        <Text name="conditionAtDischarge" label="Condition at discharge" />
        <Text name="dischargeMedication" label="Discharge medication" />
        <Text name="dischargeAdvice" label="Discharge advice" />
        <Text name="followUpInstructions" label="Follow-up instructions" />
        <div className="ipd-form-actions">
          <button disabled={busy || !readiness?.ready}>
            Complete Discharge
          </button>
        </div>
      </form>
    </div>
  );
}

function AdmissionModal({
  branches,
  departments,
  doctors,
  beds,
  busy,
  onClose,
  onCreated,
  setBusy,
  setError,
}: {
  branches: BranchSummary[];
  departments: DepartmentSummary[];
  doctors: DoctorSummary[];
  beds: IpdBed[];
  busy: boolean;
  onClose: () => void;
  onCreated: (id: string) => Promise<void>;
  setBusy: (value: boolean) => void;
  setError: (value: string) => void;
}) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = patientQuery.trim();
    if (!q || patient) {
      setPatientResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPatients(q, 12)
        .then(setPatientResults)
        .finally(() => setSearching(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [patientQuery, patient]);

  const filteredDepartments = departments.filter(
    (department) => !department.branchId || !branchId || department.branchId === branchId,
  );
  const filteredDoctors = doctors.filter(
    (doctor) =>
      (!departmentId || doctor.departmentId === departmentId) &&
      (!doctor.branchId || !branchId || doctor.branchId === branchId),
  );
  const filteredBeds = beds.filter(
    (bed) =>
      bed.bedStatus === "AVAILABLE" &&
      (!branchId || bed.branchId === branchId),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient) {
      setError("Select a registered patient before admission.");
      return;
    }
    const f = new FormData(event.currentTarget);

    try {
      setBusy(true);
      setError("");
      const created = await createIpdAdmission({
        branchId: f.get("branchId"),
        departmentId: f.get("departmentId"),
        doctorId: f.get("doctorId"),
        patientId: patient.id,
        bedId: f.get("bedId") || null,
        admissionDate: f.get("admissionDate"),
        admissionType: f.get("admissionType"),
        admissionReason: f.get("admissionReason") || null,
        provisionalDiagnosis: f.get("provisionalDiagnosis") || null,
        expectedDischargeDate: f.get("expectedDischargeDate") || null,
        attendantName: f.get("attendantName") || null,
        attendantPhone: f.get("attendantPhone") || null,
        notes: f.get("notes") || null,
      });
      await onCreated(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ipd-modal-backdrop" onMouseDown={onClose}>
      <form
        className="ipd-modal admission"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>NEW INPATIENT ADMISSION</span>
            <h2>Admit Patient</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </header>

        <div className="ipd-modal-content">
          <section className="ipd-admission-section">
            <h3>1. Patient</h3>
            <div className="ipd-patient-search">
              <label className="ipd-field">
                <span>Search patient by name / UHID / mobile</span>
                <input
                  value={patientQuery}
                  onChange={(event) => {
                    setPatientQuery(event.target.value);
                    setPatient(null);
                  }}
                  placeholder="Start typing..."
                />
              </label>
              {(searching || patientResults.length > 0) && !patient && (
                <div className="ipd-patient-results">
                  {searching && <span>Searching...</span>}
                  {patientResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setPatient(item);
                        setPatientQuery(patientName(item));
                        setPatientResults([]);
                      }}
                    >
                      <strong>{patientName(item)}</strong>
                      <small>{item.uhid} · {item.primaryMobile || "No mobile"}</small>
                    </button>
                  ))}
                </div>
              )}
              {patient && (
                <div className="ipd-selected-patient">
                  <span>SELECTED</span>
                  <strong>{patientName(patient)}</strong>
                  <small>
                    {patient.uhid} · {patient.gender || "—"} · {patient.ageYears ?? "—"} yrs
                  </small>
                </div>
              )}
            </div>
          </section>

          <section className="ipd-admission-section">
            <h3>2. Admission & Care Team</h3>
            <div className="ipd-form-grid">
              <label className="ipd-field">
                <span>Branch *</span>
                <select
                  name="branchId"
                  value={branchId}
                  onChange={(event) => {
                    setBranchId(event.target.value);
                    setDepartmentId("");
                  }}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ipd-field">
                <span>Department *</span>
                <select
                  name="departmentId"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  required
                >
                  <option value="">Select department</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ipd-field">
                <span>Attending doctor *</span>
                <select name="doctorId" required>
                  <option value="">Select doctor</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctorName(doctor)} · {doctor.specialization || ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ipd-field">
                <span>Admission type *</span>
                <select name="admissionType" defaultValue="ELECTIVE">
                  <option value="ELECTIVE">Elective</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="DAY_CARE">Day Care</option>
                  <option value="OBSERVATION">Observation</option>
                </select>
              </label>
              <Field
                name="admissionDate"
                label="Admission date/time *"
                type="datetime-local"
                required
                defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
              />
              <Field
                name="expectedDischargeDate"
                label="Expected discharge"
                type="date"
              />
            </div>
            <Text name="admissionReason" label="Reason for admission" />
            <Text name="provisionalDiagnosis" label="Provisional diagnosis" />
          </section>

          <section className="ipd-admission-section">
            <h3>3. Bed & Attendant</h3>
            <div className="ipd-form-grid">
              <label className="ipd-field">
                <span>Bed</span>
                <select name="bedId">
                  <option value="">Allocate later</option>
                  {filteredBeds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.room.ward.wardName} / {bed.room.roomName} / {bed.bedName}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="attendantName" label="Attendant name" />
              <Field name="attendantPhone" label="Attendant phone" />
            </div>
            <Text name="notes" label="Admission notes" />
          </section>
        </div>

        <footer>
          <span>
            Admission number is generated automatically.
          </span>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy || !patient}>
            {busy ? "Admitting..." : "Confirm Admission"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function SetupModal({
  mode,
  branches,
  wards,
  rooms,
  busy,
  onClose,
  onSave,
}: {
  mode: "ward" | "room" | "bed";
  branches: BranchSummary[];
  wards: IpdWard[];
  rooms: IpdRoom[];
  busy: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const filteredWards = wards.filter(
    (ward) => !branchId || ward.branchId === branchId,
  );
  const filteredRooms = rooms.filter(
    (room) => !branchId || room.branchId === branchId,
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);

    if (mode === "ward") {
      onSave({
        branchId: f.get("branchId"),
        wardCode: f.get("wardCode"),
        wardName: f.get("wardName"),
        wardType: f.get("wardType"),
        floor: f.get("floor") || null,
      });
    }

    if (mode === "room") {
      onSave({
        branchId: f.get("branchId"),
        wardId: f.get("wardId"),
        roomCode: f.get("roomCode"),
        roomName: f.get("roomName"),
        roomType: f.get("roomType"),
        dailyCharge: f.get("dailyCharge") ? Number(f.get("dailyCharge")) : null,
      });
    }

    if (mode === "bed") {
      onSave({
        branchId: f.get("branchId"),
        roomId: f.get("roomId"),
        bedCode: f.get("bedCode"),
        bedName: f.get("bedName"),
        bedType: f.get("bedType"),
        dailyCharge: f.get("dailyCharge") ? Number(f.get("dailyCharge")) : null,
      });
    }
  };

  return (
    <div className="ipd-modal-backdrop" onMouseDown={onClose}>
      <form
        className="ipd-modal setup"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>BED MASTER</span>
            <h2>
              Add {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </header>

        <div className="ipd-modal-content">
          <div className="ipd-form-grid">
            <label className="ipd-field">
              <span>Branch *</span>
              <select
                name="branchId"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                required
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </label>

            {mode === "ward" && (
              <>
                <Field name="wardCode" label="Ward code *" required />
                <Field name="wardName" label="Ward name *" required />
                <Field name="wardType" label="Ward type *" required placeholder="General / ICU / Private" />
                <Field name="floor" label="Floor" />
              </>
            )}

            {mode === "room" && (
              <>
                <label className="ipd-field">
                  <span>Ward *</span>
                  <select name="wardId" required>
                    <option value="">Select ward</option>
                    {filteredWards.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.wardName}
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="roomCode" label="Room code *" required />
                <Field name="roomName" label="Room name *" required />
                <Field name="roomType" label="Room type *" required />
                <Field name="dailyCharge" label="Daily room charge" type="number" step="0.01" />
              </>
            )}

            {mode === "bed" && (
              <>
                <label className="ipd-field">
                  <span>Room *</span>
                  <select name="roomId" required>
                    <option value="">Select room</option>
                    {filteredRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.ward.wardName} / {room.roomName}
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="bedCode" label="Bed code *" required />
                <Field name="bedName" label="Bed name *" required />
                <Field name="bedType" label="Bed type *" required />
                <Field name="dailyCharge" label="Daily bed charge" type="number" step="0.01" />
              </>
            )}
          </div>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy}>Save</button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  step,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label className="ipd-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function Text({
  name,
  label,
  required = false,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="ipd-field">
      <span>{label}</span>
      <textarea name={name} required={required} />
    </label>
  );
}
