import { useState } from "react";
import {
  FileDown,
  Eye,
  Mail,
  MessageCircle,
  Wallet,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { useData, useWorkspace } from "../../utils/context";
import { api, money, download, date } from "../../utils/api";
import {
  PageHeader,
  DataTable,
  Modal,
  Loading,
  ErrorBox,
  AddButton,
  Stat,
  Badge,
  Tabs,
} from "../Common/UI";
import RecordForm from "../Common/RecordForm";
export const invoiceFields = [
  { key: "customerId", label: "Customer", type: "customer" },
  { key: "date", label: "Invoice date", type: "date" },
  { key: "dueDate", label: "Due date", type: "date" },
  {
    key: "discountType",
    label: "Discount type",
    type: "select",
    options: ["fixed", "percent"],
  },
  { key: "discountValue", label: "Discount value", type: "number" },
  { key: "taxRate", label: "GST %", type: "number" },
];
export default function Invoices() {
  const { version, refresh, notify, bootstrap } = useWorkspace();
  const { data, error, loading, reload } = useData("/invoices", version);
  const payments = useData("/payments", version);
  const [create, setCreate] = useState(false),
    [selected, setSelected] = useState(null),
    [pay, setPay] = useState(null);
  const writable = bootstrap.user.role !== "Viewer";
  const selectedInvoice = data?.find((i) => i.id === selected?.id) || selected;
  const doc = (type, id, name) =>
    download(`/documents/${type}/${id}`, `${name}.pdf`).catch((e) =>
      notify(e.message, "error"),
    );
  async function share(type, id, channel) {
    try {
      const result = await api("/share", {
        method: "POST",
        body: { type, id, channel },
      });
      notify(result.message);
    } catch (e) {
      notify(e.message, "error");
    }
  }
  return (
    <>
      <PageHeader
        title="GST invoices"
        description="One invoice. Every installment. A complete picture."
      >
        {writable && (
          <AddButton onClick={() => setCreate(true)}>New invoice</AddButton>
        )}
      </PageHeader>
      {error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid three">
            <Stat
              icon={Receipt}
              label="Invoiced value"
              value={money(data.reduce((s, i) => s + i.total, 0))}
              detail={`${data.length} original invoices`}
            />
            <Stat
              icon={IndianRupee}
              label="Payments received"
              value={money(data.reduce((s, i) => s + i.paid, 0))}
              detail="Successful payments, less refunds"
            />
            <Stat
              icon={Wallet}
              label="Outstanding"
              value={money(data.reduce((s, i) => s + i.outstanding, 0))}
              detail="Ready for your next collection"
            />
          </div>
          <DataTable
            rows={data}
            exportName="invoices.csv"
            columns={[
              { key: "number", label: "Invoice" },
              { key: "customer", label: "Customer" },
              { key: "date", label: "Issued", type: "date" },
              { key: "total", label: "Total", type: "money" },
              { key: "paid", label: "Paid", type: "money" },
              { key: "outstanding", label: "Balance", type: "money" },
              { key: "status", label: "Status", type: "status" },
            ]}
            actions={(r) => (
              <>
                <button
                  aria-label="View invoice"
                  title="View invoice"
                  onClick={() => setSelected(r)}
                >
                  <Eye size={16} />
                </button>
                <button
                  aria-label="Download invoice PDF"
                  title="Download PDF"
                  onClick={() => doc("invoice", r.id, r.number)}
                >
                  <FileDown size={16} />
                </button>
                {writable && r.outstanding > 0 && (
                  <button onClick={() => setPay(r)}>Collect payment</button>
                )}
              </>
            )}
          />
        </>
      )}
      {create && (
        <Modal title="Create GST invoice" wide onClose={() => setCreate(false)}>
          <RecordForm
            fields={invoiceFields}
            lines
            onSubmit={async (values) => {
              await api("/invoices", { method: "POST", body: values });
              setCreate(false);
              refresh();
              notify("Invoice created and stock updated");
            }}
            submitLabel="Create invoice"
          />
        </Modal>
      )}
      {pay && (
        <Modal
          title={`Collect payment · ${pay.number}`}
          onClose={() => setPay(null)}
        >
          <div className="payment-summary">
            Outstanding <strong>{money(pay.outstanding)}</strong>
          </div>
          <RecordForm
            fields={[
              { key: "amount", label: "Payment amount", type: "number" },
              {
                key: "method",
                label: "Payment method",
                type: "select",
                options: ["Bank transfer", "Cash", "UPI"],
              },
              {
                key: "reference",
                label: "Unique transaction reference",
                type: "text",
              },
            ]}
            initial={{
              amount: pay.outstanding,
              reference: `DEMO-${Date.now()}`,
            }}
            submitLabel="Record payment & issue receipt"
            onSubmit={async (values) => {
              const result = await api(`/invoices/${pay.id}/payments`, {
                method: "POST",
                body: values,
              });
              setPay(null);
              refresh();
              notify(`Payment recorded. Receipt ${result.receipt} created.`);
            }}
          />
        </Modal>
      )}
      {selectedInvoice && (
        <Modal
          title={selectedInvoice.number}
          wide
          onClose={() => setSelected(null)}
        >
          <div className="detail-content">
            <div className="invoice-detail-head">
              <div>
                <h3>{selectedInvoice.customer}</h3>
                <p>
                  Issued {date(selectedInvoice.date)} · Due{" "}
                  {date(selectedInvoice.due_date)}
                </p>
              </div>
              <Badge>{selectedInvoice.status}</Badge>
            </div>
            <DataTable
              search={false}
              rows={selectedInvoice.items}
              columns={[
                { key: "name", label: "Product" },
                { key: "quantity", label: "Quantity" },
                { key: "price", label: "Unit price", type: "money" },
              ]}
            />
            <div className="invoice-totals">
              <span>
                Subtotal <b>{money(selectedInvoice.totals.subtotal)}</b>
              </span>
              <span>
                Discount <b>{money(selectedInvoice.totals.discount)}</b>
              </span>
              <span>
                GST ({selectedInvoice.totals.taxRate}%){" "}
                <b>{money(selectedInvoice.totals.tax)}</b>
              </span>
              <strong>
                Invoice total <b>{money(selectedInvoice.total)}</b>
              </strong>
              <span>
                Outstanding <b>{money(selectedInvoice.outstanding)}</b>
              </span>
            </div>
            <div className="button-row">
              <button
                className="button secondary small"
                onClick={() =>
                  doc("invoice", selectedInvoice.id, selectedInvoice.number)
                }
              >
                <FileDown size={16} /> Invoice PDF
              </button>
              {writable && (
                <>
                  <button
                    className="button secondary small"
                    onClick={() =>
                      share("invoice", selectedInvoice.id, "Email")
                    }
                  >
                    <Mail size={16} /> Demo email
                  </button>
                  <button
                    className="button secondary small"
                    onClick={() =>
                      share("invoice", selectedInvoice.id, "WhatsApp")
                    }
                  >
                    <MessageCircle size={16} /> Demo WhatsApp
                  </button>
                  {selectedInvoice.outstanding > 0 && (
                    <button
                      className="button secondary small"
                      onClick={() =>
                        share("reminder", selectedInvoice.id, "Email")
                      }
                    >
                      Simulate reminder
                    </button>
                  )}
                </>
              )}
            </div>
            <h3>Installment history</h3>
            {payments.error ? (
              <ErrorBox message={payments.error} />
            ) : (
              <DataTable
                rows={
                  payments.data?.filter(
                    (p) => Number(p.invoice_id) === selectedInvoice.id,
                  ) || []
                }
                columns={[
                  { key: "receipt", label: "Receipt" },
                  { key: "amount", label: "Payment", type: "money" },
                  {
                    key: "previous_paid",
                    label: "Previous paid",
                    type: "money",
                  },
                  {
                    key: "remaining",
                    label: "Balance at receipt",
                    type: "money",
                  },
                  { key: "status", label: "Status", type: "status" },
                ]}
                actions={(p) =>
                  p.receipt && (
                    <>
                      <button
                        title="Receipt PDF"
                        onClick={() => doc("receipt", p.id, p.receipt)}
                      >
                        <FileDown size={16} />
                      </button>
                      {writable && (
                        <>
                          <button
                            onClick={() => share("receipt", p.id, "Email")}
                          >
                            Email demo
                          </button>
                          <button
                            onClick={() => share("receipt", p.id, "WhatsApp")}
                          >
                            WhatsApp demo
                          </button>
                        </>
                      )}
                    </>
                  )
                }
              />
            )}
            <p className="muted">
              Receipts preserve the balance at the time of payment. Refunds are
              shown in the current invoice balance.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
