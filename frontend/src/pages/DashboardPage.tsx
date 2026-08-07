import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../api/dashboard.api";
import { PageHeader } from "../components/PageHeader";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import type { DashboardResponse } from "../types/dashboard";
import { ApiClientError } from "../types/api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [data,setData]=useState<DashboardResponse|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;getDashboard().then((result)=>{if(active)setData(result)}).catch((e)=>{if(active)setError(e instanceof ApiClientError?e.message:"Dashboard could not be loaded")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  if(loading)return <div className="page-loading"><Spinner label="Loading dashboard…"/></div>;
  return <div><PageHeader title={`Welcome, ${data?.user.name ?? "User"}`} description={`${data?.hospital.name ?? "AVBHA Healthcare"}${data?.branch ? ` · ${data.branch.name}` : ""}`} />{error?<Alert tone="error">{error}</Alert>:null}{data?<><section className="metric-grid">{data.metrics.map((metric)=><button key={metric.key} className="metric-card" onClick={()=>metric.route&&navigate(metric.route)}><span className="metric-label">{metric.label}</span><strong>{metric.value ?? "—"}</strong><small>{metric.status === "MODULE_NOT_IMPLEMENTED" ? "Ready for frontend integration" : metric.status ?? "Live"}</small></button>)}</section>{data.quickActions.length?<section className="dashboard-section"><div className="section-heading"><div><h2>Quick actions</h2><p>Actions available for your role and permissions.</p></div></div><div className="quick-action-grid">{data.quickActions.map((action)=><button className="quick-action" key={action.key} onClick={()=>navigate(action.route)}><span>＋</span><strong>{action.label}</strong><small>{action.requiredPermission}</small></button>)}</div></section>:null}{data.notices.length?<section className="dashboard-section"><div className="section-heading"><h2>System notices</h2></div>{data.notices.map((notice)=><Alert key={notice}>{notice}</Alert>)}</section>:null}</>:null}</div>;
}
