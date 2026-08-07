import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createOpdVisit,
  getAppointmentDashboard,
  listAppointments,
  listBranches,
  listDepartments,
  listDoctors,
  listOpdVisits,
  searchPatients,
  updateAppointmentStatus,
  completeOpdVisit,
} from "../api/reception-opd.api";
import type {
  AppointmentDashboard,
  AppointmentSummary,
  BranchSummary,
  DepartmentSummary,
  DoctorSummary,
  OpdVisitSummary,
  PatientSummary,
} from "../types/reception-opd";
import "../styles/phase3-reception-opd.css";

const today = () => new Date().toISOString().slice(0, 10);

function nameOfPatient(patient?: PatientSummary | null): string {
  if (!patient) return "-";
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

function nameOfDoctor(doctor?: DoctorSummary | null): string {
  if (!doctor) return "-";
  const employeeName = [
    doctor.employee?.firstName,
    doctor.employee?.middleName,
    doctor.employee?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return employeeName || doctor.doctorCode || "Doctor";
}

function displayTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status?: string): string {
  const normalized = String(status || "").toUpperCase();
  if (["COMPLETED"].includes(normalized)) return "p3-status is-green";
  if (["CANCELLED", "NO_SHOW"].includes(normalized))
    return "p3-status is-red";
  if (["IN_PROGRESS", "IN_CONSULTATION"].includes(normalized))
    return "p3-status is-purple";
  if (["CHECKED_IN", "WAITING"].includes(normalized))
    return "p3-status is-orange";
  return "p3-status is-blue";
}

const EMPTY_DASHBOARD: AppointmentDashboard = {
  date: today(),
  total: 0,
  booked: 0,
  confirmed: 0,
  checkedIn: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  noShow: 0,
  rescheduled: 0,
};

export default function ReceptionOpdPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [dashboard, setDashboard] =
    useState<AppointmentDashboard>(EMPTY_DASHBOARD);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [visits, setVisits] = useState<OpdVisitSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(
    null,
  );
  const [patientSearching, setPatientSearching] = useState(false);

  const [form, setForm] = useState({
    branchId: "",
    departmentId: "",
    doctorId: "",
    visitType: "NEW",
    chiefComplaint: "",
    notes: "",
  });

  const loadDay = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dayStart = `${selectedDate}T00:00:00.000Z`;
      const dayEnd = `${selectedDate}T23:59:59.999Z`;

      const [summary, appointmentPage, visitPage] = await Promise.all([
        getAppointmentDashboard(selectedDate).catch(() => EMPTY_DASHBOARD),
        listAppointments({
          dateFrom: dayStart,
          dateTo: dayEnd,
          pageSize: 100,
        }),
        listOpdVisits({ pageSize: 100 }),
      ]);

      setDashboard(summary);
      setAppointments(appointmentPage.items);

      const filteredVisits = visitPage.items.filter((item) => {
        const raw = item.visitDate?.slice(0, 10);
        return raw === selectedDate;
      });
      setVisits(filteredVisits);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Reception & OPD.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  useEffect(() => {
    void (async () => {
      try {
        const items = await listBranches();
        setBranches(items);
const onlyBranch = items[0];

if (onlyBranch) {
  setForm((current) => ({
    ...current,
    branchId: current.branchId || onlyBranch.id,
  }));
}
      } catch {
        // Page can still open. User will see API error when submitting.
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.branchId) {
      setDepartments([]);
      return;
    }
    void (async () => {
      try {
        const items = await listDepartments(form.branchId);
        setDepartments(items);
      } catch {
        setDepartments([]);
      }
    })();
  }, [form.branchId]);

  useEffect(() => {
    if (!form.departmentId) {
      setDoctors([]);
      return;
    }
    void (async () => {
      try {
        const items = await listDoctors(
          form.departmentId,
          form.branchId || undefined,
        );
        setDoctors(items);
      } catch {
        setDoctors([]);
      }
    })();
  }, [form.departmentId, form.branchId]);

  useEffect(() => {
    const term = patientQuery.trim();
    if (term.length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setPatientSearching(true);
      try {
        setPatientResults(await searchPatients(term));
      } catch {
        setPatientResults([]);
      } finally {
        setPatientSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [patientQuery]);

  const todaysActiveQueue = useMemo(
    () =>
      appointments.filter((item) =>
        ["BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(
          item.status,
        ),
      ),
    [appointments],
  );

  async function handleAppointmentCheckIn(item: AppointmentSummary) {
    setBusyId(item.id);
    setError("");
    setSuccess("");

    try {
      await updateAppointmentStatus(item.id, "CHECKED_IN");

      const existing = visits.find(
        (visit) => visit.appointmentId === item.id,
      );

      if (!existing) {
        await createOpdVisit({
          branchId: item.branch?.id ?? "",
          departmentId: item.department?.id ?? "",
          doctorId: item.doctor.id,
          patientId: item.patient.id,
          appointmentId: item.id,
          visitDate: new Date().toISOString(),
          visitType:
            item.visitType === "FOLLOW_UP" ? "FOLLOW_UP" : "NEW",
          chiefComplaint: item.chiefComplaint ?? null,
          notes: `Checked in from appointment ${item.appointmentNumber}`,
        });
      }

      setSuccess(
        `${nameOfPatient(item.patient)} checked in successfully.`,
      );
      await loadDay();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to check in patient.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleWalkIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPatient) {
      setError("Select a registered patient first.");
      return;
    }

    if (!form.branchId || !form.departmentId || !form.doctorId) {
      setError("Branch, department and doctor are required.");
      return;
    }

    setBusyId("walk-in");

    try {
      const visit = await createOpdVisit({
        branchId: form.branchId,
        departmentId: form.departmentId,
        doctorId: form.doctorId,
        patientId: selectedPatient.id,
        visitDate: new Date().toISOString(),
        visitType: form.visitType,
        chiefComplaint: form.chiefComplaint.trim() || null,
        notes: form.notes.trim() || null,
      });

      setSuccess(
        `OPD visit ${visit.visitNumber || ""} created for ${nameOfPatient(
          selectedPatient,
        )}.`,
      );

      setSelectedPatient(null);
      setPatientQuery("");
      setPatientResults([]);
      setForm((current) => ({
        ...current,
        doctorId: "",
        chiefComplaint: "",
        notes: "",
      }));

      await loadDay();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create OPD visit.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCompleteVisit(visit: OpdVisitSummary) {
    setBusyId(visit.id);
    setError("");
    setSuccess("");
    try {
      await completeOpdVisit(visit.id);
      setSuccess(`${visit.visitNumber} marked completed.`);
      await loadDay();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : "Unable to complete OPD visit.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p3-page">
      <header className="p3-hero">
        <div>
          <span className="p3-eyebrow">PHASE 3 · FRONT DESK</span>
          <h1>Reception & OPD</h1>
          <p>
            Search patients, handle appointments and walk-ins, check in
            visitors, create OPD encounters and manage today&apos;s flow.
          </p>
        </div>

        <div className="p3-date-box">
          <label htmlFor="p3-date">Working date</label>
          <input
            id="p3-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <button type="button" onClick={() => void loadDay()}>
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="p3-message p3-error">{error}</div>}
      {success && <div className="p3-message p3-success">{success}</div>}

      <section className="p3-kpis">
        {[
          ["Appointments", dashboard.total],
          ["Booked", dashboard.booked],
          ["Checked In", dashboard.checkedIn],
          ["In Progress", dashboard.inProgress],
          ["Completed", dashboard.completed],
        ].map(([label, value]) => (
          <article className="p3-kpi" key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="p3-grid p3-grid-top">
        <article className="p3-card">
          <div className="p3-card-head">
            <div>
              <span className="p3-card-kicker">WALK-IN</span>
              <h2>Create OPD Visit</h2>
            </div>
            <span className="p3-chip">UHID linked</span>
          </div>

          <form onSubmit={handleWalkIn} className="p3-form">
            <div className="p3-field p3-span-2 p3-patient-search">
              <label>Patient search *</label>
              {selectedPatient ? (
                <div className="p3-selected-patient">
                  <div>
                    <strong>{nameOfPatient(selectedPatient)}</strong>
                    <span>
                      {selectedPatient.uhid}
                      {selectedPatient.primaryMobile
                        ? ` · ${selectedPatient.primaryMobile}`
                        : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={patientQuery}
                    onChange={(event) => setPatientQuery(event.target.value)}
                    placeholder="Search UHID, name or mobile"
                  />
                  {patientSearching && (
                    <small>Searching patients…</small>
                  )}
                  {patientResults.length > 0 && (
                    <div className="p3-search-results">
                      {patientResults.map((patient) => (
                        <button
                          type="button"
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientResults([]);
                          }}
                        >
                          <strong>{nameOfPatient(patient)}</strong>
                          <span>
                            {patient.uhid} ·{" "}
                            {patient.primaryMobile || "No mobile"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p3-field">
              <label>Branch *</label>
              <select
                required
                value={form.branchId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    branchId: event.target.value,
                    departmentId: "",
                    doctorId: "",
                  }))
                }
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option value={branch.id} key={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div className="p3-field">
              <label>Department *</label>
              <select
                required
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                    doctorId: "",
                  }))
                }
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option value={department.id} key={department.id}>
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="p3-field">
              <label>Doctor *</label>
              <select
                required
                value={form.doctorId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    doctorId: event.target.value,
                  }))
                }
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option value={doctor.id} key={doctor.id}>
                    {nameOfDoctor(doctor)}
                    {doctor.specialization
                      ? ` — ${doctor.specialization}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="p3-field">
              <label>Visit type *</label>
              <select
                value={form.visitType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    visitType: event.target.value,
                  }))
                }
              >
                <option value="NEW">New</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
            </div>

            <div className="p3-field p3-span-2">
              <label>Chief complaint</label>
              <textarea
                rows={2}
                value={form.chiefComplaint}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chiefComplaint: event.target.value,
                  }))
                }
                placeholder="Primary reason for today's visit"
              />
            </div>

            <div className="p3-field p3-span-2">
              <label>Reception remarks</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Optional remarks"
              />
            </div>

            <div className="p3-span-2 p3-actions">
              <button
                className="p3-primary"
                type="submit"
                disabled={busyId === "walk-in"}
              >
                {busyId === "walk-in"
                  ? "Creating…"
                  : "Create OPD Visit"}
              </button>
            </div>
          </form>
        </article>

        <article className="p3-card">
          <div className="p3-card-head">
            <div>
              <span className="p3-card-kicker">TODAY</span>
              <h2>Front Desk Queue</h2>
            </div>
            <span className="p3-chip">
              {todaysActiveQueue.length} active
            </span>
          </div>

          <div className="p3-queue">
            {loading ? (
              <div className="p3-empty">Loading today&apos;s queue…</div>
            ) : todaysActiveQueue.length === 0 ? (
              <div className="p3-empty">
                No active appointments for this date.
              </div>
            ) : (
              todaysActiveQueue.map((item, index) => (
                <article className="p3-queue-row" key={item.id}>
                  <div className="p3-token">
                    <span>#{index + 1}</span>
                  </div>

                  <div className="p3-queue-main">
                    <strong>{nameOfPatient(item.patient)}</strong>
                    <span>
                      {item.patient.uhid} · {displayTime(item.startTime)}
                    </span>
                    <small>
                      {item.department?.departmentName || "Department"} ·{" "}
                      {nameOfDoctor(item.doctor)}
                    </small>
                  </div>

                  <div className="p3-queue-action">
                    <span className={statusClass(item.status)}>
                      {item.status.replaceAll("_", " ")}
                    </span>
                    {["BOOKED", "CONFIRMED"].includes(item.status) && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void handleAppointmentCheckIn(item)}
                      >
                        {busyId === item.id ? "Please wait…" : "Check In"}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="p3-card p3-table-card">
        <div className="p3-card-head">
          <div>
            <span className="p3-card-kicker">OPD REGISTER</span>
            <h2>Today&apos;s OPD Visits</h2>
          </div>
          <span className="p3-chip">{visits.length} visits</span>
        </div>

        {loading ? (
          <div className="p3-empty">Loading OPD visits…</div>
        ) : visits.length === 0 ? (
          <div className="p3-empty">
            No OPD visits have been registered for this date.
          </div>
        ) : (
          <div className="p3-table-wrap">
            <table className="p3-table">
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Visit Type</th>
                  <th>Complaint</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>
                      <strong>{visit.visitNumber}</strong>
                      <small>{displayTime(visit.visitDate)}</small>
                    </td>
                    <td>
                      <strong>{nameOfPatient(visit.patient)}</strong>
                      <small>{visit.patient?.uhid}</small>
                    </td>
                    <td>{nameOfDoctor(visit.doctor)}</td>
                    <td>{visit.visitType?.replaceAll("_", " ")}</td>
                    <td>{visit.chiefComplaint || "-"}</td>
                    <td>
                      <span className={statusClass(visit.status)}>
                        {String(visit.status).replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {!["COMPLETED", "CANCELLED"].includes(
                        String(visit.status),
                      ) && (
                        <button
                          className="p3-table-action"
                          type="button"
                          disabled={busyId === visit.id}
                          onClick={() => void handleCompleteVisit(visit)}
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="p3-card p3-flow-card">
        <div className="p3-card-head">
          <div>
            <span className="p3-card-kicker">WORKFLOW</span>
            <h2>Reception → Clinical Journey</h2>
          </div>
        </div>
        <div className="p3-flow">
          {[
            "Patient Search",
            "Appointment / Walk-in",
            "Check-in",
            "OPD Visit",
            "Pre-Consultation",
            "Doctor Consultation",
          ].map((step, index) => (
            <div key={step} className="p3-flow-step">
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
