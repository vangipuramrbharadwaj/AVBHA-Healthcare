import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createEmployeeAdmin,
  listBranchesAdmin,
  listDepartmentsAdmin,
  listDesignationsAdmin,
  listEmployeesAdmin,
  updateEmployeeAdmin,
  updateEmployeeStatusAdmin,
  type BranchRecord,
  type DepartmentRecord,
  type DesignationRecord,
  type EmployeeRecord,
} from "../api/administration.api";
import "../styles/administration.css";

const name=(e:EmployeeRecord)=>[e.title,e.firstName,e.middleName,e.lastName].filter(Boolean).join(" ");
const iso=(v?:string|null)=>v?.slice(0,10)??"";

export default function EmployeesPage(){
  const [items,setItems]=useState<EmployeeRecord[]>([]);
  const [branches,setBranches]=useState<BranchRecord[]>([]);
  const [departments,setDepartments]=useState<DepartmentRecord[]>([]);
  const [designations,setDesignations]=useState<DesignationRecord[]>([]);
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<EmployeeRecord|null>(null);
  const [error,setError]=useState(""); const [success,setSuccess]=useState(""); const [busy,setBusy]=useState(false);

  async function load(){
    try{
      setError("");
      const [e,b,d,g]=await Promise.all([listEmployeesAdmin(search),listBranchesAdmin(),listDepartmentsAdmin(),listDesignationsAdmin()]);
      setItems(e.items);setBranches(b.items);setDepartments(d.items);setDesignations(g.items);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load employees")}
  }
  useEffect(()=>{void load()},[]);
  const active=items.filter(x=>x.status==="ACTIVE").length;
  const doctors=items.filter(x=>x.designation?.designationName?.toLowerCase().includes("doctor")).length;
  const linkedManagers=items.filter(x=>x.reportingManagerId).length;
  const filteredDesignations=useMemo(()=>designations.filter(x=>!editing?.departmentId||x.departmentId===editing.departmentId||!x.departmentId),[designations,editing]);

  function begin(item?:EmployeeRecord){setEditing(item??null);setOpen(true);setError("");}
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); const f=new FormData(e.currentTarget); setBusy(true);setError("");
    const body={
      branchId:f.get("branchId")||null, departmentId:f.get("departmentId"),designationId:f.get("designationId"),
      reportingManagerId:f.get("reportingManagerId")||null,title:f.get("title")||null,firstName:f.get("firstName"),
      middleName:f.get("middleName")||null,lastName:f.get("lastName")||null,gender:f.get("gender")||null,
      dateOfBirth:f.get("dateOfBirth")||null,bloodGroup:f.get("bloodGroup")||null,mobile:f.get("mobile"),
      email:f.get("email")||null,employmentType:f.get("employmentType"),joiningDate:f.get("joiningDate"),
      basicSalary:f.get("basicSalary")?Number(f.get("basicSalary")):null,status:f.get("status"),
      ...(!editing?{employeeCode:f.get("employeeCode")}:{})
    };
    try{
      if(editing) await updateEmployeeAdmin(editing.id,body); else await createEmployeeAdmin(body);
      setSuccess(editing?"Employee updated successfully.":"Employee created successfully.");setOpen(false);await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to save employee")}finally{setBusy(false)}
  }
  return <div className="admin-page">
    <header className="admin-hero"><div><span className="admin-eyebrow">WORKFORCE MASTER</span><h1>Employees</h1><p>Central employee records connected to departments, designations, reporting managers, doctors and application users.</p></div><button className="admin-primary" onClick={()=>begin()}>+ Add Employee</button></header>
    {error&&<div className="admin-alert error">{error}</div>}{success&&<div className="admin-alert success">{success}</div>}
    <section className="admin-kpis"><K l="Employees" v={items.length}/><K l="Active" v={active}/><K l="Doctor-designated" v={doctors}/><K l="With manager" v={linkedManagers}/></section>
    <div className="admin-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee, mobile, email or code"/><button onClick={()=>void load()}>Search</button></div>
    <section className="admin-card"><div className="admin-card-head"><div><span>EMPLOYEE DIRECTORY</span><h2>Hospital Workforce</h2></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Employee</th><th>Code</th><th>Department</th><th>Designation</th><th>Branch</th><th>Employment</th><th>Mobile</th><th>Status</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><strong>{name(x)}</strong><small>{x.email||"No email"}</small></td><td>{x.employeeCode}</td><td>{x.department?.departmentName}</td><td>{x.designation?.designationName}</td><td>{x.branch?.branchName||"Main / All"}</td><td>{x.employmentType.replaceAll("_"," ")}</td><td>{x.mobile}</td><td><span className={`admin-pill ${x.status.toLowerCase()}`}>{x.status}</span></td><td><button className="admin-link" onClick={()=>begin(x)}>Edit</button></td></tr>)}</tbody></table>{!items.length&&<div className="admin-empty">No employees found.</div>}</div></section>
    {open&&<div className="admin-modal-bg"><form className="admin-modal" onSubmit={save}><header><div><span>WORKFORCE RECORD</span><h2>{editing?"Edit Employee":"Add Employee"}</h2></div><button type="button" className="admin-close" onClick={()=>setOpen(false)}>×</button></header><div className="admin-form"><div className="admin-grid">
      {!editing&&<F n="employeeCode" l="Employee Code *" req/>}<F n="title" l="Title" d={editing?.title||""}/><F n="firstName" l="First Name *" d={editing?.firstName||""} req/><F n="middleName" l="Middle Name" d={editing?.middleName||""}/><F n="lastName" l="Last Name" d={editing?.lastName||""}/>
      <label className="admin-field"><span>Gender</span><select name="gender" defaultValue={editing?.gender||""}><option value="">Select</option><option>MALE</option><option>FEMALE</option><option>OTHER</option><option>PREFER_NOT_TO_SAY</option></select></label>
      <F n="dateOfBirth" l="Date of Birth" type="date" d={iso(editing?.dateOfBirth)}/><F n="bloodGroup" l="Blood Group" d={editing?.bloodGroup||""}/><F n="mobile" l="Mobile *" d={editing?.mobile||""} req/><F n="email" l="Email" type="email" d={editing?.email||""}/>
      <label className="admin-field"><span>Branch</span><select name="branchId" defaultValue={editing?.branchId||""}><option value="">Main / Hospital-wide</option>{branches.map(x=><option value={x.id} key={x.id}>{x.branchName}</option>)}</select></label>
      <label className="admin-field"><span>Department *</span><select name="departmentId" defaultValue={editing?.departmentId||""} required>{departments.map(x=><option value={x.id} key={x.id}>{x.departmentName}</option>)}</select></label>
      <label className="admin-field"><span>Designation *</span><select name="designationId" defaultValue={editing?.designationId||""} required>{filteredDesignations.map(x=><option value={x.id} key={x.id}>{x.designationName}</option>)}</select></label>
      <label className="admin-field"><span>Reporting Manager</span><select name="reportingManagerId" defaultValue={editing?.reportingManagerId||""}><option value="">None</option>{items.filter(x=>x.id!==editing?.id).map(x=><option value={x.id} key={x.id}>{x.employeeCode} · {name(x)}</option>)}</select></label>
      <label className="admin-field"><span>Employment Type *</span><select name="employmentType" defaultValue={editing?.employmentType||"PERMANENT"}><option>PERMANENT</option><option>CONTRACT</option><option>PART_TIME</option><option>VISITING</option><option>INTERN</option></select></label>
      <F n="joiningDate" l="Joining Date *" type="date" d={iso(editing?.joiningDate)||new Date().toISOString().slice(0,10)} req/><F n="basicSalary" l="Basic Salary" type="number" d={editing?.basicSalary==null?"":String(editing.basicSalary)}/>
      <label className="admin-field"><span>Status</span><select name="status" defaultValue={editing?.status||"ACTIVE"}><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select></label>
    </div><div className="admin-actions"><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button disabled={busy}>{busy?"Saving...":"Save Employee"}</button></div></div></form></div>}
  </div>
}
function K({l,v}:{l:string;v:number}){return <article className="admin-kpi"><span>{l}</span><strong>{v}</strong></article>}
function F({n,l,type="text",d="",req=false}:{n:string;l:string;type?:string;d?:string;req?:boolean}){return <label className="admin-field"><span>{l}</span><input name={n} type={type} defaultValue={d} required={req}/></label>}
