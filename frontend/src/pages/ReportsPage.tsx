import { useEffect, useMemo, useState } from "react";
import {
  reportAppointments,
  reportDepartments,
  reportDoctors,
  reportInventory,
  reportIpd,
  reportLaboratory,
  reportOpd,
  reportOverview,
  reportPatients,
  reportPharmacy,
  reportRadiology,
  reportRevenue,
  type GenericReport,
  type OverviewReport,
  type ReportFilters,
  type RevenueReport,
} from "../api/reports.api";
import { listBranches } from "../api/reception-opd.api";
import {
  downloadJson,
  printCurrentPage,
} from "../utils/print";
import type { BranchSummary } from "../types/reception-opd";
import "../styles/reports.css";

type ReportKey =
  | "overview"
  | "patients"
  | "appointments"
  | "opd"
  | "ipd"
  | "revenue"
  | "laboratory"
  | "radiology"
  | "pharmacy"
  | "inventory"
  | "departments"
  | "doctors";

type ReportValue =
  | OverviewReport
  | RevenueReport
  | GenericReport;

const REPORTS: Array<{
  key: ReportKey;
  label: string;
  category: string;
}> = [
  { key: "overview", label: "Management Overview", category: "MIS" },
  { key: "patients", label: "Patient Registrations", category: "Clinical" },
  { key: "appointments", label: "Appointments", category: "Clinical" },
  { key: "opd", label: "OPD", category: "Clinical" },
  { key: "ipd", label: "IPD", category: "Clinical" },
  { key: "laboratory", label: "Laboratory", category: "Diagnostics" },
  { key: "radiology", label: "Radiology", category: "Diagnostics" },
  { key: "pharmacy", label: "Pharmacy", category: "Operations" },
  { key: "inventory", label: "Inventory", category: "Operations" },
  { key: "revenue", label: "Revenue & Collections", category: "Finance" },
  { key: "departments", label: "Department Performance", category: "Performance" },
  { key: "doctors", label: "Doctor Performance", category: "Performance" },
];

function dateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth() {
  const now = new Date();
  return dateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function money(value: unknown) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ReportsPage() {
  const [reportKey, setReportKey] =
    useState<ReportKey>("overview");
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(dateInput(new Date()));
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [data, setData] = useState<ReportValue | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedReport = useMemo(
    () => REPORTS.find((item) => item.key === reportKey)!,
    [reportKey],
  );

  useEffect(() => {
    void listBranches()
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  async function load() {
    setBusy(true);
    setError("");

    const filters: ReportFilters = {
      from,
      to,
      ...(branchId ? { branchId } : {}),
    };

    try {
      let result: ReportValue;

      switch (reportKey) {
        case "overview":
          result = await reportOverview(filters);
          break;
        case "patients":
          result = await reportPatients(filters);
          break;
        case "appointments":
          result = await reportAppointments(filters);
          break;
        case "opd":
          result = await reportOpd(filters);
          break;
        case "ipd":
          result = await reportIpd(filters);
          break;
        case "revenue":
          result = await reportRevenue(filters);
          break;
        case "laboratory":
          result = await reportLaboratory(filters);
          break;
        case "radiology":
          result = await reportRadiology(filters);
          break;
        case "pharmacy":
          result = await reportPharmacy(filters);
          break;
        case "inventory":
          result = await reportInventory(filters);
          break;
        case "departments":
          result = await reportDepartments(filters);
          break;
        case "doctors":
          result = await reportDoctors(filters);
          break;
      }

      setData(result);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to generate report.",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [reportKey]);

  return (
    <div className="reports-page">
      <header className="reports-hero no-print">
        <div>
          <span>MANAGEMENT INFORMATION SYSTEM</span>
          <h1>Reports & MIS</h1>
          <p>
            Clinical, operational, diagnostic, inventory and financial
            reporting from the live hospital database.
          </p>
        </div>

        <div className="reports-hero-actions">
          <button
            onClick={() =>
              printCurrentPage(
                `AVBHA ${selectedReport.label} ${from} to ${to}`,
              )
            }
          >
            Print / Save PDF
          </button>

          <button
            onClick={() =>
              data &&
              downloadJson(
                `AVBHA_${reportKey}_${from}_${to}.json`,
                data,
              )
            }
            disabled={!data}
          >
            Export Data
          </button>
        </div>
      </header>

      <section className="reports-filter no-print">
        <label>
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label>
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>

        <label>
          <span>Branch</span>
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">All permitted branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => void load()} disabled={busy}>
          {busy ? "Generating..." : "Generate Report"}
        </button>
      </section>

      <div className="reports-layout">
        <aside className="reports-menu no-print">
          {REPORTS.map((report) => (
            <button
              key={report.key}
              className={report.key === reportKey ? "active" : ""}
              onClick={() => setReportKey(report.key)}
            >
              <small>{report.category}</small>
              <strong>{report.label}</strong>
            </button>
          ))}
        </aside>

        <main className="reports-paper">
          <div className="report-print-header">
            <div>
              <span>AVBHA HEALTHCARE HIMS</span>
              <h2>{selectedReport.label}</h2>
            </div>
            <p>
              Period: {from} to {to}
              {branchId
                ? ` · ${branches.find((b) => b.id === branchId)?.branchName ?? "Selected Branch"}`
                : " · All permitted branches"}
            </p>
          </div>

          {error ? (
            <div className="report-error">{error}</div>
          ) : null}

          {!error && busy ? (
            <div className="report-empty">Generating report…</div>
          ) : null}

          {!error && !busy && data ? (
            reportKey === "overview" ? (
              <Overview value={data as OverviewReport} />
            ) : reportKey === "revenue" ? (
              <Revenue value={data as RevenueReport} />
            ) : (
              <Generic value={data as GenericReport} />
            )
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Overview({ value }: { value: OverviewReport }) {
  const billing = value.billing ?? {
    invoices: 0,
    billed: 0,
    paidAgainstInvoices: 0,
    outstanding: 0,
    receipts: 0,
    collections: 0,
  };
  const pharmacy = value.pharmacy ?? {
    sales: 0,
    grossSales: 0,
    collected: 0,
  };

  const cards: Array<[string, string | number]> = [
    ["New Patients", numberValue(value.newPatients)],
    ["Appointments", numberValue(value.appointments)],
    ["OPD Visits", numberValue(value.opdVisits)],
    ["IPD Admissions", numberValue(value.ipdAdmissions)],
    ["Lab Orders", numberValue(value.labOrders)],
    ["Radiology Orders", numberValue(value.radiologyOrders)],
    ["Billing Invoices", numberValue(billing.invoices)],
    ["Collections", money(billing.collections)],
    ["Outstanding", money(billing.outstanding)],
    ["Pharmacy Sales", numberValue(pharmacy.sales)],
    ["Pharmacy Gross", money(pharmacy.grossSales)],
    ["Pharmacy Collected", money(pharmacy.collected)],
  ];

  return (
    <>
      <section className="report-kpis">
        {cards.map(([label, result]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong>{result}</strong>
          </article>
        ))}
      </section>

      <section className="report-section">
        <h3>Financial Summary</h3>
        <DataTable
          rows={[
            ["Billed", money(billing.billed)],
            ["Paid Against Invoices", money(billing.paidAgainstInvoices)],
            ["Receipts", numberValue(billing.receipts)],
            ["Collections", money(billing.collections)],
            ["Outstanding", money(billing.outstanding)],
          ]}
        />
      </section>
    </>
  );
}

function Revenue({ value }: { value: RevenueReport }) {
  const paymentModes = Array.isArray(value.paymentModes)
    ? value.paymentModes
    : [];

  return (
    <>
      <section className="report-kpis">
        <Metric label="Invoices" value={numberValue(value.invoiceCount)} />
        <Metric label="Billed" value={money(value.billed)} />
        <Metric label="Collections" value={money(value.collections)} />
        <Metric label="Outstanding" value={money(value.outstanding)} />
        <Metric label="Tax" value={money(value.tax)} />
        <Metric label="Discount" value={money(value.discount)} />
      </section>

      <section className="report-section">
        <h3>Payment Modes</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Payment Mode</th>
              <th>Transactions</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {paymentModes.map((item) => (
              <tr key={item.paymentMode}>
                <td>{titleCase(item.paymentMode)}</td>
                <td>{numberValue(item.count)}</td>
                <td>{money(item.amount)}</td>
              </tr>
            ))}
            {!paymentModes.length ? (
              <tr>
                <td colSpan={3}>No completed payments in this period.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Generic({ value }: { value: GenericReport }) {
  return (
    <section className="report-generic">
      {Object.entries(value).map(([key, item]) => (
        <GenericValue key={key} label={titleCase(key)} value={item} />
      ))}
    </section>
  );
}

function GenericValue({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  if (Array.isArray(value)) {
    return (
      <section className="report-section">
        <h3>{label}</h3>
        {value.length ? (
          <GenericArray value={value} />
        ) : (
          <p className="report-empty-inline">No records.</p>
        )}
      </section>
    );
  }

  if (value && typeof value === "object") {
    return (
      <section className="report-section">
        <h3>{label}</h3>
        <DataTable
          rows={Object.entries(value as Record<string, unknown>).map(
            ([key, item]) => [titleCase(key), display(item)],
          )}
        />
      </section>
    );
  }

  return <Metric label={label} value={display(value)} />;
}

function GenericArray({ value }: { value: unknown[] }) {
  const objects = value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );

  if (objects.length !== value.length || !objects.length) {
    return (
      <div className="report-chip-list">
        {value.map((item, index) => (
          <span key={index}>{display(item)}</span>
        ))}
      </div>
    );
  }

  const allColumns = Array.from(
    new Set(objects.flatMap((item) => Object.keys(item))),
  );

  const columns = allColumns.filter((column) => {
    if (
      column === "doctorId" &&
      allColumns.includes("doctorName")
    ) {
      return false;
    }

    if (
      column === "departmentId" &&
      allColumns.includes("departmentName")
    ) {
      return false;
    }

    if (
      column === "branchId" &&
      allColumns.includes("branchName")
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="report-table-scroll">
      <table className="report-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{titleCase(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {objects.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{display(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("_all" in record) {
      return numberValue(record._all);
    }

    if ("count" in record) {
      return numberValue(record.count);
    }
  }

  return 0;
}

function display(value: unknown): string {
  if (value === null || value === undefined) return "—";

  if (typeof value === "number") {
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("_all" in record) {
      return display(record._all);
    }

    if ("count" in record && Object.keys(record).length === 1) {
      return display(record.count);
    }

    return Object.entries(record)
      .map(([key, item]) => `${titleCase(key)}: ${display(item)}`)
      .join(" · ");
  }

  return String(value).replaceAll("_", " ");
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DataTable({
  rows,
}: {
  rows: Array<[string, string | number]>;
}) {
  return (
    <table className="report-table compact">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th>{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
