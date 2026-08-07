import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import {
  cancelAppointment,
  createAppointment,
  getAppointmentDashboard,
  listAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
  type AppointmentPriority,
  type AppointmentType,
  type AppointmentVisitType,
} from "../api/appointments.api";
import {
  listBranches,
  listDepartments,
  listDoctors,
  searchPatients,
} from "../api/reception-opd.api";
import type {
  AppointmentDashboard,
  AppointmentSummary,
  BranchSummary,
  DepartmentSummary,
  DoctorSummary,
  PatientSummary,
} from "../types/reception-opd";
import "../styles/phase4-appointments.css";

const APPOINTMENT_TYPES: AppointmentType[] = [
  "CONSULTATION",
  "FOLLOW_UP",
  "PROCEDURE",
  "HEALTH_CHECK",
  "VACCINATION",
  "TELECONSULTATION",
  "EMERGENCY",
  "OTHER",
];

const VISIT_TYPES: AppointmentVisitType[] = [
  "NEW",
  "FOLLOW_UP",
  "REVIEW",
];

const PRIORITIES: AppointmentPriority[] = [
  "NORMAL",
  "URGENT",
  "EMERGENCY",
];

const STATUSES = [
  "BOOKED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
] as const;

function dateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function patientName(patient?: PatientSummary | null) {
  if (!patient) return "-";
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

function doctorName(doctor?: DoctorSummary | null) {
  if (!doctor) return "-";
  return (
    [
      doctor.employee?.firstName,
      doctor.employee?.middleName,
      doctor.employee?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    doctor.doctorCode ||
    "Doctor"
  );
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "is-green";
  if (["CANCELLED", "NO_SHOW"].includes(status)) return "is-red";
  if (["CHECKED_IN", "IN_PROGRESS"].includes(status)) return "is-orange";
  if (status === "RESCHEDULED") return "is-purple";
  return "is-blue";
}

function appointmentTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function appointmentDay(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
}) {
  return (
    <div className="p4-modal-backdrop" role="presentation">
      <section className="p4-modal" role="dialog" aria-modal="true">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="p4-modal-body">{children}</div>
      </section>
    </div>
  );
}

const EMPTY_DASHBOARD: AppointmentDashboard = {
  date: dateInput(),
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

export default function AppointmentsPage() {
  const { can, hasRole } = useAuth();
  const canCreate = hasRole("SUPER_ADMIN") || can("appointments.create");
  const canUpdate = hasRole("SUPER_ADMIN") || can("appointments.update");
  const canCancel = hasRole("SUPER_ADMIN") || can("appointments.cancel");
  const canReschedule =
    hasRole("SUPER_ADMIN") || can("appointments.reschedule");

  const [selectedDate, setSelectedDate] = useState(dateInput());
  const [dashboard, setDashboard] =
    useState<AppointmentDashboard>(EMPTY_DASHBOARD);
  const [appointments, setAppointments] =
    useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [filterDepartments, setFilterDepartments] =
    useState<DepartmentSummary[]>([]);
  const [filterDoctors, setFilterDoctors] = useState<DoctorSummary[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<{
    mode: "RESCHEDULE" | "CANCEL";
    item: AppointmentSummary;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const from = `${selectedDate}T00:00:00.000Z`;
      const to = `${selectedDate}T23:59:59.999Z`;

      const [summary, page] = await Promise.all([
        getAppointmentDashboard(selectedDate),
        listAppointments({
          page: 1,
          pageSize: 100,
          search: search.trim() || undefined,
          status: status || undefined,
          appointmentType: appointmentType || undefined,
          branchId: branchFilter || undefined,
          departmentId: departmentFilter || undefined,
          doctorId: doctorFilter || undefined,
          dateFrom: from,
          dateTo: to,
          sortOrder: "asc",
        }),
      ]);

      setDashboard(summary);
      setAppointments(page.items);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointments could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    selectedDate,
    search,
    status,
    appointmentType,
    branchFilter,
    departmentFilter,
    doctorFilter,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void listBranches()
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    void listDepartments(branchFilter || undefined)
      .then(setFilterDepartments)
      .catch(() => setFilterDepartments([]));
  }, [branchFilter]);

  useEffect(() => {
    void listDoctors(
      departmentFilter || undefined,
      branchFilter || undefined,
    )
      .then(setFilterDoctors)
      .catch(() => setFilterDoctors([]));
  }, [departmentFilter, branchFilter]);

  async function changeStatus(
    item: AppointmentSummary,
    next:
      | "CONFIRMED"
      | "CHECKED_IN"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "NO_SHOW",
  ) {
    setBusy(item.id);
    setError("");
    setSuccess("");
    try {
      await updateAppointmentStatus(item.id, next);
      setSuccess(
        `${item.appointmentNumber} updated to ${label(next)}.`,
      );
      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointment could not be updated.",
      );
    } finally {
      setBusy(null);
    }
  }

  const selectedDateLabel = useMemo(
    () =>
      new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
        "en-IN",
        { weekday: "long", day: "2-digit", month: "long" },
      ),
    [selectedDate],
  );

  return (
    <div className="p4-page">
      <header className="p4-hero">
        <div>
          <span>FRONTEND PHASE 4 · APPOINTMENTS</span>
          <h1>Appointments & Scheduling</h1>
          <p>
            Book consultations, manage doctor calendars, confirm arrivals,
            reschedule safely and maintain a complete appointment lifecycle.
          </p>
        </div>
        <div className="p4-hero-actions">
          <label>
            Working date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          {canCreate ? (
            <button type="button" onClick={() => setCreateOpen(true)}>
              ＋ Book Appointment
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="p4-alert is-error">{error}</div> : null}
      {success ? (
        <div className="p4-alert is-success">{success}</div>
      ) : null}

      <section className="p4-kpis">
        {[
          ["Total", dashboard.total],
          ["Booked", dashboard.booked],
          ["Confirmed", dashboard.confirmed],
          ["Checked In", dashboard.checkedIn],
          ["In Progress", dashboard.inProgress],
          ["Completed", dashboard.completed],
        ].map(([name, value]) => (
          <article key={String(name)}>
            <span>{name}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="p4-card p4-filters">
        <div className="p4-section-heading">
          <div>
            <h2>{selectedDateLabel}</h2>
            <p>Search and filter the doctor appointment calendar.</p>
          </div>
          <button type="button" onClick={() => void load()}>
            Refresh
          </button>
        </div>

        <div className="p4-filter-grid">
          <input
            placeholder="Search appointment, patient or mobile"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
          <select
            value={appointmentType}
            onChange={(event) => setAppointmentType(event.target.value)}
          >
            <option value="">All appointment types</option>
            {APPOINTMENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(event) => {
              setBranchFilter(event.target.value);
              setDepartmentFilter("");
              setDoctorFilter("");
            }}
          >
            <option value="">All branches</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.branchName}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setDoctorFilter("");
            }}
          >
            <option value="">All departments</option>
            {filterDepartments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.departmentName}
              </option>
            ))}
          </select>
          <select
            value={doctorFilter}
            onChange={(event) => setDoctorFilter(event.target.value)}
          >
            <option value="">All doctors</option>
            {filterDoctors.map((item) => (
              <option key={item.id} value={item.id}>
                {doctorName(item)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="p4-card">
        <div className="p4-section-heading">
          <div>
            <h2>Appointment Calendar</h2>
            <p>{appointments.length} appointment(s) in this view.</p>
          </div>
        </div>

        {loading ? (
          <div className="p4-empty">Loading appointments…</div>
        ) : appointments.length === 0 ? (
          <div className="p4-empty">
            <strong>No appointments found</strong>
            <span>
              Change the date/filters or book a new appointment.
            </span>
          </div>
        ) : (
          <div className="p4-table-wrap">
            <table className="p4-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Appointment</th>
                  <th>Patient</th>
                  <th>Doctor / Department</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Workflow</th>
                  <th>More</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{appointmentTime(item.startTime)}</strong>
                      <small>to {appointmentTime(item.endTime)}</small>
                    </td>
                    <td>
                      <strong>{item.appointmentNumber}</strong>
                      <small>{appointmentDay(item.appointmentDate)}</small>
                    </td>
                    <td>
                      <strong>{patientName(item.patient)}</strong>
                      <small>
                        {item.patient.uhid}
                        {item.patient.primaryMobile
                          ? ` · ${item.patient.primaryMobile}`
                          : ""}
                      </small>
                    </td>
                    <td>
                      <strong>{doctorName(item.doctor)}</strong>
                      <small>
                        {item.department?.departmentName || "-"}
                      </small>
                    </td>
                    <td>
                      <strong>{label(item.appointmentType || "-")}</strong>
                      <small>{label(item.visitType || "-")}</small>
                    </td>
                    <td>
                      <span
                        className={`p4-status ${statusTone(item.status)}`}
                      >
                        {label(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="p4-inline-actions">
                        {canUpdate && item.status === "BOOKED" ? (
                          <button
                            disabled={busy === item.id}
                            onClick={() =>
                              void changeStatus(item, "CONFIRMED")
                            }
                          >
                            Confirm
                          </button>
                        ) : null}
                        {canUpdate &&
                        ["BOOKED", "CONFIRMED"].includes(item.status) ? (
                          <button
                            disabled={busy === item.id}
                            onClick={() =>
                              void changeStatus(item, "CHECKED_IN")
                            }
                          >
                            Check In
                          </button>
                        ) : null}
                        {canUpdate && item.status === "CHECKED_IN" ? (
                          <button
                            disabled={busy === item.id}
                            onClick={() =>
                              void changeStatus(item, "IN_PROGRESS")
                            }
                          >
                            Start
                          </button>
                        ) : null}
                        {canUpdate && item.status === "IN_PROGRESS" ? (
                          <button
                            disabled={busy === item.id}
                            onClick={() =>
                              void changeStatus(item, "COMPLETED")
                            }
                          >
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="p4-more">
                        {canReschedule &&
                        !["COMPLETED", "CANCELLED", "RESCHEDULED"].includes(
                          item.status,
                        ) ? (
                          <button
                            onClick={() =>
                              setAction({ mode: "RESCHEDULE", item })
                            }
                          >
                            Reschedule
                          </button>
                        ) : null}
                        {canCancel &&
                        !["COMPLETED", "CANCELLED", "RESCHEDULED"].includes(
                          item.status,
                        ) ? (
                          <button
                            className="is-danger"
                            onClick={() =>
                              setAction({ mode: "CANCEL", item })
                            }
                          >
                            Cancel
                          </button>
                        ) : null}
                        {canUpdate &&
                        !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
                          item.status,
                        ) ? (
                          <button
                            onClick={() =>
                              void changeStatus(item, "NO_SHOW")
                            }
                          >
                            No Show
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen ? (
        <Modal
          title="Book Appointment"
          onClose={() => setCreateOpen(false)}
        >
          <CreateAppointmentForm
            branches={branches}
            onSaved={async (message) => {
              setCreateOpen(false);
              setSuccess(message);
              await load();
            }}
          />
        </Modal>
      ) : null}

      {action?.mode === "RESCHEDULE" ? (
        <Modal
          title={`Reschedule ${action.item.appointmentNumber}`}
          onClose={() => setAction(null)}
        >
          <RescheduleForm
            item={action.item}
            onSaved={async () => {
              setAction(null);
              setSuccess("Appointment rescheduled successfully.");
              await load();
            }}
          />
        </Modal>
      ) : null}

      {action?.mode === "CANCEL" ? (
        <Modal
          title={`Cancel ${action.item.appointmentNumber}`}
          onClose={() => setAction(null)}
        >
          <CancelForm
            item={action.item}
            onSaved={async () => {
              setAction(null);
              setSuccess("Appointment cancelled successfully.");
              await load();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function CreateAppointmentForm({
  branches,
  onSaved,
}: {
  branches: BranchSummary[];
  onSaved(message: string): Promise<void>;
}) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    branchId: branches.length === 1 ? branches[0]?.id ?? "" : "",
    departmentId: "",
    doctorId: "",
    date: dateInput(),
    start: "09:00",
    duration: 15,
    appointmentType: "CONSULTATION" as AppointmentType,
    visitType: "NEW" as AppointmentVisitType,
    priority: "NORMAL" as AppointmentPriority,
    chiefComplaint: "",
    reason: "",
    source: "RECEPTION",
    notes: "",
  });

  useEffect(() => {
    if (!form.branchId) {
      setDepartments([]);
      return;
    }
    void listDepartments(form.branchId)
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [form.branchId]);

  useEffect(() => {
    if (!form.departmentId) {
      setDoctors([]);
      return;
    }
    void listDoctors(form.departmentId, form.branchId)
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [form.departmentId, form.branchId]);

  useEffect(() => {
    if (patient || patientQuery.trim().length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchPatients(patientQuery.trim())
        .then(setPatientResults)
        .catch(() => setPatientResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [patientQuery, patient]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!patient) {
      setError("Select the patient from search results.");
      return;
    }

    const start = new Date(`${form.date}T${form.start}:00`);
    const end = new Date(
      start.getTime() + form.duration * 60_000,
    );

    setSaving(true);
    try {
      const record = await createAppointment({
        branchId: form.branchId,
        departmentId: form.departmentId,
        doctorId: form.doctorId,
        patientId: patient.id,
        appointmentDate: new Date(`${form.date}T12:00:00`).toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: form.duration,
        appointmentType: form.appointmentType,
        visitType: form.visitType,
        priority: form.priority,
        status: "BOOKED",
        chiefComplaint: form.chiefComplaint.trim() || null,
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null,
        source: form.source.trim() || null,
      });

      await onSaved(
        `Appointment ${record.appointmentNumber} booked successfully.`,
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointment could not be booked.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="p4-form" onSubmit={submit}>
      {error ? <div className="p4-alert is-error">{error}</div> : null}

      <label className="p4-span-2">
        <span>Patient *</span>
        {patient ? (
          <div className="p4-selected">
            <div>
              <strong>{patientName(patient)}</strong>
              <small>{patient.uhid} · {patient.primaryMobile || "-"}</small>
            </div>
            <button type="button" onClick={() => setPatient(null)}>
              Change
            </button>
          </div>
        ) : (
          <div className="p4-search-box">
            <input
              required
              placeholder="Search UHID, patient name or mobile"
              value={patientQuery}
              onChange={(event) => setPatientQuery(event.target.value)}
            />
            {patientResults.length ? (
              <div className="p4-search-results">
                {patientResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setPatient(item);
                      setPatientResults([]);
                    }}
                  >
                    <strong>{patientName(item)}</strong>
                    <small>{item.uhid} · {item.primaryMobile || "-"}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </label>

      <label>
        <span>Branch *</span>
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
          {branches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.branchName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Department *</span>
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
          {departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.departmentName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Doctor *</span>
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
          {doctors.map((item) => (
            <option key={item.id} value={item.id}>
              {doctorName(item)}
              {item.specialization ? ` — ${item.specialization}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Appointment Date *</span>
        <input
          required
          type="date"
          value={form.date}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              date: event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Start Time *</span>
        <input
          required
          type="time"
          value={form.start}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              start: event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Duration *</span>
        <select
          value={form.duration}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              duration: Number(event.target.value),
            }))
          }
        >
          {[10, 15, 20, 30, 45, 60].map((minutes) => (
            <option value={minutes} key={minutes}>
              {minutes} minutes
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Appointment Type *</span>
        <select
          value={form.appointmentType}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              appointmentType: event.target.value as AppointmentType,
            }))
          }
        >
          {APPOINTMENT_TYPES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Visit Type *</span>
        <select
          value={form.visitType}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              visitType: event.target.value as AppointmentVisitType,
            }))
          }
        >
          {VISIT_TYPES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Priority *</span>
        <select
          value={form.priority}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              priority: event.target.value as AppointmentPriority,
            }))
          }
        >
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Booking Source</span>
        <select
          value={form.source}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              source: event.target.value,
            }))
          }
        >
          <option value="RECEPTION">Reception</option>
          <option value="PHONE">Phone</option>
          <option value="ONLINE">Online</option>
          <option value="WALK_IN">Walk-in</option>
          <option value="REFERRAL">Referral</option>
        </select>
      </label>

      <label className="p4-span-2">
        <span>Chief Complaint / Reason for Visit</span>
        <textarea
          rows={2}
          value={form.chiefComplaint}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              chiefComplaint: event.target.value,
            }))
          }
        />
      </label>

      <label className="p4-span-2">
        <span>Scheduling Notes</span>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />
      </label>

      <div className="p4-form-actions p4-span-2">
        <button className="p4-primary" disabled={saving}>
          {saving ? "Booking…" : "Book Appointment"}
        </button>
      </div>
    </form>
  );
}

function RescheduleForm({
  item,
  onSaved,
}: {
  item: AppointmentSummary;
  onSaved(): Promise<void>;
}) {
  const originalStart = new Date(item.startTime);
  const duration = Math.max(
    5,
    Math.round(
      (new Date(item.endTime).getTime() - originalStart.getTime()) /
        60_000,
    ),
  );

  const [date, setDate] = useState(
    new Date(item.appointmentDate).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(
    `${String(originalStart.getHours()).padStart(2, "0")}:${String(
      originalStart.getMinutes(),
    ).padStart(2, "0")}`,
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60_000);

      await rescheduleAppointment(item.id, {
        appointmentDate: new Date(`${date}T12:00:00`).toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: reason.trim() || null,
      });
      await onSaved();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointment could not be rescheduled.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="p4-form" onSubmit={submit}>
      {error ? <div className="p4-alert is-error">{error}</div> : null}
      <label>
        <span>New Date *</span>
        <input
          required
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label>
        <span>New Start Time *</span>
        <input
          required
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
        />
      </label>
      <label className="p4-span-2">
        <span>Reason</span>
        <textarea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className="p4-form-actions p4-span-2">
        <button className="p4-primary" disabled={saving}>
          {saving ? "Rescheduling…" : "Confirm Reschedule"}
        </button>
      </div>
    </form>
  );
}

function CancelForm({
  item,
  onSaved,
}: {
  item: AppointmentSummary;
  onSaved(): Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await cancelAppointment(item.id, reason.trim());
      await onSaved();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointment could not be cancelled.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="p4-form" onSubmit={submit}>
      {error ? <div className="p4-alert is-error">{error}</div> : null}
      <label className="p4-span-2">
        <span>Cancellation Reason *</span>
        <textarea
          required
          minLength={3}
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter the reason for cancellation"
        />
      </label>
      <div className="p4-form-actions p4-span-2">
        <button className="p4-danger" disabled={saving}>
          {saving ? "Cancelling…" : "Cancel Appointment"}
        </button>
      </div>
    </form>
  );
}
