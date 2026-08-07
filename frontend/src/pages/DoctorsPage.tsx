import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createDoctor,
  listDoctorManagement,
  listEmployeeOptions,
  updateDoctor,
  type DoctorRecord,
  type EmployeeOption,
} from "../api/doctors.api";
import "../styles/doctors.css";

function personName(value: {
  title?: string | null;
  firstName: string;
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

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DoctorRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
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
      const [doctorResult, employeeResult] = await Promise.all([
        listDoctorManagement(search),
        listEmployeeOptions(),
      ]);
      setDoctors(doctorResult.items);
      setEmployees(employeeResult.items);
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
        .map((doctor) => doctor.employeeId),
    );
    return employees.filter((employee) => !used.has(employee.id));
  }, [employees, doctors, editing]);

  function reset() {
    setForm({
      employeeId: "",
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

  function beginEdit(doctor: DoctorRecord) {
    setEditing(doctor);
    setForm({
      employeeId: doctor.employeeId,
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
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    const payload = {
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
      isVisitingConsultant: form.isVisitingConsultant,
      status: form.status,
    };

    try {
      if (editing) {
        await updateDoctor(editing.id, payload);
        setSuccess("Doctor updated successfully.");
      } else {
        await createDoctor({
          employeeId: form.employeeId,
          ...payload,
        });
        setSuccess("Doctor created successfully.");
      }

      setOpen(false);
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
            Create doctor profiles from registered employees and make
            them available to Appointments, Reception and OPD.
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
          placeholder="Search doctor, code or specialization"
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
              <th>Code</th>
              <th>Department</th>
              <th>Specialization</th>
              <th>Mobile</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>
                  <strong>{personName(doctor.employee)}</strong>
                  <small>{doctor.medicalRegistrationNumber}</small>
                </td>
                <td>{doctor.doctorCode}</td>
                <td>{doctor.department.departmentName}</td>
                <td>{doctor.specialization}</td>
                <td>{doctor.employee.mobile}</td>
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
                    onClick={() => beginEdit(doctor)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!doctors.length ? (
              <tr>
                <td colSpan={7} className="doctor-empty">
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
              <h2>{editing ? "Edit Doctor" : "Add Doctor"}</h2>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="doctor-grid">
              <label className="span2">
                Employee *
                <select
                  required
                  disabled={Boolean(editing)}
                  value={form.employeeId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      employeeId: event.target.value,
                    })
                  }
                >
                  <option value="">Select registered employee</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeCode} · {personName(employee)}
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

              <label className="span2">
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
                Average Consultation Minutes
                <input
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
            </div>

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
