import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPatient, updatePatient } from "../api/patients.api";
import { Alert } from "../components/Alert";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { Spinner } from "../components/Spinner";
import { ApiClientError } from "../types/api";
import type { Patient, PatientFormInput } from "../types/patient";

export function PatientEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(id)
      .then(setPatient)
      .catch((value) =>
        setError(value instanceof ApiClientError ? value.message : "Patient could not be loaded"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(input: PatientFormInput) {
    setSubmitting(true);
    setError(null);
    try {
      await updatePatient(id, input);
      navigate(`/patients/${id}`, {
        replace: true,
        state: { message: "Patient information updated successfully." },
      });
    } catch (value) {
      setError(value instanceof ApiClientError ? value.message : "Patient update failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading"><Spinner label="Loading patient…"/></div>;

  return (
    <div>
      <PageHeader
        title="Edit patient"
        description={patient ? `${patient.uhid} · ${patient.firstName} ${patient.lastName ?? ""}` : "Update patient information"}
        actions={<Link className="button button-secondary" to={`/patients/${id}`}>← Patient profile</Link>}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {patient ? (
        <div className="content-card padded-card">
          <PatientForm patient={patient} submitting={submitting} submitLabel="Save changes" onSubmit={submit}/>
        </div>
      ) : null}
    </div>
  );
}
