import { useState } from "react";
import { Pencil, FileDown, Eye } from "lucide-react";
import { api, download, money, date } from "../../utils/api";
import { useData, useWorkspace } from "../../utils/context";
import {
  PageHeader,
  Loading,
  ErrorBox,
  DataTable,
  AddButton,
  Modal,
  Badge,
  Tabs,
  useModal,
} from "./UI";
import RecordForm from "./RecordForm";
const actionLabels = {
  receive: "Receive goods",
  "pay-supplier": "Pay supplier",
  invoice: "Create invoice",
  approve: "Approve",
  convert: "Create order",
  advance: "Next stage",
  attendance: "Mark present",
  leave: "Request leave",
  payroll: "Run payroll",
  cancel: "Cancel bill",
};
export default function ModulePage({ kind, columns, children }) {
  const { bootstrap, refresh, notify, version } = useWorkspace();
  const spec = bootstrap.modules[kind];
  const { data, error, loading, reload } = useData(`/records/${kind}`, version);
  const [edit, setEdit] = useState(null),
    [detail, setDetail] = useState(null),
    [pending, setPending] = useState(null);
  const writable =
    bootstrap.user.role !== "Viewer" &&
    (bootstrap.user.role !== "Accountant" ||
      ["customers", "suppliers", "expenses", "eway"].includes(kind));
  async function saved(values) {
    await api(`/records/${kind}${edit?.id ? `/${edit.id}` : ""}`, {
      method: edit?.id ? "PUT" : "POST",
      body: values,
    });
    setEdit(null);
    notify("Record saved");
    refresh();
  }
  async function run(row, action, values = {}) {
    await api(`/records/${kind}/${row.id}/${action}`, {
      method: "POST",
      body: values,
    });
    setPending(null);
    notify("Action completed");
    refresh();
  }
  function request(row, action) {
    if (["receive", "pay-supplier", "leave", "payroll"].includes(action)) {
      setPending({ row, action });
      return;
    }
    setPending({ row, action, confirm: true });
  }
  const actionFields =
    pending?.action === "receive"
      ? [{ key: "quantity", label: "Quantity received", type: "number" }]
      : pending?.action === "pay-supplier"
        ? [{ key: "amount", label: "Payment amount", type: "number" }]
        : pending?.action === "leave"
          ? [
              { key: "from", label: "From", type: "date" },
              { key: "to", label: "To", type: "date" },
              { key: "reason", label: "Reason", type: "text" },
            ]
          : [
              { key: "month", label: "Payroll month (YYYY-MM)", type: "text" },
              { key: "bonus", label: "Bonus", type: "number" },
              { key: "deductions", label: "Deductions", type: "number" },
            ];
  const cols =
    columns ||
    spec.fields.slice(0, 6).map((f) => ({ key: f.key, label: f.label }));
  const usable = (r, a) =>
    !(
      (a === "receive" && r.received >= r.quantity) ||
      (a === "pay-supplier" && r.paid >= r.received * r.price) ||
      (a === "approve" && r.status !== "Draft") ||
      (a === "convert" && r.status !== "Approved") ||
      (a === "invoice" && r.status === "Invoiced") ||
      (a === "advance" && r.status === "Completed") ||
      (a === "cancel" && r.status === "Cancelled")
    );
  return (
    <>
      <PageHeader title={spec.title} description={spec.description}>
        {writable && !spec.readonly && (
          <AddButton onClick={() => setEdit({})}>
            {kind === "production"
              ? "New work order"
              : kind === "quotations"
                ? "New quotation"
                : kind === "purchases"
                  ? "New purchase order"
                  : kind === "sales"
                    ? "New sales order"
                    : kind === "employees"
                      ? "Add employee"
                      : kind === "eway"
                        ? "Create demo bill"
                        : `Add ${kind === "expenses" ? "expense" : kind.slice(0, -1)}`}
          </AddButton>
        )}
      </PageHeader>
      {kind === "eway" && (
        <div className="notice">
          Demo mode · E-way bills are simulated and are not submitted to a
          government portal.
        </div>
      )}
      {children}
      {error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={data}
          columns={cols}
          exportName={`${kind}.csv`}
          actions={(row) => (
            <>
              <button
                title="View details"
                aria-label="View details"
                onClick={() => setDetail(row)}
              >
                <Eye size={16} />
              </button>
              {writable &&
                ["customers", "suppliers", "products", "employees"].includes(
                  kind,
                ) && (
                  <button
                    title="Edit record"
                    aria-label="Edit record"
                    onClick={() => setEdit(row)}
                  >
                    <Pencil size={15} />
                  </button>
                )}
              {["quotations", "purchases", "eway"].includes(kind) && (
                <button
                  title="Download PDF"
                  aria-label="Download PDF"
                  onClick={() =>
                    download(
                      `/documents/${{ quotations: "quotation", purchases: "purchase", eway: "eway" }[kind]}/${row.id}`,
                      `${row.number}.pdf`,
                    ).catch((e) => notify(e.message, "error"))
                  }
                >
                  <FileDown size={16} />
                </button>
              )}
              {writable &&
                spec.actions
                  ?.filter((a) => usable(row, a))
                  .map((a) => (
                    <button key={a} onClick={() => request(row, a)}>
                      {actionLabels[a]}
                    </button>
                  ))}
            </>
          )}
        />
      )}{" "}
      {edit && (
        <Modal
          title={`${edit.id ? "Edit" : "New"} ${{ customers: "customer", suppliers: "supplier", products: "product", employees: "employee", expenses: "expense", quotations: "quotation", purchases: "purchase order", sales: "sales order", production: "work order", eway: "e-way bill" }[kind] || "record"}`}
          onClose={() => setEdit(null)}
          wide
        >
          <RecordForm
            fields={spec.fields}
            initial={edit}
            lines={kind === "quotations"}
            onSubmit={saved}
          />
        </Modal>
      )}
      {detail && (
        <Modal
          title={detail.name || detail.number || "Record details"}
          onClose={() => setDetail(null)}
          wide
        >
          <RecordDetail kind={kind} row={detail} />
        </Modal>
      )}
      {pending && (
        <Modal
          title={actionLabels[pending.action]}
          onClose={() => setPending(null)}
        >
          {pending.confirm ? (
            <Confirm
              action={() => run(pending.row, pending.action)}
              label={actionLabels[pending.action]}
              text={`${actionLabels[pending.action]} for ${pending.row.number || pending.row.name}? Review the record before continuing.`}
            />
          ) : (
            <RecordForm
              fields={actionFields}
              initial={
                pending.action === "receive"
                  ? { quantity: pending.row.quantity - pending.row.received }
                  : pending.action === "pay-supplier"
                    ? {
                        amount:
                          pending.row.received * pending.row.price -
                          pending.row.paid,
                      }
                    : {
                        month: new Date().toISOString().slice(0, 7),
                        bonus: 0,
                        deductions: 0,
                      }
              }
              onSubmit={(values) => run(pending.row, pending.action, values)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
export function Confirm({ action, text, label = "Confirm" }) {
  const modal = useModal();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="confirm">
      <p>{text}</p>
      {error && <ErrorBox message={error} />}
      <div className="confirm-actions">
        {modal && (
          <button
            className="button secondary"
            disabled={busy}
            onClick={modal.close}
          >
            Cancel
          </button>
        )}
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            modal?.setBusy(true);
            try {
              await action();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
              modal?.setBusy(false);
            }
          }}
        >
          {busy ? "Processing…" : label}
        </button>
      </div>
    </div>
  );
}
function RecordDetail({ kind, row }) {
  const { data: invoices } = useData("/invoices");
  const { data: payments } = useData("/payments");
  const { data: purchases } = useData("/records/purchases");
  const { data: supplierPayments } = useData("/records/supplierPayments");
  return (
    <div className="detail-content">
      <dl className="detail-grid">
        {Object.entries(row)
          .filter(([k, v]) => k !== "id" && typeof v !== "object")
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
      </dl>
      {row.items && (
        <DataTable
          search={false}
          rows={row.items}
          columns={[
            { key: "name", label: "Product" },
            { key: "quantity", label: "Quantity" },
            { key: "price", label: "Unit price", type: "money" },
          ]}
        />
      )}
      {kind === "customers" && (
        <>
          <h3>Invoices & outstanding</h3>
          <DataTable
            rows={
              invoices?.filter((i) => Number(i.customer_id) === row.id) || []
            }
            columns={[
              { key: "number", label: "Invoice" },
              { key: "total", label: "Total", type: "money" },
              { key: "paid", label: "Paid", type: "money" },
              { key: "outstanding", label: "Outstanding", type: "money" },
              { key: "status", label: "Status", type: "status" },
            ]}
          />
          <h3>Payment history</h3>
          <DataTable
            rows={
              payments?.filter((p) =>
                invoices?.some(
                  (i) =>
                    Number(i.customer_id) === row.id &&
                    i.id === Number(p.invoice_id),
                ),
              ) || []
            }
            columns={[
              { key: "receipt", label: "Receipt" },
              { key: "amount", label: "Amount", type: "money" },
              { key: "status", label: "Status", type: "status" },
            ]}
          />
        </>
      )}
      {kind === "suppliers" && (
        <>
          <h3>Purchase history</h3>
          <DataTable
            rows={
              purchases?.filter((p) => Number(p.supplierId) === row.id) || []
            }
            columns={[
              { key: "number", label: "Purchase" },
              { key: "total", label: "Total", type: "money" },
              { key: "paid", label: "Paid", type: "money" },
              { key: "status", label: "Status", type: "status" },
            ]}
          />
          <h3>Payments</h3>
          <DataTable
            rows={
              supplierPayments?.filter((p) => p.supplier === row.name) || []
            }
            columns={[
              { key: "purchase", label: "Purchase" },
              { key: "amount", label: "Amount", type: "money" },
              { key: "date", label: "Date", type: "date" },
            ]}
          />
        </>
      )}
    </div>
  );
}
