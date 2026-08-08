import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  updateAppointmentForReception,
  completeOpdVisit,
  getReceptionDoctorAvailableSlots,
  listReceptionDoctorSchedules,
  listReceptionDoctors,
  type ReceptionDoctor,
  type ReceptionDoctorSchedule,
  type ReceptionDoctorSlot,
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


type TodayDoctorAvailability = {
  doctor: ReceptionDoctor;
  schedules: ReceptionDoctorSchedule[];
  slots: ReceptionDoctorSlot[];
};

function nameOfReceptionDoctor(doctor: ReceptionDoctor): string {
  const employeeName = [
    doctor.employee?.firstName,
    doctor.employee?.middleName,
    doctor.employee?.lastName,
  ].filter(Boolean).join(" ");

  const externalName = [
    doctor.title,
    doctor.firstName,
    doctor.middleName,
    doctor.lastName,
  ].filter(Boolean).join(" ");

  return employeeName || externalName || doctor.doctorCode || "Doctor";
}

function shortTime(value?: string | null): string {
  if (!value) return "-";
  if (/^\d{2}:\d{2}/.test(value)) {
    const [hour = "0", minute = "0"] = value.split(":");
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return displayTime(value);
}

function futureAvailableSlots(
  slots: ReceptionDoctorSlot[],
  selectedDate: string,
): ReceptionDoctorSlot[] {
  const available = slots
    .filter((slot) => slot.available)
    .sort(
      (left, right) =>
        new Date(left.startTime).getTime() -
        new Date(right.startTime).getTime(),
    );

  if (selectedDate !== today()) {
    return available;
  }

  const now = Date.now();

  return available.filter(
    (slot) => new Date(slot.startTime).getTime() >= now,
  );
}

function nextAvailableSlot(
  slots: ReceptionDoctorSlot[],
  selectedDate: string,
): ReceptionDoctorSlot | null {
  return futureAvailableSlots(slots, selectedDate)[0] ?? null;
}


type CheckInResolution = {
  appointment: AppointmentSummary;
  selectedDoctorId: string;
  selectedSlotStart: string;
};

function sameMinute(left: string, right: string): boolean {
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) < 60_000;
}

function appointmentDoctorIsAvailable(
  appointment: AppointmentSummary,
  availability: TodayDoctorAvailability[],
): boolean {
  const doctor = availability.find(
    (item) => item.doctor.id === appointment.doctor.id,
  );

  if (!doctor) return false;

  const appointmentSlot = doctor.slots.find((slot) =>
    sameMinute(slot.startTime, appointment.startTime),
  );

  if (!appointmentSlot) return false;

  // The doctor's own appointment normally makes this slot BOOKED.
  // That still means the doctor is scheduled and available for this patient.
  return (
    appointmentSlot.available ||
    appointmentSlot.reason === "BOOKED"
  );
}

export default function ReceptionOpdPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [dashboard, setDashboard] =
    useState<AppointmentDashboard>(EMPTY_DASHBOARD);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [visits, setVisits] = useState<OpdVisitSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [todayDoctors, setTodayDoctors] = useState<TodayDoctorAvailability[]>([]);
  const [doctorAvailabilityLoading, setDoctorAvailabilityLoading] = useState(false);
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
  const [opdSlots, setOpdSlots] = useState<ReceptionDoctorSlot[]>([]);
  const [opdSlotsLoading, setOpdSlotsLoading] = useState(false);
  const [selectedOpdSlot, setSelectedOpdSlot] = useState("");
  const [checkInResolution, setCheckInResolution] =
    useState<CheckInResolution | null>(null);
  const [checkInResolving, setCheckInResolving] = useState(false);
  const doctorCarouselRef = useRef<HTMLDivElement | null>(null);

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
    if (!form.branchId || !selectedDate) {
      setTodayDoctors([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      setDoctorAvailabilityLoading(true);
      try {
        const allDoctors = await listReceptionDoctors();
        const targetDate = new Date(`${selectedDate}T12:00:00`);
        const dayOfWeek = targetDate.getDay();

        const rows = await Promise.all(
          allDoctors.map(async (doctor) => {
            const schedules = await listReceptionDoctorSchedules(
              doctor.id,
              form.branchId,
            );

            const validSchedules = schedules.filter((schedule) => {
              if (
                schedule.status !== "ACTIVE" ||
                schedule.branchId !== form.branchId ||
                schedule.dayOfWeek !== dayOfWeek
              ) return false;

              const from = String(schedule.effectiveFrom).slice(0, 10);
              const to = schedule.effectiveTo
                ? String(schedule.effectiveTo).slice(0, 10)
                : null;

              return from <= selectedDate && (!to || to >= selectedDate);
            });

            if (validSchedules.length === 0) return null;

            const slotResult = await getReceptionDoctorAvailableSlots(
              doctor.id,
              form.branchId,
              selectedDate,
            );

            return {
              doctor,
              schedules: validSchedules,
              slots: slotResult.slots,
            } as TodayDoctorAvailability;
          }),
        );

        if (!cancelled) {
          setTodayDoctors(
            rows
              .filter((item): item is TodayDoctorAvailability => item !== null)
              .sort((a, b) =>
                (a.schedules[0]?.startTime ?? "99:99").localeCompare(
                  b.schedules[0]?.startTime ?? "99:99",
                ),
              ),
          );
        }
      } catch {
        if (!cancelled) setTodayDoctors([]);
      } finally {
        if (!cancelled) setDoctorAvailabilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.branchId, selectedDate]);

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
    if (!form.doctorId || !form.branchId || !selectedDate) {
      setOpdSlots([]);
      setSelectedOpdSlot("");
      return;
    }

    let cancelled = false;

    void (async () => {
      setOpdSlotsLoading(true);
      try {
        const result = await getReceptionDoctorAvailableSlots(
          form.doctorId,
          form.branchId,
          selectedDate,
        );

        if (cancelled) return;

        const available = futureAvailableSlots(
          result.slots,
          selectedDate,
        );
        setOpdSlots(available);

        const defaultSlot = available[0];
        setSelectedOpdSlot(defaultSlot?.startTime ?? "");
      } catch {
        if (!cancelled) {
          setOpdSlots([]);
          setSelectedOpdSlot("");
        }
      } finally {
        if (!cancelled) setOpdSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.doctorId, form.branchId, selectedDate]);

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

  async function finalizeAppointmentCheckIn(
    item: AppointmentSummary,
    options?: {
      doctorId?: string;
      departmentId?: string;
      slotStart?: string;
      slotEnd?: string;
      durationMinutes?: number;
    },
  ) {
    const existing = visits.find(
      (visit) => visit.appointmentId === item.id,
    );

    let appointmentForOpd = item;

    if (
      options?.doctorId &&
      options.departmentId &&
      options.slotStart &&
      options.slotEnd
    ) {
      appointmentForOpd = await updateAppointmentForReception(
        item.id,
        {
          doctorId: options.doctorId,
          departmentId: options.departmentId,
          startTime: options.slotStart,
          endTime: options.slotEnd,
          durationMinutes: options.durationMinutes ?? 15,
        },
      );
    }

    await updateAppointmentStatus(item.id, "CHECKED_IN");

    if (!existing) {
      const patientId = appointmentForOpd.patient?.id;
      if (!patientId) {
        throw new Error(
          "This appointment is not linked to a registered patient. Register/link the patient before check-in.",
        );
      }

      await createOpdVisit({
        branchId: appointmentForOpd.branch?.id ?? "",
        departmentId:
          options?.departmentId ??
          appointmentForOpd.department?.id ??
          "",
        doctorId:
          options?.doctorId ??
          appointmentForOpd.doctor.id,
        patientId,
        appointmentId: item.id,
        visitDate: new Date().toISOString(),
        visitType:
          appointmentForOpd.visitType === "FOLLOW_UP"
            ? "FOLLOW_UP"
            : "NEW",
        chiefComplaint: appointmentForOpd.chiefComplaint ?? null,
        notes: options?.doctorId
          ? `Checked in from appointment ${appointmentForOpd.appointmentNumber}; doctor/slot reassigned at reception. OPD visit started at actual check-in time.`
          : `Checked in from appointment ${appointmentForOpd.appointmentNumber}; OPD visit started at actual check-in time.`,
      });
    }

    setSuccess(
      `${nameOfPatient(appointmentForOpd.patient)} checked in and converted to OPD successfully.`,
    );
    setCheckInResolution(null);
    await loadDay();
  }

  async function handleAppointmentCheckIn(item: AppointmentSummary) {
    setBusyId(item.id);
    setError("");
    setSuccess("");

    try {
      if (!item.patient?.id) {
        throw new Error(
          "Register or link this visitor as a patient before check-in.",
        );
      }

      if (!appointmentDoctorIsAvailable(item, todayDoctors)) {
        setCheckInResolution({
          appointment: item,
          selectedDoctorId: "",
          selectedSlotStart: "",
        });
        return;
      }

      await finalizeAppointmentCheckIn(item);
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

  async function confirmAlternativeDoctorCheckIn() {
    if (!checkInResolution) return;

    const selected = todayDoctors.find(
      (item) =>
        item.doctor.id === checkInResolution.selectedDoctorId,
    );
    if (!selected) {
      setError("Select an available doctor.");
      return;
    }

    const slot = selected.slots.find(
      (item) =>
        item.available &&
        item.startTime === checkInResolution.selectedSlotStart,
    );
    if (!slot) {
      setError("Select an available slot for the new doctor.");
      return;
    }

    setCheckInResolving(true);
    setError("");
    setSuccess("");

    try {
      await finalizeAppointmentCheckIn(
        checkInResolution.appointment,
        {
          doctorId: selected.doctor.id,
          departmentId:
            selected.doctor.department?.id ??
            selected.doctor.departmentId,
          slotStart: slot.startTime,
          slotEnd: slot.endTime,
          durationMinutes:
            selected.doctor.averageConsultationMinutes ??
            selected.schedules[0]?.slotDuration ??
            15,
        },
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to reassign doctor and check in.",
      );
    } finally {
      setCheckInResolving(false);
    }
  }

  function scrollDoctorCarousel(direction: "back" | "forward") {
    const container = doctorCarouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(".p3-doctor-card");
    const distance =
      firstCard?.getBoundingClientRect().width ??
      Math.max(container.clientWidth * 0.8, 320);

    container.scrollBy({
      left: direction === "forward" ? distance + 16 : -(distance + 16),
      behavior: "smooth",
    });
  }

  function selectDoctorForOpd(item: TodayDoctorAvailability) {
    setSelectedOpdSlot("");
    setOpdSlots([]);
    setForm((current) => ({
      ...current,
      departmentId: item.doctor.department?.id || item.doctor.departmentId,
      doctorId: item.doctor.id,
    }));

    window.setTimeout(() => {
      document.querySelector(".p3-grid-top")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
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

    if (!selectedOpdSlot) {
      setError("Select an available doctor slot for this OPD visit.");
      return;
    }

    setBusyId("walk-in");

    try {
      const visit = await createOpdVisit({
        branchId: form.branchId,
        departmentId: form.departmentId,
        doctorId: form.doctorId,
        patientId: selectedPatient.id,
        visitDate: selectedOpdSlot,
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
      setSelectedOpdSlot("");
      setOpdSlots([]);
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


      <section className="p3-card p3-doctors-card">
        <div className="p3-card-head p3-doctors-head">
          <div>
            <span className="p3-card-kicker">DOCTOR AVAILABILITY</span>
            <h2>
              Doctors Available{" "}
              {selectedDate === today() ? "Today" : "On Selected Date"}
            </h2>
            <p>
              Working hours, next available slot and remaining OPD capacity.
            </p>
          </div>

          <div className="p3-doctor-carousel-controls">
            <span className="p3-chip">{todayDoctors.length} scheduled</span>
            <button
              type="button"
              className="p3-carousel-arrow"
              aria-label="Previous doctors"
              title="Previous doctors"
              onClick={() => scrollDoctorCarousel("back")}
            >
              ‹
            </button>
            <button
              type="button"
              className="p3-carousel-arrow"
              aria-label="Next doctors"
              title="Next doctors"
              onClick={() => scrollDoctorCarousel("forward")}
            >
              ›
            </button>
          </div>
        </div>

        {doctorAvailabilityLoading ? (
          <div className="p3-empty">Loading doctor availability…</div>
        ) : todayDoctors.length === 0 ? (
          <div className="p3-empty">
            No doctors have working hours configured for this date.
          </div>
        ) : (
          <div
            className="p3-doctor-grid p3-doctor-carousel"
            ref={doctorCarouselRef}
          >
            {todayDoctors.map((item) => {
              const nextSlot = nextAvailableSlot(item.slots, selectedDate);
              const usableSlots = futureAvailableSlots(
                item.slots,
                selectedDate,
              );
              const availableCount = usableSlots.length;
              const totalCount = item.slots.length;
              const fullyBooked = totalCount > 0 && availableCount === 0;

              return (
                <article className="p3-doctor-card" key={item.doctor.id}>
                  <div className="p3-doctor-card-top">
                    <div className="p3-doctor-avatar">
                      {nameOfReceptionDoctor(item.doctor)
                        .replace(/^Dr\.?\s*/i, "")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="p3-doctor-title">
                      <strong>{nameOfReceptionDoctor(item.doctor)}</strong>
                      <span>
                        {item.doctor.department?.departmentName || "Department"}
                        {item.doctor.specialization
                          ? ` · ${item.doctor.specialization}`
                          : ""}
                      </span>
                    </div>
                    <span
                      className={`p3-doctor-state ${
                        fullyBooked ? "is-full" : "is-available"
                      }`}
                    >
                      {fullyBooked ? "Fully booked" : "Available"}
                    </span>
                  </div>

                  <div className="p3-doctor-hours">
                    {item.schedules.map((schedule) => (
                      <span key={schedule.id}>
                        {shortTime(schedule.startTime)} – {shortTime(schedule.endTime)}
                      </span>
                    ))}
                  </div>

                  <div className="p3-doctor-meta">
                    <div>
                      <span>Consultation</span>
                      <strong>
                        {item.doctor.averageConsultationMinutes ??
                          item.schedules[0]?.slotDuration ??
                          15} min
                      </strong>
                    </div>
                    <div>
                      <span>Next slot</span>
                      <strong>
                        {nextSlot ? displayTime(nextSlot.startTime) : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Open slots</span>
                      <strong>{availableCount}</strong>
                    </div>
                  </div>

                  <div className="p3-doctor-actions">
                    <button
                      type="button"
                      className="p3-doctor-opd"
                      onClick={() => selectDoctorForOpd(item)}
                    >
                      Use for OPD
                    </button>
                    <a className="p3-doctor-appointments" href="/appointments">
                      Appointments
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
                onChange={(event) => {
                  setSelectedOpdSlot("");
                  setOpdSlots([]);
                  setForm((current) => ({
                    ...current,
                    branchId: event.target.value,
                    departmentId: "",
                    doctorId: "",
                  }));
                }}
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
                onChange={(event) => {
                  setSelectedOpdSlot("");
                  setOpdSlots([]);
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                    doctorId: "",
                  }));
                }}
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
                onChange={(event) => {
                  setSelectedOpdSlot("");
                  setForm((current) => ({
                    ...current,
                    doctorId: event.target.value,
                  }));
                }}
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
              <label>OPD slot *</label>
              <select
                required
                value={selectedOpdSlot}
                disabled={!form.doctorId || opdSlotsLoading}
                onChange={(event) => setSelectedOpdSlot(event.target.value)}
              >
                <option value="">
                  {opdSlotsLoading
                    ? "Loading available slots…"
                    : !form.doctorId
                      ? "Select doctor first"
                      : opdSlots.length === 0
                        ? "No available slots"
                        : "Select available slot"}
                </option>
                {opdSlots.map((slot) => (
                  <option value={slot.startTime} key={slot.startTime}>
                    {displayTime(slot.startTime)} – {displayTime(slot.endTime)}
                  </option>
                ))}
              </select>
              {selectedOpdSlot && (
                <small>
                  Defaulted to the next available slot. You can change it if required.
                </small>
              )}
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

      {checkInResolution && (
        <div className="p3-checkin-overlay" role="presentation">
          <section
            className="p3-checkin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="p3-checkin-title"
          >
            <div className="p3-checkin-head">
              <div>
                <span>CHECK-IN REVIEW</span>
                <h2 id="p3-checkin-title">Assigned doctor is not available</h2>
                <p>
                  {nameOfPatient(checkInResolution.appointment.patient)} cannot
                  be checked in with the currently assigned doctor/slot.
                  Choose another available doctor, or reschedule the appointment.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCheckInResolution(null)}
              >
                ×
              </button>
            </div>

            <div className="p3-checkin-current">
              <div>
                <span>Appointment</span>
                <strong>
                  {checkInResolution.appointment.appointmentNumber}
                </strong>
              </div>
              <div>
                <span>Current doctor</span>
                <strong>
                  {nameOfDoctor(checkInResolution.appointment.doctor)}
                </strong>
              </div>
              <div>
                <span>Booked time</span>
                <strong>
                  {displayTime(checkInResolution.appointment.startTime)}
                </strong>
              </div>
            </div>

            <div className="p3-checkin-fields">
              <div className="p3-field">
                <label>Alternative doctor</label>
                <select
                  value={checkInResolution.selectedDoctorId}
                  onChange={(event) =>
                    setCheckInResolution((current) =>
                      current
                        ? {
                            ...current,
                            selectedDoctorId: event.target.value,
                            selectedSlotStart: "",
                          }
                        : current,
                    )
                  }
                >
                  <option value="">Select available doctor</option>
                  {todayDoctors
                    .filter(
                      (item) =>
                        item.doctor.id !==
                          checkInResolution.appointment.doctor.id &&
                        futureAvailableSlots(
                          item.slots,
                          selectedDate,
                        ).length > 0,
                    )
                    .map((item) => (
                      <option value={item.doctor.id} key={item.doctor.id}>
                        {nameOfReceptionDoctor(item.doctor)}
                        {" — "}
                        {item.doctor.department?.departmentName ??
                          item.doctor.specialization}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p3-field">
                <label>Available slot</label>
                <select
                  value={checkInResolution.selectedSlotStart}
                  disabled={!checkInResolution.selectedDoctorId}
                  onChange={(event) =>
                    setCheckInResolution((current) =>
                      current
                        ? {
                            ...current,
                            selectedSlotStart: event.target.value,
                          }
                        : current,
                    )
                  }
                >
                  <option value="">
                    {checkInResolution.selectedDoctorId
                      ? "Select available slot"
                      : "Select doctor first"}
                  </option>
                  {futureAvailableSlots(
                    todayDoctors.find(
                      (item) =>
                        item.doctor.id ===
                        checkInResolution.selectedDoctorId,
                    )?.slots ?? [],
                    selectedDate,
                  ).map((slot) => (
                    <option value={slot.startTime} key={slot.startTime}>
                      {displayTime(slot.startTime)} –{" "}
                      {displayTime(slot.endTime)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p3-checkin-note">
              Selecting another doctor updates this appointment first, then
              checks the patient in and automatically creates the linked OPD visit.
            </div>

            <div className="p3-checkin-actions">
              <button
                type="button"
                className="p3-checkin-secondary"
                onClick={() => {
                  window.location.href = "/appointments";
                }}
              >
                Reschedule Appointment
              </button>
              <button
                type="button"
                className="p3-checkin-secondary"
                onClick={() => setCheckInResolution(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="p3-checkin-primary"
                disabled={
                  checkInResolving ||
                  !checkInResolution.selectedDoctorId ||
                  !checkInResolution.selectedSlotStart
                }
                onClick={() => void confirmAlternativeDoctorCheckIn()}
              >
                {checkInResolving
                  ? "Checking in…"
                  : "Assign Doctor & Check In"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
