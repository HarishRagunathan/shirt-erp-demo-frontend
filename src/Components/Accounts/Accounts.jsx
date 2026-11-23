import { useState } from "react";
import { useData, useWorkspace } from "../../utils/context";
import { money, api } from "../../utils/api";
import {
  PageHeader,
  DataTable,
  Stat,
  Tabs,
  ErrorBox,
  Loading,
  AddButton,
  Modal,
} from "../Common/UI";
import RecordForm from "../Common/RecordForm";
export default function Accounts() {
  const { version, bootstrap, refresh, notify } = useWorkspace();
  const [tab, setTab] = useState("journal"),
    [open, setOpen] = useState(false);
  const entries = useData("/journals", version),
    accounts = useData("/records/chartOfAccounts", version);
  const rows = entries.data || [];
  const income = rows
    .filter((r) => r.credit_account === "Sales revenue")
    .reduce((s, r) => s + Number(r.amount), 0);
  const expenseAccounts = [
    "Cost of goods sold",
    "Operating expenses",
    "Payroll expense",
    "Stock adjustments",
    "Production variance",
  ];
  const expenses = rows.reduce(
    (s, r) =>
      s +
      (expenseAccounts.includes(r.debit_account) ? Number(r.amount) : 0) -
      (expenseAccounts.includes(r.credit_account) ? Number(r.amount) : 0),
    0,
  );
  const ledger = (accounts.data || [])
    .map((a) => ({
      ...a,
      debit: rows
        .filter((r) => r.debit_account === a.name)
        .reduce((s, r) => s + Number(r.amount), 0),
      credit: rows
        .filter((r) => r.credit_account === a.name)
        .reduce((s, r) => s + Number(r.amount), 0),
    }))
    .map((a) => ({ ...a, balance: a.debit - a.credit }));
  return (
    <>
      <PageHeader
        title="Accounts & finance"
        description="Every entry balanced. Every decision informed."
      >
        {bootstrap.user.role === "Admin" && (
          <AddButton onClick={() => setOpen(true)}>Post journal</AddButton>
        )}
      </PageHeader>
      <div className="stats-grid three">
        <Stat
          label="Revenue (excl. GST)"
          value={money(income)}
          detail="Sales ledger credits"
        />
        <Stat
          label="Expenses & cost of goods"
          value={money(expenses)}
          detail="Posted operating and payroll costs"
        />
        <Stat
          label="Net profit / loss"
          value={money(income - expenses)}
          detail="Revenue less recorded expenses"
        />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: "journal", label: "Journal & daybook" },
          { key: "ledger", label: "General ledger" },
          { key: "chart", label: "Chart of accounts" },
        ]}
      />
      {entries.error ? (
        <ErrorBox message={entries.error} />
      ) : entries.loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={
            tab === "journal"
              ? rows
              : tab === "ledger"
                ? ledger
                : accounts.data || []
          }
          exportName={`${tab}.csv`}
          columns={
            tab === "journal"
              ? [
                  { key: "date", label: "Date", type: "date" },
                  { key: "reference", label: "Reference" },
                  { key: "description", label: "Description" },
                  { key: "debit_account", label: "Debit account" },
                  { key: "credit_account", label: "Credit account" },
                  { key: "amount", label: "Amount", type: "money" },
                ]
              : tab === "ledger"
                ? [
                    { key: "name", label: "Account" },
                    { key: "type", label: "Type" },
                    { key: "debit", label: "Debit", type: "money" },
                    { key: "credit", label: "Credit", type: "money" },
                    {
                      key: "balance",
                      label: "Net debit balance",
                      type: "money",
                    },
                  ]
                : [
                    { key: "name", label: "Account name" },
                    { key: "type", label: "Account type" },
                  ]
          }
        />
      )}
      {open && (
        <Modal title="Post balanced journal" onClose={() => setOpen(false)}>
          <RecordForm
            fields={[
              { key: "description", label: "Description", type: "text" },
              {
                key: "debit",
                label: "Debit account",
                type: "select",
                options: (accounts.data || []).map((a) => a.name),
              },
              {
                key: "credit",
                label: "Credit account",
                type: "select",
                options: (accounts.data || []).map((a) => a.name),
              },
              { key: "amount", label: "Amount", type: "number" },
            ]}
            onSubmit={async (values) => {
              await api("/journals", { method: "POST", body: values });
              setOpen(false);
              refresh();
              notify("Journal posted");
            }}
          />
        </Modal>
      )}
    </>
  );
}
