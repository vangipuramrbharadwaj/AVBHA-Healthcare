import {FormEvent,useEffect,useMemo,useState} from "react";
import {collectLabSample,createLabTest,enterLabResult,getLabOrder,listLabOrders,listLabTests,rejectLabSample,updateLabResultStatus,type LabOrder,type LabTest} from "../api/laboratory.api";
import "../styles/laboratory.css";
const pn=(p:any)=>[p?.firstName,p?.middleName,p?.lastName].filter(Boolean).join(" ")||"Patient";
const dt=(v?:string|null)=>v?new Date(v).toLocaleString("en-IN"):"—";
export default function LaboratoryPage(){
 const [tab,setTab]=useState<"queue"|"tests">("queue"),[orders,setOrders]=useState<LabOrder[]>([]),[tests,setTests]=useState<LabTest[]>([]),[selected,setSelected]=useState<LabOrder|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{setError("");const [o,t]=await Promise.all([listLabOrders(),listLabTests()]);setOrders(o.items);setTests(t)}catch(e){setError(e instanceof Error?e.message:"Unable to load laboratory")}}
 useEffect(()=>{void load()},[]);
 async function open(id:string){try{setBusy(true);setSelected(await getLabOrder(id))}catch(e){setError(e instanceof Error?e.message:"Unable to open order")}finally{setBusy(false)}}
 async function run(fn:()=>Promise<any>,ok:string){try{setBusy(true);setError("");await fn();setMessage(ok);await load();if(selected)setSelected(await getLabOrder(selected.id))}catch(e){setError(e instanceof Error?e.message:"Request failed")}finally{setBusy(false)}}
 const counts=useMemo(()=>({total:orders.length,pending:orders.filter(x=>["ORDERED","SAMPLE_PENDING"].includes(x.status)).length,collected:orders.filter(x=>x.status==="SAMPLE_COLLECTED").length,result:orders.filter(x=>x.status==="RESULT_ENTERED").length,reported:orders.filter(x=>["VERIFIED","REPORTED"].includes(x.status)).length}),[orders]);
 return <div className="hms-module-page"><header className="hms-module-hero"><div><span>LABORATORY INFORMATION SYSTEM</span><h1>Laboratory</h1><p>Test master, specimen collection, result entry, verification and patient-linked reporting for OPD and IPD.</p></div><button onClick={()=>setTab("tests")}>Test Master</button></header>
 {error&&<div className="hms-alert error">{error}</div>}{message&&<div className="hms-alert success">{message}</div>}
 <section className="hms-kpis"><K l="Orders" v={counts.total}/><K l="Awaiting sample" v={counts.pending}/><K l="Collected" v={counts.collected}/><K l="Results entered" v={counts.result}/><K l="Verified / Reported" v={counts.reported}/></section>
 <nav className="hms-tabs"><button className={tab==="queue"?"active":""} onClick={()=>setTab("queue")}>Work Queue</button><button className={tab==="tests"?"active":""} onClick={()=>setTab("tests")}>Test Catalogue</button></nav>
 {tab==="queue"?<section className="hms-card"><div className="hms-card-head"><div><span>LIVE LAB QUEUE</span><h2>Orders & Samples</h2></div><button className="hms-action" onClick={()=>void load()}>Refresh</button></div><div className="hms-table-wrap"><table className="hms-table"><thead><tr><th>Order</th><th>Patient</th><th>Source</th><th>Tests</th><th>Priority</th><th>Status</th><th>Ordered</th><th/></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><strong>{o.orderNumber}</strong></td><td><strong>{pn(o.patient)}</strong><small>{o.patient.uhid||""}</small></td><td>{o.ipdAdmissionId?<span className="hms-pill warn">IPD</span>:<span className="hms-pill">OPD / External</span>}</td><td>{o.items.map(x=>x.test.testName).join(", ")}</td><td>{o.priority}</td><td><span className={`hms-pill ${["VERIFIED","REPORTED"].includes(o.status)?"good":""}`}>{o.status.replaceAll("_"," ")}</span></td><td>{dt(o.orderedAt)}</td><td><button className="hms-action" onClick={()=>void open(o.id)}>Open</button></td></tr>)}</tbody></table>{!orders.length&&<div className="hms-empty">No laboratory orders.</div>}</div></section>:<TestMaster tests={tests} busy={busy} run={run}/>}
 {selected&&<OrderModal order={selected} busy={busy} close={()=>setSelected(null)} run={run}/>}
 </div>
}
function K({l,v}:{l:string;v:any}){return <article className="hms-kpi"><span>{l}</span><strong>{v}</strong></article>}
function TestMaster({tests,busy,run}:{tests:LabTest[];busy:boolean;run:(f:()=>Promise<any>,m:string)=>void}){const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);run(()=>createLabTest({testCode:f.get("code"),testName:f.get("name"),category:f.get("category")||null,sampleType:f.get("sample"),containerType:f.get("container")||null,turnaroundMinutes:f.get("tat")?Number(f.get("tat")):null,price:f.get("price")?Number(f.get("price")):null,instructions:f.get("instructions")||null,parameters:[]}),"Laboratory test created");e.currentTarget.reset()};return <div className="hms-grid-2"><section className="hms-card"><div className="hms-card-head"><div><span>MASTER DATA</span><h2>Active Tests</h2></div></div><div className="hms-detail-list">{tests.map(t=><article key={t.id}><header><strong>{t.testName}</strong><span>{t.testCode}</span></header><p>{t.category||"General"} · {t.sampleType} · ₹{Number(t.price||0).toLocaleString("en-IN")} · TAT {t.turnaroundMinutes||"—"} min</p></article>)}</div></section><form className="hms-card" onSubmit={submit}><div className="hms-card-head"><div><span>NEW TEST</span><h2>Add Test</h2></div></div><div className="hms-form"><div className="hms-form-grid"><F n="code" l="Test code" req/><F n="name" l="Test name" req/><F n="category" l="Category"/><F n="sample" l="Sample type" req/><F n="container" l="Container"/><F n="tat" l="TAT minutes" type="number"/><F n="price" l="Price" type="number"/></div><T n="instructions" l="Instructions"/><div className="hms-actions"><button disabled={busy}>Create Test</button></div></div></form></div>}
function OrderModal({
  order,
  busy,
  close,
  run,
}: {
  order: LabOrder;
  busy: boolean;
  close: () => void;
  run: (f: () => Promise<any>, m: string) => void;
}) {
  return (
    <div className="hms-modal-bg" onMouseDown={close}>
      <section className="hms-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <small>{order.orderNumber}</small>
            <h2>{pn(order.patient)}</h2>
          </div>
          <button type="button" onClick={close}>×</button>
        </header>

        <div className="hms-detail-list">
          {order.items.map((item) => (
            <article key={item.id}>
              <header>
                <strong>{item.test.testName}</strong>
                <span className="hms-pill">
                  {item.status.replaceAll("_", " ")}
                </span>
              </header>

              <p>
                Sample: {item.sample?.status || "Pending"}
                {item.sample?.sampleNumber
                  ? ` · ${item.sample.sampleNumber}`
                  : ""}
              </p>

              {item.sample?.status === "PENDING" && (
                <div className="hms-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          collectLabSample(item.sample!.id, {
                            barcode: null,
                          }),
                        "Sample collected",
                      )
                    }
                  >
                    Collect Sample
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          rejectLabSample(item.sample!.id, {
                            rejectionReason: "Rejected by laboratory",
                          }),
                        "Sample rejected",
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              )}

              {item.sample?.status === "COLLECTED" && !item.result && (
                <ResultForm
                  parameters={item.test.parameters || []}
                  busy={busy}
                  save={(body) =>
                    run(
                      () => enterLabResult(item.id, body),
                      "Laboratory result entered",
                    )
                  }
                />
              )}

              {item.result && (
                <div className="lab-result-view">
                  {item.result.values.length > 0 && (
                    <div className="hms-detail-list">
                      {item.result.values.map((resultValue) => {
                        const shownValue =
                          resultValue.numericValue ??
                          resultValue.textValue ??
                          resultValue.choiceValue ??
                          (resultValue.booleanValue === true
                            ? "Positive"
                            : resultValue.booleanValue === false
                              ? "Negative"
                              : "—");

                        return (
                          <article key={resultValue.id}>
                            <header>
                              <strong>
                                {resultValue.parameter.parameterName}
                              </strong>
                              <span>
                                {String(shownValue)}{" "}
                                {resultValue.unit ||
                                  resultValue.parameter.unit ||
                                  ""}
                              </span>
                            </header>
                            <p>
                              Reference:{" "}
                              {resultValue.referenceRange ||
                                resultValue.parameter.referenceRange ||
                                "—"}
                              {resultValue.abnormalFlag
                                ? ` · Flag: ${resultValue.abnormalFlag}`
                                : ""}
                              {resultValue.critical ? " · CRITICAL" : ""}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {item.result.interpretation && (
                    <p>
                      <b>Interpretation:</b>{" "}
                      {item.result.interpretation}
                    </p>
                  )}

                  {item.result.remarks && (
                    <p>
                      <b>Remarks:</b> {item.result.remarks}
                    </p>
                  )}

                  <div className="hms-actions">
                    {item.result.status === "ENTERED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () =>
                              updateLabResultStatus(item.result!.id, {
                                status: "VERIFIED",
                              }),
                            "Result verified",
                          )
                        }
                      >
                        Verify Result
                      </button>
                    )}

                    {item.result.status === "VERIFIED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () =>
                              updateLabResultStatus(item.result!.id, {
                                status: "RELEASED",
                              }),
                            "Report released",
                          )
                        }
                      >
                        Release Report
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResultForm({
  parameters,
  busy,
  save,
}: {
  parameters: NonNullable<LabTest["parameters"]>;
  busy: boolean;
  save: (x: any) => void;
}) {
  const [error, setError] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const f = new FormData(e.currentTarget);
    const interpretation = String(f.get("interpretation") || "").trim();
    const remarks = String(f.get("remarks") || "").trim();

    type ResultValueInput = {
      parameterId: string;
      numericValue?: number;
      textValue?: string;
      booleanValue?: boolean;
      choiceValue?: string;
      unit?: string | null;
      referenceRange?: string | null;
      abnormalFlag?: string | null;
      critical?: boolean;
      comments?: string | null;
    };

    const values: ResultValueInput[] = [];

    for (const parameter of parameters) {
      const raw = String(f.get(`p_${parameter.id}`) || "").trim();

      if (!raw && !parameter.required) {
        continue;
      }

      if (!raw && parameter.required) {
        continue;
      }

      const base = {
        parameterId: parameter.id,
        unit: parameter.unit || null,
        referenceRange: parameter.referenceRange || null,
        abnormalFlag: null,
        critical: false,
        comments: null,
      };

      const valueType = String(parameter.valueType || "TEXT").toUpperCase();

      if (["NUMBER", "NUMERIC", "DECIMAL", "INTEGER"].includes(valueType)) {
        const numeric = Number(raw);

        if (!Number.isFinite(numeric)) {
          setError(`${parameter.parameterName} must be a valid number.`);
          return;
        }

        values.push({
          ...base,
          numericValue: numeric,
        });
        continue;
      }

      if (["BOOLEAN", "BOOL"].includes(valueType)) {
        values.push({
          ...base,
          booleanValue: ["TRUE", "YES", "POSITIVE", "1"].includes(
            raw.toUpperCase(),
          ),
        });
        continue;
      }

      if (["CHOICE", "SELECT", "ENUM"].includes(valueType)) {
        values.push({
          ...base,
          choiceValue: raw,
        });
        continue;
      }

      values.push({
        ...base,
        textValue: raw,
      });
    }

    const missingRequired = parameters.find(
      (parameter) =>
        parameter.required &&
        !String(f.get(`p_${parameter.id}`) || "").trim(),
    );

    if (missingRequired) {
      setError(`${missingRequired.parameterName} is required.`);
      return;
    }

    if (parameters.length === 0 && !interpretation) {
      setError("Enter the result / interpretation before saving.");
      return;
    }

    save({
      interpretation: interpretation || null,
      remarks: remarks || null,
      values,
    });
  };

  return (
    <form className="hms-form lab-result-form" onSubmit={submit}>
      <div className="hms-card-head">
        <div>
          <span>RESULT ENTRY</span>
          <h2>
            {parameters.length > 0
              ? "Enter Parameter Results"
              : "Enter Test Result"}
          </h2>
        </div>
      </div>

      {error && <div className="hms-alert error">{error}</div>}

      {parameters.length > 0 ? (
        <div className="hms-form-grid">
          {parameters.map((parameter) => (
            <label className="hms-field" key={parameter.id}>
              <span>
                {parameter.parameterName}
                {parameter.unit ? ` (${parameter.unit})` : ""}
                {parameter.required ? " *" : ""}
              </span>
              <input
                name={`p_${parameter.id}`}
                type={
                  ["NUMBER", "NUMERIC", "DECIMAL", "INTEGER"].includes(
                    String(parameter.valueType).toUpperCase(),
                  )
                    ? "number"
                    : "text"
                }
                step="any"
                required={parameter.required}
              />
              {parameter.referenceRange && (
                <small>
                  Reference range: {parameter.referenceRange}
                </small>
              )}
            </label>
          ))}
        </div>
      ) : (
        <label className="hms-field">
          <span>Result / Interpretation *</span>
          <textarea
            name="interpretation"
            required
            placeholder="Enter the laboratory result"
          />
        </label>
      )}

      {parameters.length > 0 && (
        <label className="hms-field">
          <span>Interpretation</span>
          <textarea
            name="interpretation"
            placeholder="Clinical interpretation / comments"
          />
        </label>
      )}

      <label className="hms-field">
        <span>Laboratory remarks</span>
        <textarea name="remarks" />
      </label>

      <div className="hms-actions">
        <button disabled={busy}>Save Result</button>
      </div>
    </form>
  );
}

function F({n,l,type="text",req=false}:{n:string;l:string;type?:string;req?:boolean}){return <label className="hms-field"><span>{l}</span><input name={n} type={type} required={req}/></label>}function T({n,l}:{n:string;l:string}){return <label className="hms-field"><span>{l}</span><textarea name={n}/></label>}
