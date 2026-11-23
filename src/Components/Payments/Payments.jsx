import { useState } from "react";
import { FileDown } from "lucide-react";
import { useData, useWorkspace } from "../../utils/context";
import { api, download } from "../../utils/api";
import {
  PageHeader,
  DataTable,
  Modal,
  AddButton,
  Tabs,
  ErrorBox,
  Loading,
} from "../Common/UI";
import RecordForm from "../Common/RecordForm";
import { Confirm } from "../Common/ModulePage";
export default function Payments() {
  const { version, refresh, notify, bootstrap } = useWorkspace();
  const [tab, setTab] = useState("history"),
    [create, setCreate] = useState(false),
    [refund, setRefund] = useState(null),
    [simulate, setSimulate] = useState(null);
  const payments = useData("/payments", version),
    links = useData("/records/paymentLinks", version);
  const data = tab === "history" ? payments : links;
  const writable = bootstrap.user.role !== "Viewer";
  return (
    <>
      <PageHeader
        title="Online payments"
        description="Traceable transactions. Clear balances. Zero real charges."
      >
        {writable && (
          <AddButton onClick={() => setCreate(true)}>
            Create demo payment link
          </AddButton>
        )}
      </PageHeader>
      <div className="notice">
        Simulation workspace · No gateway is connected. Success and failure are
        simulated explicitly; only successful transactions update balances.
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: "history", label: "All payment transactions" },
          { key: "links", label: "Demo payment links" },
        ]}
      />
      {data.error ? (
        <ErrorBox message={data.error} retry={data.reload} />
      ) : data.loading ? (
        <Loading />
      ) : tab === "history" ? (
        <DataTable
          rows={payments.data}
          exportName="payments.csv"
          columns={[
            { key: "receipt", label: "Receipt" },
            { key: "invoice", label: "Invoice" },
            { key: "customer", label: "Customer" },
            { key: "amount", label: "Amount", type: "money" },
            { key: "method", label: "Method" },
            { key: "created_at", label: "Date", type: "date" },
            { key: "status", label: "Status", type: "status" },
          ]}
          actions={(r) => (
            <>
              {r.receipt && (
                <button
                  title="Download receipt"
                  onClick={() =>
                    download(
                      `/documents/receipt/${r.id}`,
                      `${r.receipt}.pdf`,
                    ).catch((e) => notify(e.message, "error"))
                  }
                >
                  <FileDown size={16} />
                </button>
              )}
              {r.status === "Successful" && bootstrap.user.role === "Admin" && (
                <button onClick={() => setRefund(r)}>Refund</button>
              )}
            </>
          )}
        />
      ) : (
        <DataTable
          rows={links.data}
          columns={[
            { key: "reference", label: "Demo link" },
            { key: "invoice", label: "Invoice" },
            { key: "customer", label: "Customer" },
            { key: "amount", label: "Amount", type: "money" },
            { key: "status", label: "Status", type: "status" },
          ]}
          actions={(r) =>
            writable &&
            r.status === "Pending" && (
              <>
                <button
                  onClick={() => setSimulate({ row: r, status: "Successful" })}
                >
                  Simulate success
                </button>
                <button
                  onClick={() => setSimulate({ row: r, status: "Failed" })}
                >
                  Simulate failure
                </button>
              </>
            )
          }
        />
      )}{" "}
      {create && (
        <Modal
          title="Create simulated payment link"
          onClose={() => setCreate(false)}
        >
          <RecordForm
            fields={[{ key: "invoiceId", label: "Invoice", type: "invoice" }]}
            onSubmit={async (values) => {
              await api("/payment-links", { method: "POST", body: values });
              setCreate(false);
              setTab("links");
              refresh();
              notify("Demo payment link created");
            }}
          />
        </Modal>
      )}
      {refund && (
        <Modal
          title={`Refund ${refund.receipt}`}
          onClose={() => setRefund(null)}
        >
          <RecordForm
            fields={[
              {
                key: "reason",
                label: "Refund reason (audit record)",
                type: "text",
              },
            ]}
            submitLabel="Record full refund"
            onSubmit={async (values) => {
              await api(`/payments/${refund.id}/refund`, {
                method: "POST",
                body: values,
              });
              setRefund(null);
              refresh();
              notify("Refund recorded and invoice balance updated");
            }}
          />
        </Modal>
      )}
      {simulate && (
        <Modal
          title="Simulate gateway result"
          onClose={() => setSimulate(null)}
        >
          <Confirm
            text={`Record a ${simulate.status.toLowerCase()} demo payment for ${simulate.row.invoice}?`}
            action={async () => {
              await api(`/payment-links/${simulate.row.id}/simulate`, {
                method: "POST",
                body: { status: simulate.status },
              });
              setSimulate(null);
              refresh();
              notify("Simulation recorded");
            }}
          />
        </Modal>
      )}
    </>
  );
}
