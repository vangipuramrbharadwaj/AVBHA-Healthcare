import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listPatients } from "../api/patients.api";
import { PermissionGate } from "../auth/PermissionGate";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { ApiClientError } from "../types/api";
import type {
  PatientListQuery,
  PatientListResponse,
} from "../types/patient";

function nameOf(
  patient: PatientListResponse["items"][number],
) {
  return [
    patient.title,
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function PatientsPage() {
  const navigate = useNavigate();
  const [data, setData] =
    useState<PatientListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query: PatientListQuery = {
        page,
        pageSize: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (search.trim()) {
        query.search = search.trim();
      }

      if (status) {
        query.status = status;
      }

      if (gender) {
        query.gender = gender;
      }

      const result = await listPatients(query);
      setData(result);
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Patients could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, gender]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void load(),
      250,
    );

    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search, register and manage patient identity and clinical profile information."
        actions={
          <PermissionGate permission="patients.create">
            <Link
              className="button button-primary"
              to="/patients/new"
            >
              ＋ Register patient
            </Link>
          </PermissionGate>
        }
      />

      <section className="toolbar-card">
        <div className="search-field">
          <span>⌕</span>
          <input
            value={search}
            placeholder="Search UHID, patient name, mobile or email…"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={gender}
          onChange={(event) => {
            setPage(1);
            setGender(event.target.value);
          }}
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="content-card">
        {loading ? (
          <div className="page-loading">
            <Spinner label="Loading patients…" />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            title="No patients found"
            description={
              search
                ? "Try another search or clear the filters."
                : "Register your first patient to begin the clinical workflow."
            }
            action={
              <PermissionGate permission="patients.create">
                <Link
                  className="button button-primary"
                  to="/patients/new"
                >
                  Register patient
                </Link>
              </PermissionGate>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table patient-table">
                <thead>
                  <tr>
                    <th>UHID</th>
                    <th>Patient</th>
                    <th>Gender / Age</th>
                    <th>Mobile</th>
                    <th>Blood group</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {data.items.map((patient) => (
                    <tr
                      key={patient.id}
                      className="clickable-row"
                      onClick={() =>
                        navigate(`/patients/${patient.id}`)
                      }
                    >
                      <td>
                        <strong className="mono-link">
                          {patient.uhid}
                        </strong>
                      </td>

                      <td>
                        <div className="person-cell">
                          <span className="avatar-circle">
                            {patient.firstName
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div>
                            <strong>{nameOf(patient)}</strong>
                            <small>
                              {patient.email || "No email"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {patient.gender || "—"}
                        {patient.ageYears !== null &&
                        patient.ageYears !== undefined
                          ? ` · ${patient.ageYears}y`
                          : ""}
                      </td>

                      <td>{patient.primaryMobile}</td>
                      <td>{patient.bloodGroup || "—"}</td>

                      <td>
                        <StatusBadge
                          tone={
                            patient.status === "ACTIVE"
                              ? "success"
                              : "warning"
                          }
                        >
                          {patient.status}
                        </StatusBadge>
                      </td>

                      <td>
                        {new Date(
                          patient.createdAt,
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span className="row-arrow">›</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <span>
                Showing page {data.pagination.page} of{" "}
                {Math.max(
                  1,
                  data.pagination.totalPages,
                )}{" "}
                · {data.pagination.total} patients
              </span>

              <div>
                <button
                  className="button button-secondary"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                >
                  Previous
                </button>

                <button
                  className="button button-secondary"
                  disabled={
                    page >= data.pagination.totalPages
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
