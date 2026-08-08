import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  archiveDoctorSchedule,
  createDoctor,
  createDoctorSchedule,
  listBranchOptions,
  listDepartmentOptions,
  listDoctorManagement,
  listDoctorSchedules,
  listEmployeeOptions,
  updateDoctor,
  updateDoctorSchedule,
  type BranchOption,
  type DepartmentOption,
  type DoctorRecord,
  type DoctorSchedule,
  type EmployeeOption,
} from "../api/doctors.api";
import "../styles/doctors.css";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type AvailabilityRow = {
  key: string;
  id?: string;
  branchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string;
};

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function personName(value: {
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}) {
  return [
    value.title,
    value.firstName,
    value.middleName,
    value.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function doctorName(doctor: DoctorRecord) {
  if (doctor.employee) return personName(doctor.employee);
  return personName(doctor) || doctor.doctorCode;
}

function doctorMobile(doctor: DoctorRecord) {
  return doctor.employee?.mobile || doctor.mobile || "—";
}

function isoDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function scheduleToAvailability(
  schedule: DoctorSchedule,
): AvailabilityRow {
  return {
    key: schedule.id,
    id: schedule.id,
    branchId: schedule.branchId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    effectiveFrom: isoDate(schedule.effectiveFrom),
    effectiveTo: isoDate(schedule.effectiveTo),
  };
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DoctorRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [doctorType, setDoctorType] = useState<"EMPLOYEE" | "EXTERNAL">(
    "EMPLOYEE",
  );

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  const [form, setForm] = useState({
    employeeId: "",
    departmentId: "",

    title: "Dr",
    firstName: "",
    middleName: "",
    lastName: "",
    mobile: "",
    email: "",

    doctorCode: "",
    medicalRegistrationNumber: "",
    registrationCouncil: "",
    qualification: "",
    specialization: "",
    consultationFee: "0",
    followupFee: "0",
    emergencyFee: "0",
    averageConsultationMinutes: "15",
    isVisitingConsultant: false,
    status: "ACTIVE",
  });

  async function load() {
    setError("");
    try {
      const [
        doctorResult,
        employeeResult,
        departmentResult,
        branchResult,
      ] = await Promise.all([
        listDoctorManagement(search),
        listEmployeeOptions(),
        listDepartmentOptions(),
        listBranchOptions(),
      ]);

      setDoctors(doctorResult.items);
      setEmployees(employeeResult.items);
      setDepartments(departmentResult.items);
      setBranches(branchResult.items);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load Doctor Management.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const availableEmployees = useMemo(() => {
    const used = new Set(
      doctors
        .filter((doctor) => doctor.id !== editing?.id)
        .map((doctor) => doctor.employeeId)
        .filter((id): id is string => Boolean(id)),
    );

    return employees.filter((employee) => !used.has(employee.id));
  }, [employees, doctors, editing]);

  function blankAvailability(): AvailabilityRow {
    return {
      key: crypto.randomUUID(),
      branchId: branches[0]?.id ?? "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "11:00",
      effectiveFrom: todayInput(),
      effectiveTo: "",
    };
  }

  function reset() {
    setDoctorType("EMPLOYEE");
    setAvailability([]);
    setForm({
      employeeId: "",
      departmentId: "",

      title: "Dr",
      firstName: "",
      middleName: "",
      lastName: "",
      mobile: "",
      email: "",

      doctorCode: "",
      medicalRegistrationNumber: "",
      registrationCouncil: "",
      qualification: "",
      specialization: "",
      consultationFee: "0",
      followupFee: "0",
      emergencyFee: "0",
      averageConsultationMinutes: "15",
      isVisitingConsultant: false,
      status: "ACTIVE",
    });
  }

  function beginCreate() {
    setEditing(null);
    reset();
    setOpen(true);
  }

  async function beginEdit(doctor: DoctorRecord) {
    setEditing(doctor);
    setDoctorType(doctor.employeeId ? "EMPLOYEE" : "EXTERNAL");
    setError("");

    setForm({
      employeeId: doctor.employeeId ?? "",
      departmentId: doctor.department.id,

      title: doctor.title ?? "Dr",
      firstName: doctor.firstName ?? "",
      middleName: doctor.middleName ?? "",
      lastName: doctor.lastName ?? "",
      mobile: doctor.mobile ?? "",
      email: doctor.email ?? "",

      doctorCode: doctor.doctorCode,
      medicalRegistrationNumber: doctor.medicalRegistrationNumber,
      registrationCouncil: doctor.registrationCouncil ?? "",
      qualification: doctor.qualification,
      specialization: doctor.specialization,
      consultationFee: String(doctor.consultationFee ?? 0),
      followupFee: String(doctor.followupFee ?? 0),
      emergencyFee: String(doctor.emergencyFee ?? 0),
      averageConsultationMinutes: String(
        doctor.averageConsultationMinutes ?? 15,
      ),
      isVisitingConsultant: doctor.isVisitingConsultant,
      status: doctor.status,
    });

    setAvailability([]);
    setOpen(true);

    try {
      const schedules = await listDoctorSchedules(doctor.id);
      setAvailability(schedules.map(scheduleToAvailability));
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load doctor availability.",
      );
    }
  }

  function updateAvailability(
    key: string,
    patch: Partial<AvailabilityRow>,
  ) {
    setAvailability((current) =>
      current.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      ),
    );
  }

  async function saveAvailability(
    doctorId: string,
    existingSchedules: DoctorSchedule[],
  ) {
    const currentIds = new Set(
      availability.flatMap((row) => (row.id ? [row.id] : [])),
    );

    const removed = existingSchedules.filter(
      (schedule) => !currentIds.has(schedule.id),
    );

    await Promise.all(
      removed.map((schedule) => archiveDoctorSchedule(schedule.id)),
    );

    for (const row of availability) {
      if (!row.branchId) {
        throw new Error("Select a branch for every availability timing.");
      }
      if (!row.effectiveFrom) {
        throw new Error(
          "Effective From is required for every availability timing.",
        );
      }
      if (row.endTime <= row.startTime) {
        throw new Error("Availability end time must be after start time.");
      }

      const payload = {
        branchId: row.branchId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        slotDuration: Number(form.averageConsultationMinutes),
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo || null,
      };

      if (row.id) {
        await updateDoctorSchedule(row.id, payload);
      } else {
        await createDoctorSchedule({
          doctorId,
          ...payload,
        });
      }
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (!form.departmentId) {
        throw new Error("Select a department.");
      }

      if (doctorType === "EMPLOYEE" && !form.employeeId) {
        throw new Error("Select a registered employee.");
      }

      if (
        doctorType === "EXTERNAL" &&
        (!form.firstName.trim() || !form.mobile.trim())
      ) {
        throw new Error(
          "First name and mobile are required for an external doctor.",
        );
      }

      const payload = {
        departmentId: form.departmentId,
        doctorCode: form.doctorCode,
        medicalRegistrationNumber: form.medicalRegistrationNumber,
        registrationCouncil: form.registrationCouncil || null,
        qualification: form.qualification,
        specialization: form.specialization,
        consultationFee: Number(form.consultationFee),
        followupFee: Number(form.followupFee),
        emergencyFee: Number(form.emergencyFee),
        averageConsultationMinutes: Number(
          form.averageConsultationMinutes,
        ),
        isVisitingConsultant:
          doctorType === "EXTERNAL"
            ? true
            : form.isVisitingConsultant,
        status: form.status,

        ...(doctorType === "EXTERNAL"
          ? {
              title: form.title || null,
              firstName: form.firstName,
              middleName: form.middleName || null,
              lastName: form.lastName || null,
              mobile: form.mobile,
              email: form.email || null,
            }
          : {}),
      };

      let savedDoctor: DoctorRecord;
      let existingSchedules: DoctorSchedule[] = [];

      if (editing) {
        existingSchedules = await listDoctorSchedules(editing.id);
        savedDoctor = await updateDoctor(editing.id, payload);
      } else {
        savedDoctor = await createDoctor({
          employeeId:
            doctorType === "EMPLOYEE" ? form.employeeId : null,
          ...payload,
        });
      }

      await saveAvailability(savedDoctor.id, existingSchedules);

      setOpen(false);
      setSuccess(
        editing
          ? "Doctor and availability updated successfully."
          : "Doctor and availability created successfully.",
      );
      await load();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to save doctor.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="doctor-page">
      <header className="doctor-hero">
        <div>
          <span className="doctor-eyebrow">CLINICAL MASTER</span>
          <h1>Doctor Management</h1>
          <p>
            Manage hospital-employed and visiting specialists, clinical
            departments, consultation durations and weekly availability.
          </p>
        </div>
        <button className="doctor-primary" onClick={beginCreate}>
          + Add Doctor
        </button>
      </header>

      <div className="doctor-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search doctor, mobile, code or specialization"
        />
        <button type="button" onClick={() => void load()}>
          Search
        </button>
      </div>

      {error ? <div className="doctor-error">{error}</div> : null}
      {success ? <div className="doctor-success">{success}</div> : null}

      <section className="doctor-card">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Type</th>
              <th>Code</th>
              <th>Department</th>
              <th>Specialization</th>
              <th>Mobile</th>
              <th>Slot</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>
                  <strong>{doctorName(doctor)}</strong>
                  <small>{doctor.medicalRegistrationNumber}</small>
                </td>
                <td>
                  {doctor.employeeId ? "Employee" : "External / Visiting"}
                </td>
                <td>{doctor.doctorCode}</td>
                <td>{doctor.department.departmentName}</td>
                <td>{doctor.specialization}</td>
                <td>{doctorMobile(doctor)}</td>
                <td>
                  {doctor.averageConsultationMinutes ?? 15} min
                </td>
                <td>
                  <span
                    className={`doctor-status ${
                      doctor.status === "ACTIVE" ? "active" : ""
                    }`}
                  >
                    {doctor.status}
                  </span>
                </td>
                <td>
                  <button
                    className="doctor-link"
                    onClick={() => void beginEdit(doctor)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!doctors.length ? (
              <tr>
                <td colSpan={9} className="doctor-empty">
                  No doctors created yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {open ? (
        <div className="doctor-modal-backdrop">
          <form className="doctor-modal" onSubmit={submit}>
            <div className="doctor-modal-head">
              <div>
                <h2>{editing ? "Edit Doctor" : "Add Doctor"}</h2>
                <p>
                  Doctor profile, clinical department and weekly
                  availability.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            {!editing ? (
              <div className="doctor-source-switch">
                <button
                  type="button"
                  className={doctorType === "EMPLOYEE" ? "active" : ""}
                  onClick={() => setDoctorType("EMPLOYEE")}
                >
                  Hospital Employee
                </button>
                <button
                  type="button"
                  className={doctorType === "EXTERNAL" ? "active" : ""}
                  onClick={() => setDoctorType("EXTERNAL")}
                >
                  External / Visiting Doctor
                </button>
              </div>
            ) : (
              <div className="doctor-source-note">
                Doctor Type:{" "}
                <strong>
                  {doctorType === "EMPLOYEE"
                    ? "Hospital Employee"
                    : "External / Visiting Doctor"}
                </strong>
              </div>
            )}

            <div className="doctor-section-title">
              <h3>Doctor Details</h3>
            </div>

            <div className="doctor-grid">
              {doctorType === "EMPLOYEE" ? (
                <label className="span2">
                  Employee *
                  <select
                    required
                    disabled={Boolean(editing)}
                    value={form.employeeId}
                    onChange={(event) => {
                      const employee = employees.find(
                        (item) => item.id === event.target.value,
                      );
                      setForm((current) => ({
                        ...current,
                        employeeId: event.target.value,
                        departmentId:
                          employee?.departmentId ??
                          current.departmentId,
                      }));
                    }}
                  >
                    <option value="">Select registered employee</option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employeeCode} · {personName(employee)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label>
                    Title
                    <select
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                    >
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                      <option value="">None</option>
                    </select>
                  </label>

                  <label>
                    First Name *
                    <input
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          firstName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Middle Name
                    <input
                      value={form.middleName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          middleName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      value={form.lastName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          lastName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Mobile *
                    <input
                      required
                      value={form.mobile}
                      onChange={(event) =>
                        setForm({ ...form, mobile: event.target.value })
                      }
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                    />
                  </label>
                </>
              )}

              <label>
                Department *
                <select
                  required
                  value={form.departmentId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      departmentId: event.target.value,
                    })
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
                Doctor Code *
                <input
                  required
                  value={form.doctorCode}
                  onChange={(event) =>
                    setForm({ ...form, doctorCode: event.target.value })
                  }
                />
              </label>

              <label>
                Medical Registration Number *
                <input
                  required
                  value={form.medicalRegistrationNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      medicalRegistrationNumber: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Registration Council
                <input
                  value={form.registrationCouncil}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      registrationCouncil: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Specialization *
                <input
                  required
                  value={form.specialization}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      specialization: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Qualification *
                <input
                  required
                  value={form.qualification}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      qualification: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Consultation Fee
                <input
                  type="number"
                  min="0"
                  value={form.consultationFee}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      consultationFee: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Follow-up Fee
                <input
                  type="number"
                  min="0"
                  value={form.followupFee}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      followupFee: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Emergency Fee
                <input
                  type="number"
                  min="0"
                  value={form.emergencyFee}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      emergencyFee: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Average Consultation Minutes *
                <input
                  required
                  type="number"
                  min="5"
                  max="480"
                  value={form.averageConsultationMinutes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      averageConsultationMinutes: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>

              {doctorType === "EMPLOYEE" ? (
                <label className="doctor-check">
                  <input
                    type="checkbox"
                    checked={form.isVisitingConsultant}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isVisitingConsultant: event.target.checked,
                      })
                    }
                  />
                  Visiting consultant
                </label>
              ) : (
                <div className="doctor-external-badge">
                  Visiting / external specialist
                </div>
              )}
            </div>

            <div className="doctor-section-title availability-title">
              <div>
                <h3>Weekly Availability</h3>
                <p>
                  Add one or more time windows. For example Monday
                  09:00–11:00 and Monday 17:00–19:00.
                </p>
              </div>
              <button
                type="button"
                className="doctor-secondary"
                onClick={() =>
                  setAvailability((current) => [
                    ...current,
                    blankAvailability(),
                  ])
                }
              >
                + Add Timing
              </button>
            </div>

            {availability.length ? (
              <div className="doctor-availability-list">
                {availability.map((row) => (
                  <div className="doctor-availability-row" key={row.key}>
                    <label>
                      Branch *
                      <select
                        required
                        value={row.branchId}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            branchId: event.target.value,
                          })
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
                      Day *
                      <select
                        value={row.dayOfWeek}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            dayOfWeek: Number(event.target.value),
                          })
                        }
                      >
                        {DAY_OPTIONS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      From *
                      <input
                        required
                        type="time"
                        value={row.startTime}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            startTime: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      To *
                      <input
                        required
                        type="time"
                        value={row.endTime}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            endTime: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Effective From *
                      <input
                        required
                        type="date"
                        value={row.effectiveFrom}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            effectiveFrom: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Effective To
                      <input
                        type="date"
                        value={row.effectiveTo}
                        onChange={(event) =>
                          updateAvailability(row.key, {
                            effectiveTo: event.target.value,
                          })
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className="doctor-remove"
                      onClick={() =>
                        setAvailability((current) =>
                          current.filter(
                            (item) => item.key !== row.key,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="doctor-no-availability">
                No weekly timings added. The doctor will not have
                appointment slots until availability is configured.
              </div>
            )}

            <div className="doctor-actions">
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="doctor-primary" disabled={busy}>
                {busy ? "Saving..." : "Save Doctor"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
