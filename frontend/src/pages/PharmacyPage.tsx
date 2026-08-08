import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createBatch,
  createMedicine,
  createPurchaseOrder,
  createSupplier,
  listMedicines,
  listPurchaseOrders,
  listPrescriptionQueue,
  dispensePrescription,
  listSales,
  listSuppliers,
  pharmacyDashboard,
  pharmacyInventory,
  receivePurchaseOrder,
  stockLedger,
  type InventoryMedicine,
  type Medicine,
  type PurchaseOrder,
  type PrescriptionQueueItem,
  type Supplier,
} from "../api/pharmacy.api";
import { loadSession } from "../utils/storage";
import "../styles/pharmacy.css";

type Tab =
  | "dashboard"
  | "medicines"
  | "stock"
  | "suppliers"
  | "purchases"
  | "dispensing"
  | "ledger";

type Modal = "medicine" | "supplier" | "batch" | "purchase" | null;

type PurchaseLine = {
  medicineId: string;
  orderedQuantity: string;
  unitPrice: string;
  taxPercent: string;
  discountPercent: string;
};

type ReceiptLine = {
  purchaseOrderItemId: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  receivedQuantity: string;
  rackLocation: string;
};

const emptyPurchaseLine = (): PurchaseLine => ({
  medicineId: "",
  orderedQuantity: "1",
  unitPrice: "0",
  taxPercent: "0",
  discountPercent: "0",
});

const money = (value: any) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const date = (value: any) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

const num = (value: any) => Number(value ?? 0);

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PharmacyPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dash, setDash] = useState<any>({});
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [inv, setInv] = useState<InventoryMedicine[]>([]);
  const [sup, setSup] = useState<Supplier[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [prescriptionQueue,setPrescriptionQueue]=useState<PrescriptionQueueItem[]>([]);
  const [dispenseItem,setDispenseItem]=useState<PrescriptionQueueItem|null>(null);
  const [dispenseRows,setDispenseRows]=useState<Record<string,{batchId:string;quantity:string}>>({});
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    emptyPurchaseLine(),
  ]);
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);

  const branchId = loadSession()?.user.branchId ?? "";

  const load = async () => {
    try {
      setError("");
      const [d, m, i, s, l, p, sa, pq] = await Promise.all([
        pharmacyDashboard(),
        listMedicines(),
        pharmacyInventory(branchId || undefined),
        listSuppliers(),
        stockLedger(branchId || undefined),
        listPurchaseOrders(),
        listSales(),
        listPrescriptionQueue(branchId || undefined),
      ]);
      setDash(d);
      setMeds(m);
      setInv(i);
      setSup(s);
      setLedger(l);
      setPos(p.items ?? []);
      setSales(sa.items ?? []);
      setPrescriptionQueue(pq ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load pharmacy");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalStock = useMemo(
    () =>
      inv.reduce(
        (total, medicine) =>
          total +
          medicine.batches.reduce(
            (batchTotal, batch) => batchTotal + Number(batch.availableQuantity),
            0,
          ),
        0,
      ),
    [inv],
  );

  const openPurchase = () => {
    setPurchaseLines([emptyPurchaseLine()]);
    setSuccess("");
    setError("");
    setModal("purchase");
  };

  const purchaseEstimate = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of purchaseLines) {
      const qty = num(line.orderedQuantity);
      const price = num(line.unitPrice);
      const discount = (qty * price * num(line.discountPercent)) / 100;
      const taxable = qty * price - discount;
      subtotal += taxable;
      tax += (taxable * num(line.taxPercent)) / 100;
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [purchaseLines]);

  const updatePurchaseLine = (
    index: number,
    field: keyof PurchaseLine,
    value: string,
  ) => {
    setPurchaseLines((existing) =>
      existing.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  };

  const addPurchaseLine = () =>
    setPurchaseLines((existing) => [...existing, emptyPurchaseLine()]);

  const removePurchaseLine = (index: number) =>
    setPurchaseLines((existing) =>
      existing.length === 1
        ? existing
        : existing.filter((_, lineIndex) => lineIndex !== index),
    );

  const openReceipt = (purchase: PurchaseOrder) => {
    const remaining = purchase.items
      .map((item) => {
        const balance = Math.max(
          0,
          num(item.orderedQuantity) - num(item.receivedQuantity),
        );
        return {
          purchaseOrderItemId: item.id,
          medicineId: item.medicineId,
          batchNumber: "",
          expiryDate: "",
          purchasePrice: String(item.unitPrice ?? 0),
          sellingPrice: String(item.medicine.sellingPrice ?? item.unitPrice ?? 0),
          receivedQuantity: String(balance),
          rackLocation: "",
        };
      })
      .filter((line) => num(line.receivedQuantity) > 0);

    setReceiptLines(remaining);
    setReceivePo(purchase);
    setError("");
    setSuccess("");
  };

  const updateReceiptLine = (
    index: number,
    field: keyof ReceiptLine,
    value: string,
  ) => {
    setReceiptLines((existing) =>
      existing.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  };

  const openDispense=(item:PrescriptionQueueItem)=>{
    const rows:Record<string,{batchId:string;quantity:string}>={};
    item.items.forEach(pi=>{const b=pi.medicine?.batches.find(x=>Number(x.availableQuantity)>0);rows[pi.id]={batchId:b?.id??"",quantity:pi.prescribedQuantity?String(pi.prescribedQuantity):"1"};});
    setDispenseRows(rows);setDispenseItem(item);setError("");setSuccess("");
  };
  async function submitDispense(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!dispenseItem)return;
    try{
      const items=dispenseItem.items.map(item=>{const row=dispenseRows[item.id];const batch=item.medicine?.batches.find(b=>b.id===row?.batchId);
        if(!item.medicineId||!row?.batchId||!batch)throw new Error(`Select an available batch for ${item.medicineName}.`);
        const quantity=Number(row.quantity);if(!Number.isFinite(quantity)||quantity<=0)throw new Error(`Enter a valid quantity for ${item.medicineName}.`);
        if(quantity>Number(batch.availableQuantity))throw new Error(`Only ${Number(batch.availableQuantity)} units are available for ${item.medicineName}.`);
        return {medicineId:item.medicineId,batchId:row.batchId,prescribedQuantity:item.prescribedQuantity?Number(item.prescribedQuantity):null,dispensedQuantity:quantity,unitPrice:Number(batch.sellingPrice),instructions:item.instructions??null};
      });
      setBusy(true);setError("");setSuccess("");
      await dispensePrescription({branchId,patientId:dispenseItem.patient.id,opdVisitId:dispenseItem.visit.id,prescriptionId:dispenseItem.prescriptionId,items});
      setDispenseItem(null);setDispenseRows({});setSuccess("Medicines dispensed. Batch stock and ledger updated automatically.");await load();
    }catch(caught){setError(caught instanceof Error?caught.message:"Unable to dispense medicines")}finally{setBusy(false)}
  }

  async function submitBasic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      if (modal === "medicine") {
        await createMedicine({
          medicineCode: f.get("code"),
          brandName: f.get("brand"),
          genericName: f.get("generic") || null,
          strength: f.get("strength") || null,
          dosageForm: f.get("form") || null,
          manufacturer: f.get("manufacturer") || null,
          purchasePrice: Number(f.get("purchase") || 0),
          sellingPrice: Number(f.get("selling") || 0),
          reorderLevel: Number(f.get("reorder") || 0),
          requiresPrescription: f.get("rx") === "on",
          controlledDrug: false,
        });
        setSuccess("Medicine created successfully.");
      }

      if (modal === "supplier") {
        await createSupplier({
          supplierCode: f.get("code"),
          supplierName: f.get("name"),
          contactPerson: f.get("contact") || null,
          phone: f.get("phone") || null,
          email: f.get("email") || null,
          gstin: f.get("gstin") || null,
          drugLicenseNo: f.get("license") || null,
          address: f.get("address") || null,
          paymentTerms: f.get("paymentTerms") || null,
        });
        setSuccess("Supplier created successfully.");
      }

      if (modal === "batch") {
        await createBatch({
          branchId,
          medicineId: f.get("medicineId"),
          supplierId: f.get("supplierId") || null,
          batchNumber: f.get("batch"),
          expiryDate: f.get("expiry"),
          purchasePrice: Number(f.get("purchase")),
          sellingPrice: Number(f.get("selling")),
          availableQuantity: Number(f.get("qty")),
          rackLocation: f.get("rack") || null,
        });
        setSuccess("Opening stock batch created successfully.");
      }

      setModal(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitPurchase(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    if (!branchId) {
      setError("A branch must be selected before creating a purchase order.");
      return;
    }

    if (
      purchaseLines.some(
        (line) =>
          !line.medicineId ||
          num(line.orderedQuantity) <= 0 ||
          num(line.unitPrice) < 0,
      )
    ) {
      setError("Complete all purchase-order medicine rows.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await createPurchaseOrder({
        branchId,
        supplierId: String(f.get("supplierId") ?? ""),
        expectedDate: f.get("expectedDate") || null,
        discountAmount: Number(f.get("discountAmount") || 0),
        notes: f.get("notes") || null,
        items: purchaseLines.map((line) => ({
          medicineId: line.medicineId,
          orderedQuantity: num(line.orderedQuantity),
          unitPrice: num(line.unitPrice),
          taxPercent: num(line.taxPercent),
          discountPercent: num(line.discountPercent),
        })),
      });

      setModal(null);
      setTab("purchases");
      setSuccess(
        "Purchase order created. Stock has NOT increased yet. Receive the PO through GRN when goods arrive.",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create purchase order",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitReceipt(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!receivePo) return;

    if (
      receiptLines.length === 0 ||
      receiptLines.some(
        (line) =>
          !line.batchNumber ||
          !line.expiryDate ||
          num(line.receivedQuantity) <= 0 ||
          num(line.purchasePrice) < 0 ||
          num(line.sellingPrice) < 0,
      )
    ) {
      setError("Complete batch, expiry, quantity and price for all GRN rows.");
      return;
    }

    for (const line of receiptLines) {
      const poItem = receivePo.items.find(
        (item) => item.id === line.purchaseOrderItemId,
      );
      const remaining = poItem
        ? Math.max(
            0,
            num(poItem.orderedQuantity) - num(poItem.receivedQuantity),
          )
        : 0;
      if (num(line.receivedQuantity) > remaining) {
        setError(
          `Received quantity cannot exceed remaining ordered quantity for ${
            poItem?.medicine.brandName ?? "medicine"
          }.`,
        );
        return;
      }
    }

    const f = new FormData(e.currentTarget);

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await receivePurchaseOrder(receivePo.id, {
        supplierInvoice: f.get("supplierInvoice") || null,
        notes: f.get("notes") || null,
        batches: receiptLines.map((line) => ({
          purchaseOrderItemId: line.purchaseOrderItemId,
          medicineId: line.medicineId,
          batchNumber: line.batchNumber,
          expiryDate: line.expiryDate,
          purchasePrice: num(line.purchasePrice),
          sellingPrice: num(line.sellingPrice),
          receivedQuantity: num(line.receivedQuantity),
          rackLocation: line.rackLocation || null,
        })),
      });

      setReceivePo(null);
      setReceiptLines([]);
      setTab("stock");
      setSuccess(
        "GRN completed. Accepted medicines were added to batch stock and the stock ledger was updated.",
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to receive purchase");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rx-page">
      <header className="rx-hero">
        <div>
          <span className="rx-eyebrow">PHARMACY OPERATIONS</span>
          <h1>Pharmacy & Medicines</h1>
          <p>
            Prescription-ready medicine master, procurement, batch stock,
            expiry control and dispensing operations.
          </p>
        </div>
        <div className="rx-actions">
          <button onClick={() => setModal("medicine")}>+ Medicine</button>
          <button onClick={openPurchase}>+ Purchase Order</button>
          <button onClick={() => setModal("batch")}>+ Opening Stock</button>
        </div>
      </header>

      {error && <div className="rx-error">{error}</div>}
      {success && <div className="rx-success">{success}</div>}

      <nav className="rx-tabs">
        {(
          [
            "dashboard",
            "medicines",
            "stock",
            "suppliers",
            "purchases",
            "dispensing",
            "ledger",
          ] as Tab[]
        ).map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <>
          <section className="rx-kpis">
            <K label="Medicine master" value={dash.totalMedicines ?? meds.length} />
            <K label="Available units" value={totalStock.toLocaleString("en-IN")} />
            <K label="Low stock batches" value={dash.lowStockBatches ?? 0} warn />
            <K label="Near expiry" value={dash.nearExpiryBatches ?? 0} warn />
            <K label="Today's sales" value={money(dash.todaySalesAmount)} />
          </section>
          <section className="rx-grid">
            <Card title="Procurement workflow">
              <div className="rx-flow">
                <span>Supplier</span><b>→</b>
                <span>Purchase Order</span><b>→</b>
                <span>GRN</span><b>→</b>
                <span>Batch Stock</span><b>→</b>
                <span>Dispense</span>
              </div>
              <p>
                Creating a purchase order does not increase stock. Stock is added
                only after the goods are received through GRN with batch and
                expiry details.
              </p>
            </Card>
            <Card title="Operational queue">
              <div className="rx-stat">
                <span>Open purchase orders</span>
                <b>
                  {
                    pos.filter(
                      (item) =>
                        item.status !== "RECEIVED" &&
                        item.status !== "CANCELLED",
                    ).length
                  }
                </b>
              </div>
              <div className="rx-stat">
                <span>Pending dispensing</span>
                <b>{dash.pendingDispenses ?? 0}</b>
              </div>
              <div className="rx-stat">
                <span>Sales records</span>
                <b>{sales.length}</b>
              </div>
            </Card>
          </section>
        </>
      )}

      {tab === "medicines" && (
        <Table
          heads={[
            "Code",
            "Brand / Generic",
            "Strength",
            "Form",
            "Manufacturer",
            "Selling",
            "Rx",
          ]}
        >
          {meds.map((medicine) => (
            <tr key={medicine.id}>
              <td>{medicine.medicineCode}</td>
              <td>
                <b>{medicine.brandName}</b>
                <small>{medicine.genericName || "—"}</small>
              </td>
              <td>{medicine.strength || "—"}</td>
              <td>{medicine.dosageForm || "—"}</td>
              <td>{medicine.manufacturer || "—"}</td>
              <td>{money(medicine.sellingPrice)}</td>
              <td>{medicine.requiresPrescription ? "Required" : "OTC"}</td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "stock" && (
        <>
          <div className="rx-note">
            Stock shown here is physical pharmacy stock. Normal purchased stock
            should enter through <b>Purchase Order → Receive / GRN</b>.
          </div>
          <Table
            heads={[
              "Medicine",
              "Batch",
              "Expiry",
              "Available",
              "Rack",
              "Purchase",
              "Selling",
            ]}
          >
            {inv.flatMap((medicine) =>
              medicine.batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <b>{medicine.brandName}</b>
                    <small>{medicine.strength}</small>
                  </td>
                  <td>{batch.batchNumber}</td>
                  <td>{date(batch.expiryDate)}</td>
                  <td>
                    <b>{Number(batch.availableQuantity)}</b>
                  </td>
                  <td>{batch.rackLocation || "—"}</td>
                  <td>{money(batch.purchasePrice)}</td>
                  <td>{money(batch.sellingPrice)}</td>
                </tr>
              )),
            )}
          </Table>
        </>
      )}

      {tab === "suppliers" && (
        <>
          <div className="rx-section-action">
            <button onClick={() => setModal("supplier")}>+ Add Supplier</button>
          </div>
          <Table
            heads={[
              "Code",
              "Supplier",
              "Contact",
              "Phone",
              "GSTIN",
              "Drug licence",
            ]}
          >
            {sup.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.supplierCode}</td>
                <td>
                  <b>{supplier.supplierName}</b>
                  <small>{supplier.paymentTerms || ""}</small>
                </td>
                <td>{supplier.contactPerson || "—"}</td>
                <td>{supplier.phone || "—"}</td>
                <td>{supplier.gstin || "—"}</td>
                <td>{supplier.drugLicenseNo || "—"}</td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {tab === "purchases" && (
        <>
          <div className="rx-purchase-toolbar">
            <div>
              <span>PROCUREMENT</span>
              <h2>Purchase Orders & GRN</h2>
              <p>
                Order medicines first. Receive them only when physical stock
                arrives.
              </p>
            </div>
            <button onClick={openPurchase}>+ Purchase Order</button>
          </div>

          <div className="rx-po-list">
            {pos.length === 0 ? (
              <div className="rx-empty">
                <strong>No purchase orders yet</strong>
                <span>Create the first PO to start procurement.</span>
              </div>
            ) : (
              pos.map((purchase) => {
                const ordered = purchase.items.reduce(
                  (total, item) => total + num(item.orderedQuantity),
                  0,
                );
                const received = purchase.items.reduce(
                  (total, item) => total + num(item.receivedQuantity),
                  0,
                );
                const canReceive =
                  purchase.status !== "RECEIVED" &&
                  purchase.status !== "CANCELLED";

                return (
                  <article className="rx-po-card" key={purchase.id}>
                    <div className="rx-po-top">
                      <div>
                        <span>PO NUMBER</span>
                        <h3>{purchase.purchaseNumber}</h3>
                        <p>
                          {purchase.supplier?.supplierName || "Supplier"} ·{" "}
                          {date(purchase.orderDate)}
                        </p>
                      </div>
                      <div className="rx-po-status-block">
                        <span className={`rx-po-status ${purchase.status.toLowerCase()}`}>
                          {statusLabel(purchase.status)}
                        </span>
                        <strong>{money(purchase.totalAmount)}</strong>
                      </div>
                    </div>

                    <div className="rx-po-progress">
                      <div>
                        <span>Received</span>
                        <strong>{received} / {ordered}</strong>
                      </div>
                      <div className="rx-progress-track">
                        <span
                          style={{
                            width: `${ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rx-po-items">
                      {purchase.items.map((item) => (
                        <div key={item.id}>
                          <div>
                            <strong>{item.medicine.brandName}</strong>
                            <small>
                              {item.medicine.strength || item.medicine.genericName || "Medicine"}
                            </small>
                          </div>
                          <span>
                            Ordered <b>{num(item.orderedQuantity)}</b>
                          </span>
                          <span>
                            Received <b>{num(item.receivedQuantity)}</b>
                          </span>
                          <span>
                            Rate <b>{money(item.unitPrice)}</b>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rx-po-bottom">
                      <span>
                        Expected: <b>{date(purchase.expectedDate)}</b>
                      </span>
                      {canReceive && (
                        <button onClick={() => openReceipt(purchase)}>
                          Receive / Create GRN
                        </button>
                      )}
                      {purchase.status === "RECEIVED" && (
                        <span className="rx-received-note">✓ Stock received</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {tab === "dispensing" && (<><div className="rx-purchase-toolbar"><div><span>LIVE PRESCRIPTION QUEUE</span><h2>Prescription & Dispensing Queue</h2><p>OPD prescriptions appear here immediately after the doctor saves a medicine.</p></div><div className="rx-queue-count"><strong>{prescriptionQueue.filter(x=>x.status!=="COMPLETED").length}</strong><span>Pending</span></div></div>
      <div className="rx-prescription-queue">{prescriptionQueue.length===0?<div className="rx-empty"><strong>No prescriptions waiting</strong><span>New OPD prescriptions will appear automatically.</span></div>:prescriptionQueue.map(item=>{
        const patient=[item.patient.firstName,item.patient.middleName,item.patient.lastName].filter(Boolean).join(" ");
        const doctor=[item.doctor.title,item.doctor.employee?.firstName??item.doctor.firstName,item.doctor.employee?.lastName??item.doctor.lastName].filter(Boolean).join(" ");
        return <article className="rx-prescription-card" key={item.id}><div className="rx-prescription-top"><div><span>{item.visit.visitNumber}</span><h3>{patient||"Patient"}</h3><p>{item.patient.uhid||"No UHID"} · {item.patient.primaryMobile||"No mobile"}</p></div><div className="rx-prescription-doctor"><span>DOCTOR</span><strong>{doctor||item.doctor.doctorCode}</strong><small>{item.department?.departmentName||item.doctor.specialization}</small></div><span className={`rx-po-status ${item.status==="COMPLETED"?"received":""}`}>{item.status==="COMPLETED"?"DISPENSED":"PENDING"}</span></div>
        <div className="rx-prescription-items">{item.items.map(pi=><div key={pi.id}><div><strong>{pi.medicineName}</strong><small>{[pi.medicine?.genericName,pi.medicine?.dosageForm].filter(Boolean).join(" · ")||"Medicine"}</small></div><span>Dosage<b>{pi.dosage||"—"}</b></span><span>Frequency<b>{pi.frequency||"—"}</b></span><span>Qty<b>{pi.prescribedQuantity?Number(pi.prescribedQuantity):"—"}</b></span><span>Stock<b>{pi.medicine?.totalAvailable??0}</b></span></div>)}</div>
        <div className="rx-prescription-bottom"><span>Prescribed {new Date(item.createdAt).toLocaleString("en-IN")}</span>{item.status!=="COMPLETED"?<button onClick={()=>openDispense(item)}>Dispense Medicines</button>:<span className="rx-received-note">✓ Stock deducted</span>}</div></article>})}</div></>)}

      {tab === "ledger" && (
        <Table
          heads={[
            "Date / Time",
            "Medicine",
            "Batch",
            "Movement",
            "Quantity",
            "Balance",
            "Reference",
          ]}
        >
          {ledger.map((item) => (
            <tr key={item.id}>
              <td>{new Date(item.transactionAt).toLocaleString("en-IN")}</td>
              <td>{item.medicine?.brandName}</td>
              <td>{item.batch?.batchNumber || "—"}</td>
              <td>{item.transactionType}</td>
              <td>{Number(item.quantity)}</td>
              <td>
                {item.balanceAfter == null ? "—" : Number(item.balanceAfter)}
              </td>
              <td>{item.referenceType || "—"}</td>
            </tr>
          ))}
        </Table>
      )}

      {modal && modal !== "purchase" && (
        <div className="rx-modal-back">
          <form className="rx-modal" onSubmit={submitBasic}>
            <div className="rx-modal-head">
              <h2>
                {modal === "medicine"
                  ? "Add Medicine"
                  : modal === "supplier"
                    ? "Add Supplier"
                    : "Opening Stock Batch"}
              </h2>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            {modal === "medicine" && (
              <div className="rx-form">
                <Input n="code" l="Medicine code" req />
                <Input n="brand" l="Brand name" req />
                <Input n="generic" l="Generic name" />
                <Input n="strength" l="Strength" />
                <Input n="form" l="Dosage form" />
                <Input n="manufacturer" l="Manufacturer" />
                <Input n="purchase" l="Purchase price" type="number" />
                <Input n="selling" l="Selling price" type="number" />
                <Input n="reorder" l="Reorder level" type="number" />
                <label className="rx-check">
                  <input name="rx" type="checkbox" defaultChecked />
                  Prescription required
                </label>
              </div>
            )}

            {modal === "supplier" && (
              <div className="rx-form">
                <Input n="code" l="Supplier code" req />
                <Input n="name" l="Supplier name" req />
                <Input n="contact" l="Contact person" />
                <Input n="phone" l="Phone" />
                <Input n="email" l="Email" type="email" />
                <Input n="gstin" l="GSTIN" />
                <Input n="license" l="Drug licence" />
                <Input n="paymentTerms" l="Payment terms" />
                <label className="rx-wide">
                  Address
                  <textarea name="address" />
                </label>
              </div>
            )}

            {modal === "batch" && (
              <div className="rx-form">
                <label>
                  Medicine
                  <select name="medicineId" required>
                    <option value="">Select</option>
                    {meds.map((medicine) => (
                      <option value={medicine.id} key={medicine.id}>
                        {medicine.brandName} {medicine.strength}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Supplier
                  <select name="supplierId">
                    <option value="">Optional</option>
                    {sup.map((supplier) => (
                      <option value={supplier.id} key={supplier.id}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                </label>
                <Input n="batch" l="Batch number" req />
                <Input n="expiry" l="Expiry date" type="date" req />
                <Input n="qty" l="Opening quantity" type="number" req />
                <Input n="rack" l="Rack / shelf" />
                <Input n="purchase" l="Purchase price" type="number" req />
                <Input n="selling" l="Selling price" type="number" req />
                <div className="rx-wide rx-warning">
                  Use Opening Stock only when setting up an existing pharmacy
                  balance. New purchases should normally use Purchase Order → GRN.
                </div>
              </div>
            )}

            <div className="rx-modal-foot">
              <button type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "purchase" && (
        <div className="rx-modal-back">
          <form className="rx-modal rx-modal-wide" onSubmit={submitPurchase}>
            <div className="rx-modal-head">
              <div>
                <span className="rx-eyebrow dark">PROCUREMENT</span>
                <h2>Create Purchase Order</h2>
              </div>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div className="rx-po-form-head">
              <label>
                Supplier *
                <select name="supplierId" required>
                  <option value="">Select supplier</option>
                  {sup.map((supplier) => (
                    <option value={supplier.id} key={supplier.id}>
                      {supplier.supplierCode} · {supplier.supplierName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Expected delivery
                <input name="expectedDate" type="date" />
              </label>
              <label>
                Overall discount
                <input name="discountAmount" type="number" min="0" step="0.01" defaultValue="0" />
              </label>
            </div>

            <div className="rx-line-editor">
              <div className="rx-line-editor-head">
                <div>
                  <strong>Medicines</strong>
                  <span>Add one or more medicines to this PO.</span>
                </div>
                <button type="button" onClick={addPurchaseLine}>
                  + Add medicine
                </button>
              </div>

              {purchaseLines.map((line, index) => (
                <div className="rx-po-line" key={index}>
                  <label className="rx-po-medicine">
                    Medicine *
                    <select
                      value={line.medicineId}
                      onChange={(event) => {
                        const medicine = meds.find(
                          (item) => item.id === event.target.value,
                        );
                        updatePurchaseLine(index, "medicineId", event.target.value);
                        if (medicine?.purchasePrice != null) {
                          updatePurchaseLine(
                            index,
                            "unitPrice",
                            String(medicine.purchasePrice),
                          );
                        }
                        if (medicine?.gstPercent != null) {
                          updatePurchaseLine(
                            index,
                            "taxPercent",
                            String(medicine.gstPercent),
                          );
                        }
                      }}
                      required
                    >
                      <option value="">Select medicine</option>
                      {meds.map((medicine) => (
                        <option value={medicine.id} key={medicine.id}>
                          {medicine.brandName} {medicine.strength || ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Qty *
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={line.orderedQuantity}
                      onChange={(event) =>
                        updatePurchaseLine(
                          index,
                          "orderedQuantity",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    Rate *
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(event) =>
                        updatePurchaseLine(index, "unitPrice", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Tax %
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={line.taxPercent}
                      onChange={(event) =>
                        updatePurchaseLine(index, "taxPercent", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Discount %
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={line.discountPercent}
                      onChange={(event) =>
                        updatePurchaseLine(
                          index,
                          "discountPercent",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <button
                    className="rx-remove-line"
                    type="button"
                    disabled={purchaseLines.length === 1}
                    onClick={() => removePurchaseLine(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="rx-po-summary">
              <div>
                <span>Subtotal</span>
                <strong>{money(purchaseEstimate.subtotal)}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{money(purchaseEstimate.tax)}</strong>
              </div>
              <div className="grand">
                <span>Estimated total</span>
                <strong>{money(purchaseEstimate.total)}</strong>
              </div>
            </div>

            <label className="rx-notes">
              Purchase notes
              <textarea
                name="notes"
                placeholder="Delivery instructions, supplier reference, etc."
              />
            </label>

            <div className="rx-modal-foot">
              <span className="rx-foot-hint">
                Saving this PO will not increase inventory.
              </span>
              <button type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Creating…" : "Create Purchase Order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {dispenseItem && (<div className="rx-modal-back"><form className="rx-modal rx-modal-wide" onSubmit={submitDispense}><div className="rx-modal-head"><div><span className="rx-eyebrow dark">PRESCRIPTION DISPENSING</span><h2>{[dispenseItem.patient.firstName,dispenseItem.patient.middleName,dispenseItem.patient.lastName].filter(Boolean).join(" ")}</h2><p>{dispenseItem.visit.visitNumber} · {dispenseItem.patient.uhid||"No UHID"}</p></div><button type="button" onClick={()=>setDispenseItem(null)}>×</button></div>
      <div className="rx-dispense-lines">{dispenseItem.items.map(item=>{const row=dispenseRows[item.id]??{batchId:"",quantity:"1"};const selected=item.medicine?.batches.find(b=>b.id===row.batchId);return <section className="rx-dispense-line" key={item.id}><div className="rx-dispense-med"><div><strong>{item.medicineName}</strong><span>{[item.medicine?.genericName,item.medicine?.dosageForm].filter(Boolean).join(" · ")}</span></div><div><span>PRESCRIBED</span><strong>{item.prescribedQuantity?Number(item.prescribedQuantity):"—"}</strong></div></div><div className="rx-dispense-fields"><label>Batch / Expiry *<select required value={row.batchId} onChange={e=>setDispenseRows(x=>({...x,[item.id]:{...row,batchId:e.target.value}}))}><option value="">Select batch</option>{(item.medicine?.batches??[]).map(b=><option value={b.id} key={b.id}>{b.batchNumber} · Exp {new Date(b.expiryDate).toLocaleDateString("en-IN")} · Available {Number(b.availableQuantity)}</option>)}</select></label><label>Dispense quantity *<input required type="number" min="0.001" step="0.001" max={selected?Number(selected.availableQuantity):undefined} value={row.quantity} onChange={e=>setDispenseRows(x=>({...x,[item.id]:{...row,quantity:e.target.value}}))}/></label><div className="rx-batch-summary"><span>AVAILABLE AFTER DISPENSE</span><strong>{selected?Math.max(0,Number(selected.availableQuantity)-Number(row.quantity||0)):"—"}</strong></div></div></section>})}</div>
      <div className="rx-grn-confirm"><div><span>STOCK CONTROL</span><strong>Confirming dispensing immediately deducts selected batch quantities and writes the stock ledger.</strong></div></div><div className="rx-modal-foot"><button type="button" onClick={()=>setDispenseItem(null)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Dispensing…":"Confirm Dispense & Reduce Stock"}</button></div></form></div>)}

      {receivePo && (
        <div className="rx-modal-back">
          <form className="rx-modal rx-modal-wide" onSubmit={submitReceipt}>
            <div className="rx-modal-head">
              <div>
                <span className="rx-eyebrow dark">GOODS RECEIPT / GRN</span>
                <h2>Receive {receivePo.purchaseNumber}</h2>
                <p>{receivePo.supplier?.supplierName}</p>
              </div>
              <button type="button" onClick={() => setReceivePo(null)}>
                ×
              </button>
            </div>

            <div className="rx-grn-meta">
              <label>
                Supplier invoice
                <input
                  name="supplierInvoice"
                  placeholder="Invoice / bill number"
                />
              </label>
              <div className="rx-grn-info">
                <span>Order date</span>
                <strong>{date(receivePo.orderDate)}</strong>
              </div>
              <div className="rx-grn-info">
                <span>PO total</span>
                <strong>{money(receivePo.totalAmount)}</strong>
              </div>
            </div>

            <div className="rx-grn-lines">
              {receiptLines.map((line, index) => {
                const poItem = receivePo.items.find(
                  (item) => item.id === line.purchaseOrderItemId,
                );
                const remaining = poItem
                  ? Math.max(
                      0,
                      num(poItem.orderedQuantity) -
                        num(poItem.receivedQuantity),
                    )
                  : 0;

                return (
                  <section className="rx-grn-line" key={line.purchaseOrderItemId}>
                    <div className="rx-grn-line-title">
                      <div>
                        <strong>{poItem?.medicine.brandName}</strong>
                        <span>
                          {poItem?.medicine.strength ||
                            poItem?.medicine.genericName ||
                            ""}
                        </span>
                      </div>
                      <div>
                        <span>Remaining</span>
                        <strong>{remaining}</strong>
                      </div>
                    </div>

                    <div className="rx-grn-fields">
                      <label>
                        Batch number *
                        <input
                          required
                          value={line.batchNumber}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "batchNumber",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Expiry date *
                        <input
                          required
                          type="date"
                          value={line.expiryDate}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "expiryDate",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Received qty *
                        <input
                          required
                          type="number"
                          min="0.001"
                          max={remaining}
                          step="0.001"
                          value={line.receivedQuantity}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "receivedQuantity",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Purchase rate *
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.purchasePrice}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "purchasePrice",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Selling / MRP *
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.sellingPrice}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "sellingPrice",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Rack / shelf
                        <input
                          value={line.rackLocation}
                          onChange={(event) =>
                            updateReceiptLine(
                              index,
                              "rackLocation",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  </section>
                );
              })}
            </div>

            <label className="rx-notes">
              GRN notes
              <textarea
                name="notes"
                placeholder="Damage, shortage, supplier remarks, etc."
              />
            </label>

            <div className="rx-grn-confirm">
              <div>
                <span>IMPORTANT</span>
                <strong>
                  Confirming this GRN will create the medicine batches and
                  increase physical pharmacy stock.
                </strong>
              </div>
            </div>

            <div className="rx-modal-foot">
              <button type="button" onClick={() => setReceivePo(null)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Receiving…" : "Confirm GRN & Add Stock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function K({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: any;
  warn?: boolean;
}) {
  return (
    <article className={`rx-kpi ${warn ? "warn" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rx-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function Table({
  heads,
  children,
}: {
  heads: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="rx-table-wrap">
      <table>
        <thead>
          <tr>
            {heads.map((head) => (
              <th key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Input({
  n,
  l,
  type = "text",
  req = false,
}: {
  n: string;
  l: string;
  type?: string;
  req?: boolean;
}) {
  return (
    <label>
      {l}
      <input
        name={n}
        type={type}
        required={req}
        step={type === "number" ? "0.01" : undefined}
      />
    </label>
  );
}
