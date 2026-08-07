import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import { getPatient, listFamily } from "../api/patients.api";
import { PermissionGate } from "../auth/PermissionGate";
import { Alert } from "../components/Alert";
import { PageHeader } from "../components/PageHeader";
import { PatientClinicalPanel } from "../components/PatientClinicalPanel";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { ApiClientError } from "../types/api";
import type { ClinicalRecord, Patient } from "../types/patient";

type Tab =
  | "overview"
  | "alerts"
  | "allergies"
  | "chronic-diseases"
  | "insurances"
  | "medical-history"
  | "documents"
  | "family"
  | "identifiers"
  | "timeline";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "alerts", label: "Alerts" },
  { key: "allergies", label: "Allergies" },
  {
    key: "chronic-diseases",
    label: "Chronic diseases",
  },
  { key: "insurances", label: "Insurance" },
  {
    key: "medical-history",
    label: "Medical history",
  },
  { key: "documents", label: "Documents" },
  { key: "family", label: "Family" },
  { key: "identifiers", label: "Identifiers" },
  { key: "timeline", label: "Timeline" },
];

function Info({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>
        {value ? String(value) : "—"}
      </strong>
    </div>
  );
}

export function PatientDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();

  const [patient, setPatient] =
    useState<Patient | null>(null);
  const [family, setFamily] = useState<ClinicalRecord[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  async function loadPatientData() {
    try {
      const [patientResult, familyResult] = await Promise.all([
        getPatient(id),
        listFamily(id).catch(() => [] as ClinicalRecord[]),
      ]);
      setPatient(patientResult);
      setFamily(familyResult);
      setError(null);
    } catch (value) {
      setError(
        value instanceof ApiClientError
          ? value.message
          : "Patient could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPatientData();
  }, [id]);

  const fullName = useMemo(
    () =>
      patient
        ? [
            patient.title,
            patient.firstName,
            patient.middleName,
            patient.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : "",
    [patient],
  );

  const emergencyContacts = useMemo(() => {
    const direct = (patient?.emergencyContacts ?? []).map((contact, index) => ({
      key: String(contact.id ?? `direct-${index}`),
      name: String(contact.contactName ?? contact.contact_name ?? "Emergency contact"),
      relationship: String(contact.relationship ?? ""),
      mobile: String(contact.mobile ?? ""),
      source: "DIRECT" as const,
    }));

    const fromFamily = family
      .filter((record) =>
        Boolean(record.isEmergencyContact ?? record.is_emergency_contact),
      )
      .map((record, index) => {
        const related = record.relatedPatient as Patient | undefined;
        const name = related
          ? [related.firstName, related.middleName, related.lastName]
              .filter(Boolean)
              .join(" ")
          : String(
              record.relatedPersonName ??
                record.related_person_name ??
                "Family member",
            );
        const mobile = related?.primaryMobile
          ? String(related.primaryMobile)
          : String(
              record.relatedPersonMobile ??
                record.related_person_mobile ??
                "",
            );

        return {
          key: String(record.id ?? `family-${index}`),
          name,
          relationship: String(
            record.relationshipType ?? record.relationship_type ?? "",
          ),
          mobile,
          source: "FAMILY" as const,
        };
      });

    const seen = new Set<string>();
    return [...direct, ...fromFamily].filter((contact) => {
      const identity = `${contact.name.trim().toLowerCase()}|${contact.mobile.trim()}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }, [patient, family]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner label="Loading patient profile…" />
      </div>
    );
  }

  const headerProps: {
    title: string;
    description?: string;
    actions: JSX.Element;
  } = {
    title: fullName || "Patient profile",
    actions: (
      <div className="button-row">
        <Link
          className="button button-secondary"
          to="/patients"
        >
          ← Patients
        </Link>

        <PermissionGate permission="patients.update">
          <Link
            className="button button-primary"
            to={`/patients/${id}/edit`}
          >
            Edit patient
          </Link>
        </PermissionGate>
      </div>
    ),
  };

  if (patient) {
    headerProps.description =
      `${patient.uhid} · ${patient.primaryMobile}`;
  }

  const locationMessage = (
    location.state as { message?: string } | null
  )?.message;

  return (
    <div>
      <PageHeader {...headerProps} />

      {locationMessage ? (
        <Alert>{locationMessage}</Alert>
      ) : null}

      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : null}

      {patient ? (
        <>
          <section className="patient-hero">
            <div className="patient-avatar-large">
              {patient.firstName
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="patient-hero-main">
              <div className="patient-title-line">
                <h2>{fullName}</h2>
                <StatusBadge
                  tone={
                    patient.status === "ACTIVE"
                      ? "success"
                      : "warning"
                  }
                >
                  {patient.status}
                </StatusBadge>
              </div>

              <div className="patient-meta-line">
                <span>
                  <strong>UHID</strong> {patient.uhid}
                </span>
                <span>
                  {patient.gender || "Gender —"}
                </span>
                <span>
                  {patient.ageYears !== null &&
                  patient.ageYears !== undefined
                    ? `${patient.ageYears} years`
                    : "Age —"}
                </span>
                <span>
                  {patient.bloodGroup ||
                    "Blood group —"}
                </span>
              </div>

              {patient.medicalAlerts ||
              patient.allergiesSummary ? (
                <div className="clinical-warning-strip">
                  {patient.medicalAlerts ? (
                    <span>
                      ⚠ {patient.medicalAlerts}
                    </span>
                  ) : null}

                  {patient.allergiesSummary ? (
                    <span>
                      Allergy:{" "}
                      {patient.allergiesSummary}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <nav
            className="profile-tabs"
            aria-label="Patient profile sections"
          >
            {tabs.map((item) => (
              <button
                key={item.key}
                className={
                  tab === item.key ? "active" : ""
                }
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {tab === "overview" ? (
            <div className="profile-grid">
              <section className="profile-panel">
                <div className="section-heading">
                  <div>
                    <h2>Patient information</h2>
                    <p>
                      Demographics and identity.
                    </p>
                  </div>
                </div>

                <div className="info-grid">
                  <Info
                    label="UHID"
                    value={patient.uhid}
                  />
                  <Info
                    label="Gender"
                    value={patient.gender}
                  />
                  <Info
                    label="Date of birth"
                    value={
                      patient.dateOfBirth
                        ? new Date(
                            patient.dateOfBirth,
                          ).toLocaleDateString()
                        : null
                    }
                  />
                  <Info
                    label="Age"
                    value={
                      patient.ageYears !== null &&
                      patient.ageYears !== undefined
                        ? `${patient.ageYears} years`
                        : null
                    }
                  />
                  <Info
                    label="Blood group"
                    value={patient.bloodGroup}
                  />
                  <Info
                    label="Marital status"
                    value={patient.maritalStatus}
                  />
                  <Info
                    label="Nationality"
                    value={patient.nationality}
                  />
                  <Info
                    label="Occupation"
                    value={patient.occupation}
                  />
                  <Info
                    label="Preferred language"
                    value={
                      patient.preferredLanguage
                    }
                  />
                </div>
              </section>

              <section className="profile-panel">
                <div className="section-heading">
                  <div>
                    <h2>Contact</h2>
                    <p>
                      Patient communication
                      information.
                    </p>
                  </div>
                </div>

                <div className="info-grid">
                  <Info
                    label="Primary mobile"
                    value={patient.primaryMobile}
                  />
                  <Info
                    label="Alternate mobile"
                    value={patient.alternateMobile}
                  />
                  <Info
                    label="Email"
                    value={patient.email}
                  />
                  <Info
                    label="Referred by"
                    value={patient.referredBy}
                  />
                  <Info
                    label="Referral source"
                    value={patient.referralSource}
                  />
                </div>
              </section>

              <section className="profile-panel">
                <div className="section-heading">
                  <div>
                    <h2>Addresses</h2>
                    <p>
                      Registered patient addresses.
                    </p>
                  </div>
                </div>

                {!patient.addresses?.length ? (
                  <p className="muted-copy">
                    No address recorded.
                  </p>
                ) : (
                  patient.addresses.map(
                    (address, index) => (
                      <div
                        className="address-card"
                        key={address.id ?? index}
                      >
                        <strong>
                          {address.addressType ??
                            address.address_type ??
                            "Address"}
                        </strong>

                        <p>
                          {address.addressLine1 ??
                            address.address_line1}
                          {(address.addressLine2 ??
                            address.address_line2)
                            ? `, ${
                                address.addressLine2 ??
                                address.address_line2
                              }`
                            : ""}
                        </p>

                        <small>
                          {[
                            address.city,
                            address.district,
                            address.state,
                            address.postalCode ??
                              address.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </small>
                      </div>
                    ),
                  )
                )}
              </section>

              <section className="profile-panel">
                <div className="section-heading">
                  <div>
                    <h2>Emergency contacts</h2>
                    <p>
                      Contacts for urgent
                      communication.
                    </p>
                  </div>
                </div>

                {!emergencyContacts.length ? (
                  <p className="muted-copy">
                    No emergency contact recorded.
                  </p>
                ) : (
                  emergencyContacts.map((contact) => (
                    <div
                      className="address-card emergency-contact-card"
                      key={contact.key}
                    >
                      <strong>{contact.name}</strong>
                      <p>
                        {contact.relationship ||
                          "Relationship not specified"}
                      </p>
                      <small>
                        {contact.mobile || "Mobile not recorded"}
                        {contact.source === "FAMILY"
                          ? " · Family contact"
                          : ""}
                      </small>
                    </div>
                  ))
                )}
              </section>
            </div>
          ) : (
            <PatientClinicalPanel
              patientId={patient.id}
              panel={tab}
              onPatientDataChanged={loadPatientData}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
