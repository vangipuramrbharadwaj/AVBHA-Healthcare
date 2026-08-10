import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../api/dashboard.api";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import type { DashboardResponse } from "../types/dashboard";
import { ApiClientError } from "../types/api";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function generatedTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError(null);
      const result = await getDashboard();
      setData(result);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : "Dashboard could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">HOSPITAL COMMAND CENTRE</span>
          <h1>Good day, {data?.user.name ?? "User"}</h1>
          <p>
            {data?.hospital.name ?? "AVBHA Healthcare"}
            {data?.branch ? ` · ${data.branch.name}` : ""}
            {data ? ` · Updated ${generatedTime(data.generatedAt)}` : ""}
          </p>
        </div>
        <button className="dashboard-refresh" onClick={() => void load()}>
          Refresh Dashboard
        </button>
      </header>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {data ? (
        <>
          <section className="dashboard-metrics">
            {data.metrics.map((metric) => (
              <button
                key={metric.key}
                className={`dashboard-metric tone-${(
                  metric.tone ?? "BLUE"
                ).toLowerCase()}`}
                onClick={() =>
                  metric.route ? navigate(metric.route) : undefined
                }
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.helper ?? "Live"}</small>
              </button>
            ))}
          </section>

          <section className="dashboard-layout">
            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span>TODAY</span>
                  <h2>Hospital Activity</h2>
                </div>
              </div>

              <div className="dashboard-activity-grid">
                <Activity
                  label="New patients"
                  value={data.today.patientsRegistered}
                />
                <Activity
                  label="Appointments"
                  value={data.today.appointments}
                />
                <Activity
                  label="OPD visits"
                  value={data.today.opdVisits}
                />
                <Activity
                  label="IPD admissions"
                  value={data.today.ipdAdmissions}
                />
                <Activity
                  label="Discharges"
                  value={data.today.discharges}
                />
                <Activity
                  label="OT cases"
                  value={data.today.otCases}
                />
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span>BED CONTROL</span>
                  <h2>IPD Occupancy</h2>
                </div>
                <strong className="dashboard-big-percent">
                  {data.beds.occupancyPercent}%
                </strong>
              </div>

              <div className="dashboard-bed-progress">
                <span
                  style={{ width: `${data.beds.occupancyPercent}%` }}
                />
              </div>

              <div className="dashboard-bed-grid">
                <Activity label="Total" value={data.beds.total} />
                <Activity label="Occupied" value={data.beds.occupied} />
                <Activity label="Available" value={data.beds.available} />
                <Activity label="Reserved" value={data.beds.reserved} />
                <Activity
                  label="Maintenance"
                  value={data.beds.maintenance}
                />
                <Activity label="Blocked" value={data.beds.blocked} />
              </div>
            </article>
          </section>

          <section className="dashboard-layout">
            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span>LIVE WORK QUEUES</span>
                  <h2>Needs Attention</h2>
                </div>
              </div>

              <div className="dashboard-queue-list">
                <Queue
                  label="Appointments / Reception"
                  value={data.queues.appointmentsWaiting}
                  route="/appointments"
                  onOpen={navigate}
                />
                <Queue
                  label="OPD in progress"
                  value={data.queues.opdInProgress}
                  route="/opd"
                  onOpen={navigate}
                />
                <Queue
                  label="Laboratory pending"
                  value={data.queues.laboratoryPending}
                  route="/laboratory"
                  onOpen={navigate}
                />
                <Queue
                  label="Radiology pending"
                  value={data.queues.radiologyPending}
                  route="/radiology"
                  onOpen={navigate}
                />
                <Queue
                  label="Pharmacy pending"
                  value={data.queues.pharmacyPending}
                  route="/pharmacy"
                  onOpen={navigate}
                />
                <Queue
                  label="Operation Theatre"
                  value={data.queues.otPending}
                  route="/operation-theatre"
                  onOpen={navigate}
                />
                <Queue
                  label="Discharge planned"
                  value={data.queues.dischargePlanned}
                  route="/ipd"
                  onOpen={navigate}
                />
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span>REVENUE & STOCK</span>
                  <h2>Operational Alerts</h2>
                </div>
              </div>

              <div className="dashboard-finance-box">
                <span>Revenue collected today</span>
                <strong>{money(data.today.revenue)}</strong>
                <small>{data.today.payments} payment(s)</small>
              </div>

              <div className="dashboard-alert-grid">
                <AlertStat
                  label="Outstanding invoices"
                  value={data.queues.billingOutstandingCount}
                  note={money(data.queues.billingOutstandingAmount)}
                  warn={data.queues.billingOutstandingCount > 0}
                />
                <AlertStat
                  label="Expiry in 90 days"
                  value={data.pharmacy.expiryAlerts}
                  warn={data.pharmacy.expiryAlerts > 0}
                />
                <AlertStat
                  label="Expired batches"
                  value={data.pharmacy.expiredBatches}
                  warn={data.pharmacy.expiredBatches > 0}
                />
                <AlertStat
                  label="Out-of-stock batches"
                  value={data.pharmacy.outOfStockBatches}
                  warn={data.pharmacy.outOfStockBatches > 0}
                />
              </div>
            </article>
          </section>

          {data.workforce ? (
            <section className="dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span>WORKFORCE</span>
                  <h2>Hospital Team</h2>
                </div>
              </div>
              <div className="dashboard-workforce">
                <Activity
                  label="Departments"
                  value={data.workforce.departments}
                />
                <Activity
                  label="Employees"
                  value={data.workforce.employees}
                />
                <Activity
                  label="Doctors"
                  value={data.workforce.doctors}
                />
                <Activity
                  label="Active users"
                  value={data.workforce.activeUsers}
                />
              </div>
            </section>
          ) : null}

          {data.quickActions.length ? (
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <h2>Quick actions</h2>
                  <p>Common actions available for your role.</p>
                </div>
              </div>
              <div className="quick-action-grid">
                {data.quickActions.map((action) => (
                  <button
                    className="quick-action"
                    key={action.key}
                    onClick={() => navigate(action.route)}
                  >
                    <span>＋</span>
                    <strong>{action.label}</strong>
                    <small>Open module</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {data.security ? (
            <section className="dashboard-security">
              <span>
                Active sessions <b>{data.security.activeSessions}</b>
              </span>
              <span>
                Failed logins today{" "}
                <b>{data.security.failedLoginsToday}</b>
              </span>
              <span>
                Critical security events{" "}
                <b>{data.security.criticalEventsToday}</b>
              </span>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Activity({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="dashboard-activity">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Queue({
  label,
  value,
  route,
  onOpen,
}: {
  label: string;
  value: number;
  route: string;
  onOpen: (route: string) => void;
}) {
  return (
    <button
      className={value > 0 ? "dashboard-queue has-items" : "dashboard-queue"}
      onClick={() => onOpen(route)}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Open →</small>
    </button>
  );
}

function AlertStat({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: number;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className={warn ? "dashboard-alert-stat warn" : "dashboard-alert-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
