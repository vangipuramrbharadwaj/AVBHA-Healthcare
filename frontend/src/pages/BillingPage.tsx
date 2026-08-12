import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyBillingAdvance,
  billingDashboard,
  createBillingAdvance,
  createBillingService,
  createInvoiceFromCharges,
  getBillingInvoice,
  listBillingAdvances,
  listBillingCharges,
  listBillingInvoices,
  listBillingRefunds,
  listBillingServices,
  patientBillingLedger,
  recordBillingPayment,
  requestBillingRefund,
  syncBillingCharges,
  updateBillingRefundStatus,
  type BillingAdvance,
  type BillingCharge,
  type BillingDashboard,
  type BillingInvoice,
  type BillingRefund,
  type BillingService,
} from "../api/billing.api";
import "../styles/billing.css";

const paymentModes = [
  "CASH",
  "CARD",
  "UPI",
  "BANK_TRANSFER",
  "INSURANCE",
  "CREDIT",
  "OTHER",
];

function patientName(patient: any) {
  return [
    patient?.firstName,
    patient?.middleName,
    patient?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Patient";
}

function money(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

type Tab =
  | "charges"
  | "invoices"
  | "advances"
  | "refunds"
  | "services";

export default function BillingPage() {
  const [tab, setTab] = useState<Tab>("charges");
  const [dashboard, setDashboard] =
    useState<BillingDashboard | null>(null);
  const [charges, setCharges] = useState<BillingCharge[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [advances, setAdvances] = useState<BillingAdvance[]>([]);
  const [refunds, setRefunds] = useState<BillingRefund[]>([]);
  const [services, setServices] = useState<BillingService[]>([]);
  const [selected, setSelected] =
    useState<BillingInvoice | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function load(sync = false) {
    try {
      setError("");

      if (sync) {
        await syncBillingCharges();
      }

      const [
        dashboardResult,
        chargeResult,
        invoiceResult,
        advanceResult,
        refundResult,
        serviceResult,
      ] = await Promise.all([
        billingDashboard(),
        listBillingCharges(),
        listBillingInvoices(),
        listBillingAdvances(),
        listBillingRefunds(),
        listBillingServices(),
      ]);

      setDashboard(dashboardResult);
      setCharges(chargeResult);
      setInvoices(invoiceResult.items);
      setAdvances(advanceResult);
      setRefunds(refundResult);
      setServices(serviceResult);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load billing.",
      );
    }
  }

  useEffect(() => {
    void load(true);
  }, []);

  async function run(
    fn: () => Promise<unknown>,
    success: string,
  ) {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      await fn();
      setMessage(success);
      await load(true);

      if (selected) {
        setSelected(await getBillingInvoice(selected.id));
      }
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Billing request failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openInvoice(id: string) {
    try {
      setSelected(await getBillingInvoice(id));
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to open invoice.",
      );
    }
  }

  const kpi = useMemo(() => {
    const gross = invoices.reduce(
      (total, invoice) => total + Number(invoice.totalAmount),
      0,
    );
    const collected = invoices.reduce(
      (total, invoice) => total + Number(invoice.paidAmount),
      0,
    );
    const outstanding = invoices.reduce(
      (total, invoice) => total + Number(invoice.balanceAmount),
      0,
    );
    const availableAdvance = advances.reduce(
      (total, advance) => total + Number(advance.balanceAmount),
      0,
    );

    return {
      pendingCharges: charges.length,
      pendingAmount: charges.reduce(
        (total, charge) => total + Number(charge.lineTotal),
        0,
      ),
      gross,
      collected,
      outstanding,
      availableAdvance,
    };
  }, [charges, invoices, advances]);

  const normalizedSearch = patientSearch.trim().toLowerCase();

  const filteredCharges = useMemo(() => {
    return charges.filter((charge) => {
      const name = patientName(charge.patient).toLowerCase();
      const uhid = String(charge.patient?.uhid ?? "").toLowerCase();
      const mobile = String(charge.patient?.primaryMobile ?? "").toLowerCase();
      const chargeDay = String(charge.chargeDate).slice(0, 10);

      const matchesPatient =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        uhid.includes(normalizedSearch) ||
        mobile.includes(normalizedSearch);

      const matchesFrom = !fromDate || chargeDay >= fromDate;
      const matchesTo = !toDate || chargeDay <= toDate;

      return matchesPatient && matchesFrom && matchesTo;
    });
  }, [charges, normalizedSearch, fromDate, toDate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const name = patientName(invoice.patient).toLowerCase();
      const uhid = String(invoice.patient?.uhid ?? "").toLowerCase();
      const mobile = String(invoice.patient?.primaryMobile ?? "").toLowerCase();
      const invoiceDay = String(invoice.invoiceDate).slice(0, 10);

      const matchesPatient =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        uhid.includes(normalizedSearch) ||
        mobile.includes(normalizedSearch);

      const matchesFrom = !fromDate || invoiceDay >= fromDate;
      const matchesTo = !toDate || invoiceDay <= toDate;

      return matchesPatient && matchesFrom && matchesTo;
    });
  }, [invoices, normalizedSearch, fromDate, toDate]);

  const chargeGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        patientId: string;
        branchId: string;
        patient: BillingCharge["patient"];
        items: BillingCharge[];
        total: number;
      }
    >();

    for (const charge of filteredCharges) {
      // One billing account per patient + branch. OPD, Lab, Radiology,
      // Pharmacy, IPD and OT charges remain visible as individual lines.
      const key = `${charge.patientId}:${charge.branchId}`;
      const current = groups.get(key) ?? {
        key,
        patientId: charge.patientId,
        branchId: charge.branchId,
        patient: charge.patient,
        items: [],
        total: 0,
      };

      current.items.push(charge);
      current.total += Number(charge.lineTotal);
      groups.set(key, current);
    }

    return Array.from(groups.values()).sort((a, b) =>
      patientName(a.patient).localeCompare(patientName(b.patient)),
    );
  }, [filteredCharges]);


  return (
    <div className="billing-page">
      <header className="billing-hero">
        <div>
          <span>AUTOMATED REVENUE CYCLE</span>
          <h1>Billing & Payments</h1>
          <p>
            Clinical charges flow into one patient account from OPD,
            Laboratory, Radiology, Pharmacy, IPD beds and Operation
            Theatre. Generate the invoice once, then settle by advance
            and payment.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(
              () => syncBillingCharges(),
              "Clinical charges synchronized.",
            )
          }
        >
          ↻ Sync Charges
        </button>
      </header>

      {error ? <div className="billing-alert error">{error}</div> : null}
      {message ? (
        <div className="billing-alert success">{message}</div>
      ) : null}

      <section className="billing-kpis">
        <Kpi label="Pending Charges" value={kpi.pendingCharges} />
        <Kpi label="Unbilled Value" value={money(kpi.pendingAmount)} />
        <Kpi
          label="Today Collections"
          value={money(dashboard?.todayCollections ?? 0)}
        />
        <Kpi label="Outstanding" value={money(kpi.outstanding)} />
        <Kpi
          label="Available Advances"
          value={money(kpi.availableAdvance)}
        />
      </section>

      <nav className="billing-tabs">
        <button
          className={tab === "charges" ? "active" : ""}
          onClick={() => setTab("charges")}
        >
          Charge Queue
        </button>
        <button
          className={tab === "invoices" ? "active" : ""}
          onClick={() => setTab("invoices")}
        >
          Invoices & Collections
        </button>
        <button
          className={tab === "advances" ? "active" : ""}
          onClick={() => setTab("advances")}
        >
          Advances
        </button>
        <button
          className={tab === "refunds" ? "active" : ""}
          onClick={() => setTab("refunds")}
        >
          Refunds
        </button>
        <button
          className={tab === "services" ? "active" : ""}
          onClick={() => setTab("services")}
        >
          Service / Tariff Master
        </button>
      </nav>

      {(tab === "charges" || tab === "invoices") ? (
        <section className="billing-filters">
          <label className="billing-search">
            <span>Search Patient</span>
            <input
              type="search"
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Name, UHID or mobile number"
            />
          </label>

          <label>
            <span>From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            <span>To Date</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="billing-clear-filter"
            onClick={() => {
              setPatientSearch("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear Filters
          </button>
        </section>
      ) : null}

      {tab === "charges" ? (
        <ChargeQueue
          groups={chargeGroups}
          busy={busy}
          invoice={(ids) =>
            run(
              () =>
                createInvoiceFromCharges({
                  chargeIds: ids,
                  discountAmount: 0,
                  roundOffAmount: 0,
                }),
              "Invoice generated successfully.",
            )
          }
        />
      ) : null}

      {tab === "invoices" ? (
        <InvoiceQueue
          invoices={filteredInvoices}
          openInvoice={openInvoice}
        />
      ) : null}

      {tab === "advances" ? (
        <AdvancePanel
          advances={advances}
          charges={charges}
          invoices={invoices}
          busy={busy}
          save={(body) =>
            run(
              () => createBillingAdvance(body),
              "Advance payment recorded.",
            )
          }
        />
      ) : null}

      {tab === "refunds" ? (
        <RefundQueue
          refunds={refunds}
          busy={busy}
          run={run}
        />
      ) : null}

      {tab === "services" ? (
        <ServiceMaster
          services={services}
          busy={busy}
          run={run}
        />
      ) : null}

      {selected ? (
        <InvoiceModal
          invoice={selected}
          advances={advances.filter(
            (advance) =>
              advance.patientId === selected.patientId &&
              Number(advance.balanceAmount) > 0,
          )}
          busy={busy}
          close={() => setSelected(null)}
          run={run}
        />
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="billing-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ChargeQueue({
  groups,
  busy,
  invoice,
}: {
  groups: Array<{
    key: string;
    patientId: string;
    patient: BillingCharge["patient"];
    items: BillingCharge[];
    total: number;
  }>;
  busy: boolean;
  invoice: (ids: string[]) => void;
}) {
  return (
    <section className="billing-card">
      <div className="billing-card-head">
        <div>
          <span>PATIENT BILLING ACCOUNTS</span>
          <h2>Unbilled Patient Charges</h2>
          <p>
            All pending services are grouped under the patient. You can
            generate one consolidated patient invoice or invoice an
            individual service separately.
          </p>
        </div>
        <strong className="billing-result-count">
          {groups.length} patient{groups.length === 1 ? "" : "s"}
        </strong>
      </div>

      {!groups.length ? (
        <div className="billing-empty">
          No pending patient charges match the selected filters.
        </div>
      ) : (
        <div className="billing-charge-groups">
          {groups.map((group) => {
            const modules = Array.from(
              new Set(group.items.map((item) => item.sourceModule)),
            );

            return (
              <article className="billing-charge-group" key={group.key}>
                <header>
                  <div className="billing-patient-heading">
                    <strong>{patientName(group.patient)}</strong>
                    <small>
                      {group.patient.uhid || "No UHID"}
                      {group.patient.primaryMobile
                        ? ` · ${group.patient.primaryMobile}`
                        : ""}
                    </small>
                    <div className="billing-patient-modules">
                      {modules.map((module) => (
                        <span key={module}>
                          {module.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="billing-patient-total">
                    <span>Total Pending</span>
                    <strong>{money(group.total)}</strong>
                    <small>{group.items.length} pending service{group.items.length === 1 ? "" : "s"}</small>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        invoice(group.items.map((item) => item.id))
                      }
                    >
                      Generate Patient Invoice
                    </button>
                  </div>
                </header>

                <div className="billing-charge-lines billing-charge-lines-patient">
                  {group.items.map((charge) => (
                    <div key={charge.id}>
                      <span className="billing-source">
                        {charge.sourceModule.replaceAll("_", " ")}
                      </span>

                      <div className="billing-service-description">
                        <strong>{charge.description}</strong>
                        <small>
                          {new Date(charge.chargeDate).toLocaleDateString("en-IN")}
                          {charge.ipdAdmissionId
                            ? " · IPD"
                            : charge.opdVisitId
                              ? " · OPD"
                              : " · General"}
                        </small>
                      </div>

                      <span>
                        {Number(charge.quantity)} × {money(charge.unitPrice)}
                      </span>

                      <b>{money(charge.lineTotal)}</b>

                      <button
                        type="button"
                        className="billing-service-invoice"
                        disabled={busy}
                        onClick={() => invoice([charge.id])}
                      >
                        Generate Invoice
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}


function InvoiceQueue({
  invoices,
  openInvoice,
}: {
  invoices: BillingInvoice[];
  openInvoice: (id: string) => void;
}) {
  return (
    <section className="billing-card">
      <div className="billing-card-head">
        <div>
          <span>COLLECTION QUEUE</span>
          <h2>Patient Invoices</h2>
          <p>Search by patient and review invoices for the selected date range.</p>
        </div>
        <strong className="billing-result-count">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
        </strong>
      </div>

      {!invoices.length ? (
        <div className="billing-empty">
          No patient invoices match the selected filters.
        </div>
      ) : (
      <div className="billing-table-wrap">
        <table className="billing-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Patient</th>
              <th>Episode</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <strong>{invoice.invoiceNumber}</strong>
                  <small>
                    {new Date(invoice.invoiceDate).toLocaleDateString(
                      "en-IN",
                    )}
                  </small>
                </td>
                <td>
                  <strong>{patientName(invoice.patient)}</strong>
                  <small>{invoice.patient.uhid || ""}</small>
                </td>
                <td>
                  {invoice.ipdAdmissionId ? (
                    <span className="billing-pill warn">IPD</span>
                  ) : invoice.opdVisitId ? (
                    <span className="billing-pill">OPD</span>
                  ) : (
                    <span className="billing-pill">GENERAL</span>
                  )}
                </td>
                <td>{money(invoice.totalAmount)}</td>
                <td>{money(invoice.paidAmount)}</td>
                <td>
                  <strong>{money(invoice.balanceAmount)}</strong>
                </td>
                <td>
                  <span
                    className={`billing-pill ${invoice.status === "PAID" ? "good" : ""}`}
                  >
                    {invoice.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  <button
                    className="billing-link"
                    onClick={() => void openInvoice(invoice.id)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}

function AdvancePanel({
  advances,
  charges,
  invoices,
  busy,
  save,
}: {
  advances: BillingAdvance[];
  charges: BillingCharge[];
  invoices: BillingInvoice[];
  busy: boolean;
  save: (body: Record<string, unknown>) => void;
}) {
  const patients = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        uhid: string;
        branchId: string;
      }
    >();

    for (const charge of charges) {
      map.set(charge.patientId, {
        id: charge.patientId,
        name: patientName(charge.patient),
        uhid: charge.patient.uhid || "",
        branchId: charge.branchId,
      });
    }

    for (const invoice of invoices) {
      if (!map.has(invoice.patientId)) {
        map.set(invoice.patientId, {
          id: invoice.patientId,
          name: patientName(invoice.patient),
          uhid: invoice.patient.uhid || "",
          branchId: invoice.branchId,
        });
      }
    }

    return Array.from(map.values());
  }, [charges, invoices]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const patientId = String(form.get("patientId") || "");
    const patient = patients.find((item) => item.id === patientId);

    if (!patient) return;

    save({
      branchId: patient.branchId,
      patientId,
      paymentMode: form.get("paymentMode"),
      amount: Number(form.get("amount")),
      transactionReference:
        form.get("transactionReference") || null,
      remarks: form.get("remarks") || null,
    });

    event.currentTarget.reset();
  };

  return (
    <div className="billing-grid-2">
      <section className="billing-card">
        <div className="billing-card-head">
          <div>
            <span>PATIENT CREDIT</span>
            <h2>Advance Balances</h2>
          </div>
        </div>

        <div className="billing-detail-list">
          {advances.map((advance) => (
            <article key={advance.id}>
              <header>
                <div>
                  <strong>{patientName(advance.patient)}</strong>
                  <small>{advance.advanceNumber}</small>
                </div>
                <b>{money(advance.balanceAmount)}</b>
              </header>
              <p>
                Received {money(advance.amount)} · Used{" "}
                {money(advance.utilizedAmount)} ·{" "}
                {advance.paymentMode.replaceAll("_", " ")}
              </p>
            </article>
          ))}
          {!advances.length ? (
            <div className="billing-empty">No advance payments.</div>
          ) : null}
        </div>
      </section>

      <form className="billing-card" onSubmit={submit}>
        <div className="billing-card-head">
          <div>
            <span>RECEIVE ADVANCE</span>
            <h2>New Advance Payment</h2>
          </div>
        </div>

        <div className="billing-form">
          <label>
            <span>Patient *</span>
            <select name="patientId" required>
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.uhid
                    ? `${patient.uhid} · ${patient.name}`
                    : patient.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Payment Mode *</span>
            <select name="paymentMode">
              {paymentModes.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Amount *</span>
            <input name="amount" type="number" min="0.01" step="0.01" required />
          </label>

          <label>
            <span>Reference</span>
            <input name="transactionReference" />
          </label>

          <label className="wide">
            <span>Remarks</span>
            <textarea name="remarks" />
          </label>

          <div className="billing-actions wide">
            <button disabled={busy}>Record Advance</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function RefundQueue({
  refunds,
  busy,
  run,
}: {
  refunds: BillingRefund[];
  busy: boolean;
  run: (
    fn: () => Promise<unknown>,
    success: string,
  ) => void;
}) {
  return (
    <section className="billing-card">
      <div className="billing-card-head">
        <div>
          <span>REFUND CONTROL</span>
          <h2>Refund Requests</h2>
        </div>
      </div>

      <div className="billing-table-wrap">
        <table className="billing-table">
          <thead>
            <tr>
              <th>Refund</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td>{refund.refundNumber}</td>
                <td>{money(refund.amount)}</td>
                <td>{refund.reason}</td>
                <td>
                  <span className="billing-pill">
                    {refund.status}
                  </span>
                </td>
                <td>
                  {refund.status === "PENDING" ? (
                    <button
                      className="billing-link"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            updateBillingRefundStatus(
                              refund.id,
                              "APPROVED",
                            ),
                          "Refund approved.",
                        )
                      }
                    >
                      Approve
                    </button>
                  ) : refund.status === "APPROVED" ? (
                    <button
                      className="billing-link"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            updateBillingRefundStatus(
                              refund.id,
                              "COMPLETED",
                            ),
                          "Refund completed.",
                        )
                      }
                    >
                      Complete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ServiceMaster({
  services,
  busy,
  run,
}: {
  services: BillingService[];
  busy: boolean;
  run: (
    fn: () => Promise<unknown>,
    success: string,
  ) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    run(
      () =>
        createBillingService({
          serviceCode: form.get("serviceCode"),
          serviceName: form.get("serviceName"),
          moduleCode: form.get("moduleCode"),
          description: form.get("description") || null,
          basePrice: Number(form.get("basePrice")),
          gstPercent: form.get("gstPercent")
            ? Number(form.get("gstPercent"))
            : null,
          discountAllowed: true,
        }),
      "Billing service created.",
    );

    event.currentTarget.reset();
  };

  return (
    <div className="billing-grid-2">
      <section className="billing-card">
        <div className="billing-card-head">
          <div>
            <span>PRICE MASTER</span>
            <h2>Service / Tariff Catalogue</h2>
          </div>
        </div>

        <div className="billing-detail-list">
          {services.map((service) => (
            <article key={service.id}>
              <header>
                <div>
                  <strong>{service.serviceName}</strong>
                  <small>{service.serviceCode}</small>
                </div>
                <b>{money(service.basePrice)}</b>
              </header>
              <p>
                {service.moduleCode.replaceAll("_", " ")} · GST{" "}
                {Number(service.gstPercent || 0)}%
              </p>
            </article>
          ))}
        </div>
      </section>

      <form className="billing-card" onSubmit={submit}>
        <div className="billing-card-head">
          <div>
            <span>NEW TARIFF</span>
            <h2>Add Service</h2>
          </div>
        </div>

        <div className="billing-form">
          <Field name="serviceCode" label="Service Code *" required />
          <Field name="serviceName" label="Service Name *" required />
          <Field name="moduleCode" label="Module Code *" required />
          <Field
            name="basePrice"
            label="Base Price *"
            type="number"
            required
          />
          <Field name="gstPercent" label="GST %" type="number" />

          <label className="wide">
            <span>Description</span>
            <textarea name="description" />
          </label>

          <div className="billing-actions wide">
            <button disabled={busy}>Create Service</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function InvoiceModal({
  invoice,
  advances,
  busy,
  close,
  run,
}: {
  invoice: BillingInvoice;
  advances: BillingAdvance[];
  busy: boolean;
  close: () => void;
  run: (
    fn: () => Promise<unknown>,
    success: string,
  ) => void;
}) {
  const [ledger, setLedger] = useState<Array<any>>([]);

  useEffect(() => {
    void patientBillingLedger(invoice.patientId)
      .then((result) => setLedger(result.items))
      .catch(() => setLedger([]));
  }, [invoice.patientId, invoice.paidAmount]);

  const availableAdvance = advances.reduce(
    (total, advance) => total + Number(advance.balanceAmount),
    0,
  );

  const pay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    run(
      () =>
        recordBillingPayment(invoice.id, {
          paymentMode: form.get("paymentMode"),
          amount: Number(form.get("amount")),
          transactionReference:
            form.get("transactionReference") || null,
          remarks: form.get("remarks") || null,
        }),
      "Payment recorded.",
    );
  };

  const refund = () => {
    const raw = window.prompt("Refund amount:");
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const reason = window.prompt("Reason for refund:");
    if (!reason) return;

    run(
      () =>
        requestBillingRefund(invoice.id, {
          amount,
          reason,
          paymentMode: null,
        }),
      "Refund request created.",
    );
  };

  return (
    <div className="billing-modal-bg" onMouseDown={close}>
      <section
        className="billing-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>{invoice.invoiceNumber}</span>
            <h2>{patientName(invoice.patient)}</h2>
            <p>
              Total {money(invoice.totalAmount)} · Paid{" "}
              {money(invoice.paidAmount)} · Balance{" "}
              {money(invoice.balanceAmount)}
            </p>
          </div>
          <div className="billing-modal-buttons">
            <button type="button" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" onClick={close}>
              ×
            </button>
          </div>
        </header>

        <section className="billing-invoice-items">
          <h3>Invoice Items</h3>
          {invoice.items.map((item) => (
            <div key={item.id}>
              <span>{item.sourceModule || "SERVICE"}</span>
              <strong>{item.description}</strong>
              <span>
                {Number(item.quantity)} × {money(item.unitPrice)}
              </span>
              <b>{money(item.lineTotal)}</b>
            </div>
          ))}
        </section>

        {availableAdvance > 0 &&
        Number(invoice.balanceAmount) > 0 ? (
          <section className="billing-advance-apply">
            <div>
              <span>Available patient advance</span>
              <strong>{money(availableAdvance)}</strong>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => applyBillingAdvance(invoice.id),
                  "Advance applied to invoice.",
                )
              }
            >
              Apply Advance
            </button>
          </section>
        ) : null}

        <div className="billing-modal-grid">
          <form className="billing-card inner" onSubmit={pay}>
            <div className="billing-card-head">
              <div>
                <span>COLLECTION</span>
                <h2>Record Payment</h2>
              </div>
            </div>

            <div className="billing-form">
              <label>
                <span>Payment Mode</span>
                <select name="paymentMode">
                  {paymentModes.map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Amount</span>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={Number(invoice.balanceAmount)}
                  defaultValue={Number(invoice.balanceAmount)}
                  required
                />
              </label>

              <Field
                name="transactionReference"
                label="Transaction Reference"
              />

              <label className="wide">
                <span>Remarks</span>
                <textarea name="remarks" />
              </label>

              <div className="billing-actions wide">
                <button
                  disabled={
                    busy || Number(invoice.balanceAmount) <= 0
                  }
                >
                  Record Payment
                </button>

                {Number(invoice.paidAmount) > 0 ? (
                  <button
                    type="button"
                    className="secondary"
                    onClick={refund}
                  >
                    Request Refund
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <section className="billing-card inner">
            <div className="billing-card-head">
              <div>
                <span>PATIENT ACCOUNT</span>
                <h2>Ledger</h2>
              </div>
            </div>

            <div className="billing-ledger">
              {ledger.map((entry) => (
                <div key={entry.id}>
                  <div>
                    <strong>{entry.description}</strong>
                    <small>
                      {new Date(entry.entryAt).toLocaleString("en-IN")}
                    </small>
                  </div>
                  <span>
                    {Number(entry.debitAmount) > 0
                      ? `Debit ${money(entry.debitAmount)}`
                      : `Credit ${money(entry.creditAmount)}`}
                  </span>
                  <b>{money(entry.balanceAfter)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input name={name} type={type} required={required} />
    </label>
  );
}
