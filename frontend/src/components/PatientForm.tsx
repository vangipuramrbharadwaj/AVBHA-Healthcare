import { useMemo, useState, type FormEvent } from "react";
import type { Patient, PatientFormInput } from "../types/patient";

const RELATIONSHIP_OPTIONS = [
  ["WIFE", "Wife"],
  ["HUSBAND", "Husband"],
  ["FATHER", "Father"],
  ["MOTHER", "Mother"],
  ["SON", "Son"],
  ["DAUGHTER", "Daughter"],
  ["BROTHER", "Brother"],
  ["SISTER", "Sister"],
  ["GRANDFATHER", "Grandfather"],
  ["GRANDMOTHER", "Grandmother"],
  ["GUARDIAN", "Guardian"],
  ["OTHER", "Other"],
] as const;

type FormState = {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  ageYears: string;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  primaryMobile: string;
  alternateMobile: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  occupation: string;
  preferredLanguage: string;
  referredBy: string;
  referralSource: string;
  medicalAlerts: string;
  allergiesSummary: string;
  chronicDiseasesSummary: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyMobile: string;
};

function initialState(patient?: Patient): FormState {
  const address = patient?.addresses?.[0];
  const contact = patient?.emergencyContacts?.[0];

  return {
    title: patient?.title ?? "",
    firstName: patient?.firstName ?? "",
    middleName: patient?.middleName ?? "",
    lastName: patient?.lastName ?? "",
    gender: patient?.gender ?? "",
    dateOfBirth: patient?.dateOfBirth?.slice(0, 10) ?? "",
    ageYears: patient?.ageYears?.toString() ?? "",
    bloodGroup: patient?.bloodGroup ?? "",
    maritalStatus: patient?.maritalStatus ?? "",
    nationality: patient?.nationality ?? "Indian",
    religion: patient?.religion ?? "",
    primaryMobile: patient?.primaryMobile ?? "",
    alternateMobile: patient?.alternateMobile ?? "",
    email: patient?.email ?? "",
    aadhaarNumber: patient?.aadhaarNumber ?? "",
    panNumber: patient?.panNumber ?? "",
    occupation: patient?.occupation ?? "",
    preferredLanguage: patient?.preferredLanguage ?? "",
    referredBy: patient?.referredBy ?? "",
    referralSource: patient?.referralSource ?? "",
    medicalAlerts: patient?.medicalAlerts ?? "",
    allergiesSummary: patient?.allergiesSummary ?? "",
    chronicDiseasesSummary: patient?.chronicDiseasesSummary ?? "",
    addressLine1: address?.addressLine1 ?? address?.address_line1 ?? "",
    addressLine2: address?.addressLine2 ?? address?.address_line2 ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? address?.postal_code ?? "",
    emergencyName: contact?.contactName ?? contact?.contact_name ?? "",
    emergencyRelationship: contact?.relationship ?? "",
    emergencyMobile: contact?.mobile ?? "",
  };
}

function assignOptionalString<T extends object>(
  target: T,
  key: keyof T,
  value: string,
): void {
  const cleaned = value.trim();
  if (cleaned) {
    target[key] = cleaned as T[keyof T];
  }
}

export function PatientForm({
  patient,
  submitting,
  submitLabel,
  onSubmit,
}: {
  patient?: Patient;
  submitting: boolean;
  submitLabel: string;
  onSubmit(input: PatientFormInput): Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(patient));

  const update = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const ageFromDob = useMemo(() => {
    if (!form.dateOfBirth) return null;

    const dob = new Date(`${form.dateOfBirth}T00:00:00`);

    if (Number.isNaN(dob.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDifference = now.getMonth() - dob.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && now.getDate() < dob.getDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }, [form.dateOfBirth]);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const input: PatientFormInput = {
      firstName: form.firstName.trim(),
      primaryMobile: form.primaryMobile.trim(),
    };

    assignOptionalString(input, "title", form.title);
    assignOptionalString(input, "middleName", form.middleName);
    assignOptionalString(input, "lastName", form.lastName);
    assignOptionalString(input, "gender", form.gender);
    assignOptionalString(input, "bloodGroup", form.bloodGroup);
    assignOptionalString(input, "maritalStatus", form.maritalStatus);
    assignOptionalString(input, "nationality", form.nationality);
    assignOptionalString(input, "religion", form.religion);
    assignOptionalString(input, "alternateMobile", form.alternateMobile);
    assignOptionalString(input, "email", form.email);
    assignOptionalString(input, "aadhaarNumber", form.aadhaarNumber);
    assignOptionalString(input, "panNumber", form.panNumber);
    assignOptionalString(input, "occupation", form.occupation);
    assignOptionalString(input, "preferredLanguage", form.preferredLanguage);
    assignOptionalString(input, "referredBy", form.referredBy);
    assignOptionalString(input, "referralSource", form.referralSource);
    assignOptionalString(input, "medicalAlerts", form.medicalAlerts);
    assignOptionalString(input, "allergiesSummary", form.allergiesSummary);
    assignOptionalString(
      input,
      "chronicDiseasesSummary",
      form.chronicDiseasesSummary,
    );

    if (form.dateOfBirth) {
      input.dateOfBirth = form.dateOfBirth;
    }

    if (ageFromDob !== null) {
      input.ageYears = ageFromDob;
    } else if (form.ageYears) {
      input.ageYears = Number(form.ageYears);
    }

    if (!patient) {
      if (form.addressLine1.trim()) {
        const address: NonNullable<PatientFormInput["addresses"]>[number] = {
          addressType: "CURRENT",
          addressLine1: form.addressLine1.trim(),
          country: "India",
          isPrimary: true,
        };

        assignOptionalString(address, "addressLine2", form.addressLine2);
        assignOptionalString(address, "city", form.city);
        assignOptionalString(address, "district", form.district);
        assignOptionalString(address, "state", form.state);
        assignOptionalString(address, "postalCode", form.postalCode);

        input.addresses = [address];
      } else {
        input.addresses = [];
      }
    }

    if (form.emergencyName.trim() && form.emergencyMobile.trim()) {
      const emergencyContact: NonNullable<
        PatientFormInput["emergencyContacts"]
      >[number] = {
        contactName: form.emergencyName.trim(),
        mobile: form.emergencyMobile.trim(),
        isPrimary: true,
      };

      assignOptionalString(
        emergencyContact,
        "relationship",
        form.emergencyRelationship,
      );

      input.emergencyContacts = [emergencyContact];
    } else if (!patient) {
      input.emergencyContacts = [];
    }

    await onSubmit(input);
  }

  return (
    <form className="patient-form" onSubmit={submit}>
      <section className="form-section">
        <div className="form-section-heading">
          <h2>Personal information</h2>
          <p>Core patient identity and demographic details.</p>
        </div>

        <div className="form-grid form-grid-4">
          <label>
            <span>Title</span>
            <select
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            >
              <option value="">Select</option>
              <option>Mr</option>
              <option>Mrs</option>
              <option>Ms</option>
              <option>Dr</option>
              <option>Master</option>
              <option>Baby</option>
            </select>
          </label>

          <label className="required">
            <span>First name</span>
            <input
              required
              value={form.firstName}
              onChange={(event) =>
                update("firstName", event.target.value)
              }
            />
          </label>

          <label>
            <span>Middle name</span>
            <input
              value={form.middleName}
              onChange={(event) =>
                update("middleName", event.target.value)
              }
            />
          </label>

          <label>
            <span>Last name</span>
            <input
              value={form.lastName}
              onChange={(event) =>
                update("lastName", event.target.value)
              }
            />
          </label>

          <label>
            <span>Gender</span>
            <select
              value={form.gender}
              onChange={(event) =>
                update("gender", event.target.value)
              }
            >
              <option value="">Select</option>
              <option>MALE</option>
              <option>FEMALE</option>
              <option>OTHER</option>
            </select>
          </label>

          <label>
            <span>Date of birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                update("dateOfBirth", event.target.value)
              }
            />
          </label>

          <label>
            <span>Age</span>
            <input
              type="number"
              min="0"
              max="150"
              value={ageFromDob ?? form.ageYears}
              onChange={(event) =>
                update("ageYears", event.target.value)
              }
              disabled={ageFromDob !== null}
            />
          </label>

          <label>
            <span>Blood group</span>
            <select
              value={form.bloodGroup}
              onChange={(event) =>
                update("bloodGroup", event.target.value)
              }
            >
              <option value="">Select</option>
              {[
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Marital status</span>
            <select
              value={form.maritalStatus}
              onChange={(event) =>
                update("maritalStatus", event.target.value)
              }
            >
              <option value="">Select</option>
              <option>SINGLE</option>
              <option>MARRIED</option>
              <option>DIVORCED</option>
              <option>WIDOWED</option>
            </select>
          </label>

          <label>
            <span>Nationality</span>
            <input
              value={form.nationality}
              onChange={(event) =>
                update("nationality", event.target.value)
              }
            />
          </label>

          <label>
            <span>Religion</span>
            <input
              value={form.religion}
              onChange={(event) =>
                update("religion", event.target.value)
              }
            />
          </label>

          <label>
            <span>Occupation</span>
            <input
              value={form.occupation}
              onChange={(event) =>
                update("occupation", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Contact information</h2>
          <p>Primary communication details for the patient.</p>
        </div>

        <div className="form-grid form-grid-3">
          <label className="required">
            <span>Primary mobile</span>
            <input
              required
              minLength={7}
              value={form.primaryMobile}
              onChange={(event) =>
                update("primaryMobile", event.target.value)
              }
            />
          </label>

          <label>
            <span>Alternate mobile</span>
            <input
              value={form.alternateMobile}
              onChange={(event) =>
                update("alternateMobile", event.target.value)
              }
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                update("email", event.target.value)
              }
            />
          </label>

          <label>
            <span>Preferred language</span>
            <input
              value={form.preferredLanguage}
              onChange={(event) =>
                update("preferredLanguage", event.target.value)
              }
            />
          </label>

          <label>
            <span>Referred by</span>
            <input
              value={form.referredBy}
              onChange={(event) =>
                update("referredBy", event.target.value)
              }
            />
          </label>

          <label>
            <span>Referral source</span>
            <input
              value={form.referralSource}
              onChange={(event) =>
                update("referralSource", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Government identifiers</h2>
          <p>
            Optional identification details. Capture only when
            operationally required.
          </p>
        </div>

        <div className="form-grid form-grid-3">
          <label>
            <span>Aadhaar number</span>
            <input
              value={form.aadhaarNumber}
              onChange={(event) =>
                update("aadhaarNumber", event.target.value)
              }
            />
          </label>

          <label>
            <span>PAN number</span>
            <input
              value={form.panNumber}
              onChange={(event) =>
                update("panNumber", event.target.value)
              }
            />
          </label>
        </div>
      </section>


{!patient ? (
  <section className="form-section">
    <div className="form-section-heading">
      <h2>Primary address</h2>
      <p>Optional during quick registration.</p>
    </div>

    <div className="form-grid form-grid-3">
      <label className="span-2">
        <span>Address line 1</span>
        <input
          value={form.addressLine1}
          onChange={(event) =>
            update("addressLine1", event.target.value)
          }
        />
      </label>

      <label>
        <span>Address line 2</span>
        <input
          value={form.addressLine2}
          onChange={(event) =>
            update("addressLine2", event.target.value)
          }
        />
      </label>

      <label>
        <span>City</span>
        <input
          value={form.city}
          onChange={(event) =>
            update("city", event.target.value)
          }
        />
      </label>

      <label>
        <span>District</span>
        <input
          value={form.district}
          onChange={(event) =>
            update("district", event.target.value)
          }
        />
      </label>

      <label>
        <span>State</span>
        <input
          value={form.state}
          onChange={(event) =>
            update("state", event.target.value)
          }
        />
      </label>

      <label>
        <span>Postal code</span>
        <input
          value={form.postalCode}
          onChange={(event) =>
            update("postalCode", event.target.value)
          }
        />
      </label>
    </div>
  </section>
) : null}

<section className="form-section">
  <div className="form-section-heading">
    <h2>Emergency contact</h2>
    <p>
      Primary contact for emergencies and family communication.
    </p>
  </div>

  <div className="form-grid form-grid-3">
    <label>
      <span>Contact name</span>
      <input
        value={form.emergencyName}
        onChange={(event) =>
          update("emergencyName", event.target.value)
        }
      />
    </label>

    <label>
      <span>Relationship</span>
      <select
        value={form.emergencyRelationship}
        onChange={(event) =>
          update("emergencyRelationship", event.target.value)
        }
      >
        <option value="">Select relationship</option>
        {RELATIONSHIP_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>

    <label>
      <span>Mobile</span>
      <input
        value={form.emergencyMobile}
        onChange={(event) =>
          update("emergencyMobile", event.target.value)
        }
      />
    </label>
  </div>
</section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Clinical safety summaries</h2>
          <p>
            Visible summaries for quick clinical awareness.
          </p>
        </div>

        <div className="form-grid form-grid-3">
          <label>
            <span>Medical alerts</span>
            <textarea
              rows={4}
              value={form.medicalAlerts}
              onChange={(event) =>
                update("medicalAlerts", event.target.value)
              }
            />
          </label>

          <label>
            <span>Allergy summary</span>
            <textarea
              rows={4}
              value={form.allergiesSummary}
              onChange={(event) =>
                update("allergiesSummary", event.target.value)
              }
            />
          </label>

          <label>
            <span>Chronic disease summary</span>
            <textarea
              rows={4}
              value={form.chronicDiseasesSummary}
              onChange={(event) =>
                update(
                  "chronicDiseasesSummary",
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>

      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={submitting}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
