import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPatient, duplicateSearch } from "../api/patients.api";
import { Alert } from "../components/Alert";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { ApiClientError } from "../types/api";
import type { PatientFormInput } from "../types/patient";

export function PatientCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

  async function submit(input: PatientFormInput) {
    setSubmitting(true);
    setError(null);
    setWarning(null);

    try {
      const duplicates = duplicateConfirmed
        ? []
        : await duplicateSearch(input.primaryMobile).catch(() => []);

      if (duplicates.length) {
        setWarning(
          `Possible existing patient found for this mobile number (${duplicates[0]?.uhid ?? "existing UHID"}). Review carefully. Submit once more only if this is a different person.`,
        );
        setDuplicateConfirmed(true);
        return;
      }

      const patient = await createPatient(input);

      navigate(`/patients/${patient.id}`, {
        replace: true,
        state: {
          message: `Patient ${patient.uhid} registered successfully.`,
        },
      });
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Patient registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Register patient"
        description="Create a hospital-wide patient identity. UHID is generated automatically."
        actions={
          <Link className="button button-secondary" to="/patients">
            ← Back to patients
          </Link>
        }
      />

      {warning ? <Alert tone="warning">{warning}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-card padded-card">
        <PatientForm
          submitting={submitting}
          submitLabel="Register patient"
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
