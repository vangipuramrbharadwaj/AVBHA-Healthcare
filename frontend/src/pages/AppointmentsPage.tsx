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
  updateAppointment,
  linkAppointmentPatient,
  type AppointmentPriority,
  type AppointmentType,
  type AppointmentVisitType,
} from "../api/appointments.api";
import { createPatient } from "../api/patients.api";
import { listDoctorManagement, type DoctorRecord } from "../api/doctors.api";
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


type GuestAppointmentFields = {
  guestName?: string | null;
  guestMobile?: string | null;
  guestGender?: string | null;
  guestDateOfBirth?: string | null;
  chiefComplaint?: string | null;
  reason?: string | null;
  notes?: string | null;
  source?: string | null;
};

type AppointmentWithGuest = AppointmentSummary &
  GuestAppointmentFields & {
    rescheduledTo?: {
      id: string;
      appointmentNumber: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
      status: string;
    } | null;
  };

const PHASE4_APPOINTMENT_PATCH_CSS = `
.p4-hero-actions{display:flex;align-items:stretch}
.p4-working-date-stack{display:flex;flex-direction:column;gap:10px;min-width:220px}
.p4-working-date-stack label{display:flex;flex-direction:column;gap:7px}
.p4-working-date-stack button{width:100%}
.p4-booking-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,.75fr);gap:22px;align-items:start}
.p4-booking-main{min-width:0}
.p4-slot-panel{position:sticky;top:0;border:1px solid #dbe5f1;border-radius:16px;background:#f8fbff;padding:18px}
.p4-slot-panel h3{margin:0 0 5px;color:#172a44}
.p4-slot-panel p{margin:0;color:#6b7d94;font-size:12px;line-height:1.5}
.p4-slot-doctor{padding-bottom:14px;border-bottom:1px solid #e1e9f3;margin-bottom:14px}
.p4-slot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.p4-slot{min-height:42px;border:1px solid #bdd2ee;border-radius:10px;background:#fff;color:#174d9b;font-weight:700;cursor:pointer}
.p4-slot:hover:not(:disabled),.p4-slot.is-selected{background:#0b63db;color:#fff;border-color:#0b63db}
.p4-slot:disabled{cursor:not-allowed;background:#eef1f5;color:#9aa7b7;border-color:#e0e5ec;text-decoration:line-through}
.p4-booking-mode{grid-column:1/-1;display:flex;gap:8px;padding:5px;background:#eef4fb;border-radius:12px}
.p4-booking-mode button{flex:1;border:0;border-radius:9px;padding:10px 12px;background:transparent;color:#51657d;font-weight:700;cursor:pointer}
.p4-booking-mode button.is-active{background:#fff;color:#0b63db;box-shadow:0 2px 8px rgba(16,62,120,.12)}
.p4-guest-fields{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.p4-register-button{border:1px solid #0b63db!important;color:#0b63db!important;background:#fff!important}
.p4-register-button:hover{background:#eef5ff!important}
.p4-contact-cell{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.p4-phone-link{font-weight:700;color:#174d9b;text-decoration:none;white-space:nowrap}
.p4-phone-link:hover{text-decoration:underline}
.p4-whatsapp-button{border:1px solid #1f9d55!important;color:#167a43!important;background:#f4fff8!important}
.p4-whatsapp-button:hover{background:#e7f8ee!important}
.p4-edit-person{padding:12px 14px;border:1px solid #dbe5f1;border-radius:12px;background:#f8fbff;margin-bottom:16px}
.p4-edit-person strong,.p4-edit-person small{display:block}
.p4-edit-person small{margin-top:3px;color:#6b7d94}
.p4-rescheduled-to{margin-top:4px!important;color:#6f42c1!important;font-weight:700!important;line-height:1.35}
@media(max-width:980px){.p4-booking-layout{grid-template-columns:1fr}.p4-slot-panel{position:static}.p4-hero-actions{width:100%}.p4-working-date-stack{width:100%}}
@media(max-width:640px){.p4-slot-grid,.p4-guest-fields{grid-template-columns:1fr}.p4-booking-mode{flex-direction:column}}
`;

function dateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function patientName(patient?: PatientSummary | null) {
  if (!patient) return "-";
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}


function appointmentPerson(item: AppointmentWithGuest) {
  if (item.patient) {
    return {
      name: patientName(item.patient),
      detail: `${item.patient.uhid}${
        item.patient.primaryMobile ? ` · ${item.patient.primaryMobile}` : ""
      }`,
      registered: true,
    };
  }

  return {
    name: item.guestName || "Unregistered visitor",
    detail: item.guestMobile || "Mobile not recorded",
    registered: false,
  };
}


function appointmentPhone(item: AppointmentWithGuest) {
  return item.patient?.primaryMobile || item.guestMobile || "";
}

function whatsappNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

function openAppointmentWhatsApp(
  item: AppointmentWithGuest,
  hospitalName: string,
) {
  const phone = appointmentPhone(item);
  if (!phone) return;

  const person = appointmentPerson(item);
  const doctor = doctorName(item.doctor);
  const date = appointmentDay(item.appointmentDate);
  const time = appointmentTime(item.startTime);

  const message = [
    `Hello ${person.name},`,
    "",
    `Your appointment has been scheduled with ${hospitalName}.`,
    "",
    `Doctor: Dr. ${doctor}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Appointment No: ${item.appointmentNumber}`,
    "",
    "Please arrive 10 minutes before your scheduled time. If you need to reschedule, kindly contact the hospital.",
    "",
    `Thank you,`,
    hospitalName,
  ].join("\\n");

  const url = `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
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
  const { can, hasRole, user } = useAuth();
  const canCreate = hasRole("SUPER_ADMIN") || can("appointments.create");
  const canUpdate = hasRole("SUPER_ADMIN") || can("appointments.update");
  const canCancel = hasRole("SUPER_ADMIN") || can("appointments.cancel");
  const canReschedule =
    hasRole("SUPER_ADMIN") || can("appointments.reschedule");
  const canRegisterPatient =
    hasRole("SUPER_ADMIN") ||
    (can("patients.create") && can("appointments.update"));

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
    mode: "EDIT" | "RESCHEDULE" | "CANCEL";
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
      <style>{PHASE4_APPOINTMENT_PATCH_CSS}</style>
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
          <div className="p4-working-date-stack">
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
                  <th>Phone</th>
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
                      {item.status === "RESCHEDULED" &&
                      (item as AppointmentWithGuest).rescheduledTo ? (
                        <small className="p4-rescheduled-to">
                          Rescheduled to{" "}
                          {appointmentDay(
                            (item as AppointmentWithGuest).rescheduledTo!
                              .appointmentDate,
                          )}{" "}
                          ·{" "}
                          {appointmentTime(
                            (item as AppointmentWithGuest).rescheduledTo!
                              .startTime,
                          )}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      {(() => {
                        const person = appointmentPerson(
                          item as AppointmentWithGuest,
                        );
                        return (
                          <>
                            <strong>{person.name}</strong>
                            <small>{person.detail}</small>
                            {!person.registered && canRegisterPatient ? (
                              <button
                                type="button"
                                className="p4-register-button"
                                disabled={busy === item.id}
                                onClick={async () => {
                                  const guest = item as AppointmentWithGuest;
                                  if (!guest.guestName || !guest.guestMobile) {
                                    setError(
                                      "Guest name and mobile are required before patient registration.",
                                    );
                                    return;
                                  }

                                  const parts = guest.guestName
                                    .trim()
                                    .split(/\s+/);
                                  const firstName = parts.shift() || guest.guestName;
                                  const lastName = parts.join(" ") || undefined;

                                  setBusy(item.id);
                                  setError("");
                                  setSuccess("");
                                  try {
                                    const registered = await createPatient({
                                      ...(item.branch?.id
                                        ? { branchId: item.branch.id }
                                        : {}),
                                      firstName,
                                      ...(lastName ? { lastName } : {}),
                                      primaryMobile: guest.guestMobile,
                                      ...(guest.guestGender
                                        ? { gender: guest.guestGender }
                                        : {}),
                                      ...(guest.guestDateOfBirth
                                        ? { dateOfBirth: guest.guestDateOfBirth }
                                        : {}),
                                      addresses: [],
                                      emergencyContacts: [],
                                    });

                                    await linkAppointmentPatient(
                                      item.id,
                                      registered.id,
                                    );
                                    setSuccess(
                                      `${registered.uhid} registered and linked to ${item.appointmentNumber}.`,
                                    );
                                    await load();
                                  } catch (value) {
                                    setError(
                                      value instanceof Error
                                        ? value.message
                                        : "Visitor could not be registered as a patient.",
                                    );
                                  } finally {
                                    setBusy(null);
                                  }
                                }}
                              >
                                Register as Patient
                              </button>
                            ) : null}
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const phone = appointmentPhone(
                          item as AppointmentWithGuest,
                        );
                        return phone ? (
                          <div className="p4-contact-cell">
                            <a className="p4-phone-link" href={`tel:${phone}`}>
                              {phone}
                            </a>
                          </div>
                        ) : (
                          <small>—</small>
                        );
                      })()}
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
                        {canUpdate ? (
                          <button
                            onClick={() =>
                              setAction({ mode: "EDIT", item })
                            }
                          >
                            Edit
                          </button>
                        ) : null}
                        {appointmentPhone(item as AppointmentWithGuest) ? (
                          <button
                            type="button"
                            className="p4-whatsapp-button"
                            onClick={() =>
                              openAppointmentWhatsApp(
                                item as AppointmentWithGuest,
                                user?.hospital?.name || "AVBHA Healthcare",
                              )
                            }
                          >
                            WhatsApp
                          </button>
                        ) : null}
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

      {action?.mode === "EDIT" ? (
        <Modal
          title={`Edit ${action.item.appointmentNumber}`}
          onClose={() => setAction(null)}
        >
          <EditAppointmentForm
            item={action.item as AppointmentWithGuest}
            branches={branches}
            onSaved={async () => {
              setAction(null);
              setSuccess("Appointment updated successfully.");
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
  const [bookingMode, setBookingMode] = useState<"EXISTING" | "GUEST">(
    "EXISTING",
  );
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [doctorProfiles, setDoctorProfiles] = useState<DoctorRecord[]>([]);
  const [bookedForDoctor, setBookedForDoctor] =
    useState<AppointmentSummary[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [guest, setGuest] = useState({
    name: "",
    mobile: "",
    gender: "",
    dateOfBirth: "",
  });

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
    void listDoctorManagement()
      .then((result) => setDoctorProfiles(result.items))
      .catch(() => setDoctorProfiles([]));
  }, []);

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

  const selectedDoctorProfile = useMemo(
    () => doctorProfiles.find((item) => item.id === form.doctorId) ?? null,
    [doctorProfiles, form.doctorId],
  );

  useEffect(() => {
    if (!selectedDoctorProfile) return;
    const minutes = selectedDoctorProfile.averageConsultationMinutes ?? 15;
    setForm((current) => ({
      ...current,
      duration: minutes,
    }));
  }, [selectedDoctorProfile]);

  useEffect(() => {
    if (!form.doctorId || !form.date) {
      setBookedForDoctor([]);
      return;
    }

    setSlotsLoading(true);
    const from = `${form.date}T00:00:00.000Z`;
    const to = `${form.date}T23:59:59.999Z`;

    void listAppointments({
      page: 1,
      pageSize: 100,
      doctorId: form.doctorId,
      dateFrom: from,
      dateTo: to,
      sortOrder: "asc",
    })
      .then((result) => setBookedForDoctor(result.items))
      .catch(() => setBookedForDoctor([]))
      .finally(() => setSlotsLoading(false));
  }, [form.doctorId, form.date]);

  useEffect(() => {
    if (
      bookingMode !== "EXISTING" ||
      patient !== null ||
      patientQuery.trim().length < 2
    ) {
      setPatientResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void searchPatients(patientQuery.trim())
        .then(setPatientResults)
        .catch(() => setPatientResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [bookingMode, patientQuery, patient]);

  const slotDuration =
    selectedDoctorProfile?.averageConsultationMinutes ??
    form.duration ??
    15;

  const slots = useMemo(() => {
    const result: Array<{
      value: string;
      label: string;
      booked: boolean;
    }> = [];

    const startMinutes = 9 * 60;
    const endMinutes = 18 * 60;

    for (
      let minute = startMinutes;
      minute + slotDuration <= endMinutes;
      minute += slotDuration
    ) {
      const hours = Math.floor(minute / 60);
      const minutes = minute % 60;
      const value = `${String(hours).padStart(2, "0")}:${String(
        minutes,
      ).padStart(2, "0")}`;

      const slotStart = new Date(`${form.date}T${value}:00`);
      const slotEnd = new Date(
        slotStart.getTime() + slotDuration * 60_000,
      );

      const booked = bookedForDoctor.some((appointment) => {
        if (
          ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(
            appointment.status,
          )
        ) {
          return false;
        }
        const bookedStart = new Date(appointment.startTime);
        const bookedEnd = new Date(appointment.endTime);
        return bookedStart < slotEnd && bookedEnd > slotStart;
      });

      result.push({
        value,
        label: slotStart.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        booked,
      });
    }

    return result;
  }, [bookedForDoctor, form.date, slotDuration]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (bookingMode === "EXISTING" && !patient) {
      setError("Select the patient from search results.");
      return;
    }

    if (
      bookingMode === "GUEST" &&
      (!guest.name.trim() || !guest.mobile.trim())
    ) {
      setError("Visitor name and mobile are required.");
      return;
    }

    if (!form.doctorId) {
      setError("Select a doctor.");
      return;
    }

    const start = new Date(`${form.date}T${form.start}:00`);
    const end = new Date(
      start.getTime() + slotDuration * 60_000,
    );

    setSaving(true);
    try {
      const record = await createAppointment({
        branchId: form.branchId,
        departmentId: form.departmentId,
        doctorId: form.doctorId,
        ...(patient ? { patientId: patient.id } : {}),
        ...(bookingMode === "GUEST"
          ? {
              guestName: guest.name.trim(),
              guestMobile: guest.mobile.trim(),
              ...(guest.gender ? { guestGender: guest.gender } : {}),
              ...(guest.dateOfBirth
                ? { guestDateOfBirth: guest.dateOfBirth }
                : {}),
            }
          : {}),
        appointmentDate: new Date(`${form.date}T12:00:00`).toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: slotDuration,
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
    <div className="p4-booking-layout">
      <form className="p4-form p4-booking-main" onSubmit={submit}>
        {error ? <div className="p4-alert is-error">{error}</div> : null}

        <div className="p4-booking-mode">
          <button
            type="button"
            className={bookingMode === "EXISTING" ? "is-active" : ""}
            onClick={() => {
              setBookingMode("EXISTING");
              setGuest({ name: "", mobile: "", gender: "", dateOfBirth: "" });
            }}
          >
            Existing Patient
          </button>
          <button
            type="button"
            className={bookingMode === "GUEST" ? "is-active" : ""}
            onClick={() => {
              setBookingMode("GUEST");
              setPatient(null);
              setPatientQuery("");
              setPatientResults([]);
            }}
          >
            New / Unregistered Visitor
          </button>
        </div>

        {bookingMode === "EXISTING" ? (
          <label className="p4-span-2">
            <span>Patient *</span>
            {patient ? (
              <div className="p4-selected">
                <div>
                  <strong>{patientName(patient)}</strong>
                  <small>
                    {patient.uhid} · {patient.primaryMobile || "-"}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatient(null);
                    setPatientQuery("");
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="p4-search-box">
                <input
                  placeholder="Search UHID, patient name or mobile"
                  value={patientQuery}
                  onChange={(event) => {
                    setPatientQuery(event.target.value);
                    setError("");
                  }}
                  autoComplete="off"
                />
                {patientResults.length ? (
                  <div className="p4-search-results">
                    {patientResults.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPatient(item);
                          setPatientQuery(patientName(item));
                          setPatientResults([]);
                          setError("");
                        }}
                      >
                        <strong>{patientName(item)}</strong>
                        <small>
                          {item.uhid} · {item.primaryMobile || "-"}
                        </small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </label>
        ) : (
          <div className="p4-guest-fields">
            <label>
              <span>Visitor Name *</span>
              <input
                required
                value={guest.name}
                onChange={(event) =>
                  setGuest((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Full name"
              />
            </label>
            <label>
              <span>Mobile *</span>
              <input
                required
                value={guest.mobile}
                onChange={(event) =>
                  setGuest((current) => ({
                    ...current,
                    mobile: event.target.value,
                  }))
                }
                placeholder="Mobile number"
              />
            </label>
            <label>
              <span>Gender</span>
              <select
                value={guest.gender}
                onChange={(event) =>
                  setGuest((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span>Date of Birth</span>
              <input
                type="date"
                value={guest.dateOfBirth}
                onChange={(event) =>
                  setGuest((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        )}

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
          <span>Duration</span>
          <input
            value={`${slotDuration} minutes`}
            readOnly
          />
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

      <aside className="p4-slot-panel">
        <div className="p4-slot-doctor">
          <h3>
            {selectedDoctorProfile
              ? [
                  selectedDoctorProfile.employee.firstName,
                  selectedDoctorProfile.employee.middleName,
                  selectedDoctorProfile.employee.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
              : "Doctor availability"}
          </h3>
          <p>
            {selectedDoctorProfile
              ? `${selectedDoctorProfile.specialization} · ${slotDuration} minutes per consultation`
              : "Select a department and doctor to view available slots."}
          </p>
        </div>

        {!form.doctorId ? (
          <p>Select a doctor to see the slot-wise schedule.</p>
        ) : slotsLoading ? (
          <p>Loading available slots…</p>
        ) : (
          <>
            <p>
              Available slots for{" "}
              {new Date(`${form.date}T12:00:00`).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}
            </p>
            <div className="p4-slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  className={`p4-slot ${
                    form.start === slot.value ? "is-selected" : ""
                  }`}
                  disabled={slot.booked}
                  title={
                    slot.booked
                      ? "Already booked"
                      : "Select this appointment slot"
                  }
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      start: slot.value,
                    }))
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}


function EditAppointmentForm({
  item,
  branches,
  onSaved,
}: {
  item: AppointmentWithGuest;
  branches: BranchSummary[];
  onSaved(): Promise<void>;
}) {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startDate = new Date(item.startTime);
  const initialDate = new Date(item.appointmentDate);
  const initialDuration = Math.max(
    5,
    Math.round(
      (new Date(item.endTime).getTime() - startDate.getTime()) / 60_000,
    ),
  );

  const [form, setForm] = useState({
    branchId: item.branch?.id || "",
    departmentId: item.department?.id || "",
    doctorId: item.doctor?.id || "",
    date: `${initialDate.getFullYear()}-${String(
      initialDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(initialDate.getDate()).padStart(2, "0")}`,
    start: `${String(startDate.getHours()).padStart(2, "0")}:${String(
      startDate.getMinutes(),
    ).padStart(2, "0")}`,
    duration: initialDuration,
    appointmentType: item.appointmentType as AppointmentType,
    visitType: item.visitType as AppointmentVisitType,
    priority: item.priority as AppointmentPriority,
    chiefComplaint: item.chiefComplaint || "",
    notes: item.notes || "",
    source: item.source || "RECEPTION",
    guestName: item.guestName || "",
    guestMobile: item.guestMobile || "",
    guestGender: item.guestGender || "",
    guestDateOfBirth: item.guestDateOfBirth
      ? String(item.guestDateOfBirth).slice(0, 10)
      : "",
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const start = new Date(`${form.date}T${form.start}:00`);
      const end = new Date(start.getTime() + form.duration * 60_000);

      await updateAppointment(item.id, {
        branchId: form.branchId,
        departmentId: form.departmentId,
        doctorId: form.doctorId,
        appointmentDate: new Date(
          `${form.date}T12:00:00`,
        ).toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: form.duration,
        appointmentType: form.appointmentType,
        visitType: form.visitType,
        priority: form.priority,
        chiefComplaint: form.chiefComplaint.trim() || null,
        notes: form.notes.trim() || null,
        source: form.source || null,
        ...(!item.patient
          ? {
              guestName: form.guestName.trim(),
              guestMobile: form.guestMobile.trim(),
              guestGender: form.guestGender || null,
              guestDateOfBirth: form.guestDateOfBirth
                ? new Date(
                    `${form.guestDateOfBirth}T12:00:00`,
                  ).toISOString()
                : null,
            }
          : {}),
      });

      await onSaved();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Appointment could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  const person = appointmentPerson(item);

  return (
    <form className="p4-form" onSubmit={submit}>
      {error ? <div className="p4-alert is-error">{error}</div> : null}

      <div className="p4-edit-person p4-span-2">
        <strong>{person.name}</strong>
        <small>{person.detail}</small>
      </div>

      {!item.patient ? (
        <div className="p4-guest-fields">
          <label>
            <span>Visitor Name *</span>
            <input
              required
              value={form.guestName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  guestName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Mobile *</span>
            <input
              required
              value={form.guestMobile}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  guestMobile: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Gender</span>
            <select
              value={form.guestGender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  guestGender: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </label>
          <label>
            <span>Date of Birth</span>
            <input
              type="date"
              value={form.guestDateOfBirth}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  guestDateOfBirth: event.target.value,
                }))
              }
            />
          </label>
        </div>
      ) : null}

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
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
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
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.departmentName}
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
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctorName(doctor)}
              {doctor.specialization
                ? ` — ${doctor.specialization}`
                : ""}
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
            <option key={minutes} value={minutes}>
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
              appointmentType:
                event.target.value as AppointmentType,
            }))
          }
        >
          {APPOINTMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {label(type)}
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
          {VISIT_TYPES.map((type) => (
            <option key={type} value={type}>
              {label(type)}
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
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {label(priority)}
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
          {saving ? "Saving…" : "Save Appointment Changes"}
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
